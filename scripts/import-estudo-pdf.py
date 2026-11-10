"""Importação local de estudo de caso; reutiliza a extração e os segmentos do piloto.

Requer pdfplumber/pypdf em PYTHONPATH. Não acessa o AO3 nem instala ferramentas.
O PDF e os caches permanecem em sources/. Não modifica outras obras.
"""
from __future__ import annotations

import argparse
from collections import Counter
from hashlib import sha256
import importlib.util
import json
from pathlib import Path
import re
from statistics import median
import sys

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('pilot', Path(__file__).with_name('import-morte-pdf.py'))
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)
ROOT = base.ROOT
WORK = 'estudo-de-caso'
SOURCE_HASH = '06da5c4120e669c494cbc11949ffdb389dd9dbb806aa554c4dc0d7229a9593c0'
MARKERS = base.EDITORIAL_MARKERS | {'Chapter Text', 'Chapter Summary'}
END_NOTE_REFERENCES = {'See the end of the chapter for notes', 'See the end of the chapter for more notes'}


def serialized(value):
    return json.dumps(value, ensure_ascii=False, indent=2) + '\n'


def load_source(path):
    source_hash = sha256(path.read_bytes()).hexdigest()
    assert source_hash == SOURCE_HASH, 'Revisar o exemplar antes de importar outro PDF'
    cache = ROOT / 'sources/estudo-source.json'
    if cache.exists():
        source = json.loads(cache.read_text(encoding='utf8'))
        assert source['sha256'] == source_hash
        return source
    reader = base.PdfReader(path)
    outlines = []
    def walk(items):
        for item in items:
            if isinstance(item, list):
                walk(item)
            elif re.fullmatch(r'Chapter \d+', item.title):
                outlines.append({'number': int(item.title.split()[-1]), 'title': item.title,
                                 'page': reader.get_destination_page_number(item) + 1})
    walk(reader.outline)
    source = {'sha256': source_hash, 'outline': outlines,
              'text': [page.extract_text() for page in reader.pages], 'pages': []}
    # Mesma extração do piloto, acrescida dos separadores vetoriais deste PDF.
    with base.pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            lines = [{**{key: line[key] for key in ('text', 'x0', 'x1', 'top', 'bottom')},
                      'chars': [[c['text'], c['x0'], c['x1'], c['fontname'], c['size']] for c in line['chars']]}
                     for line in page.extract_text_lines()]
            rules = [rect['top'] for rect in page.rects
                     if abs(rect['x0'] - 77.25) < .01 and abs(rect['width'] - 457.5) < .01
                     and abs(rect['height'] - .75) < .01
                     and rect['non_stroking_color'] == (0.6039, 0.6039, 0.6039)
                     and 0 <= rect['top'] < page.height]
            source['pages'].append({'number': page.page_number, 'lines': lines, 'rules': rules,
                'images': len(page.images),
                'links': [{key: link.get(key) for key in ('x0', 'x1', 'top', 'bottom', 'uri')} for link in page.hyperlinks]})
            page.close()
    cache.write_text(serialized(source), encoding='utf8')
    return source


def import_work(path):
    source = load_source(path)
    pages, outlines = source['pages'], source['outline']
    assert len(pages) == len(source['text']) == 499
    assert len(outlines) == 17 and [c['number'] for c in outlines] == list(range(1, 18))
    assert not any(page['images'] for page in pages), 'Extrair imagens antes de importar'
    assert source['text'][-1].startswith('Please drop by the Archive and comment')
    report = {'source': {'file': path.name, 'sha256': source['sha256'], 'pages': len(pages)},
        'chapterCount': 17, 'chapters': [], 'pageBoundaries': [], 'sourceGlyphLimitations': [],
        'limitations': ['PDF sem tags semânticas de parágrafo: espaços e quebras reconstituídos pela geometria.',
                        'Texto, ordem, notas, links, separadores e formatação recuperável conferidos na importação.',
                        'Revisão editorial humana da disposição dos parágrafos permanece pendente.']}
    # O glifo .notdef aparece como um quadrado vazio no próprio PDF (p. 426).
    # Preservar sua representação visível, sem adivinhar um emoji ausente.
    for page in pages:
        for line in page['lines']:
            if '(cid:' not in line['text']:
                continue
            assert page['number'] == 426 and line['text'] == 'Lorena: ♥ (cid:0)😍'
            seen, chars = set(), []
            for char in line['chars']:
                if '(cid:' in char[0]:
                    assert char[0] == '(cid:0)' and char[3] == 'DejaVuSerif'
                    key = tuple(char)
                    if key in seen:
                        continue
                    seen.add(key)
                    report['sourceGlyphLimitations'].append({'page': 426, 'cid': char[0], 'font': char[3],
                        'representation': '□', 'reason': 'Glifo .notdef: quadrado vazio visível no PDF original.'})
                    char[0] = '□'
                chars.append(char)
            line['chars'] = chars
            line['text'] = line['text'].replace('(cid:0)', '□')
    assert len(report['sourceGlyphLimitations']) == 1
    independent_pages = [text.replace('\x00', '□') for text in source['text']]

    def alignment(lines):
        if all(abs(line['x0'] - 76.9921843) < 1 for line in lines):
            return 'left'
        if all(abs(line['x1'] - 535) < .1 for line in lines):
            return 'right'
        if all(abs(line['x0'] + line['x1'] - 612) < 3.5 for line in lines):
            return 'center'
        return 'left'

    def continues(previous, following, pending):
        left = round(previous['x0'])
        if left not in (77, 92) or abs(following['x0'] - previous['x0']) > 1:
            return False
        first_word = re.search(r'\S+', following['text'])[0]
        first_chars, length = [], 0
        for char in following['chars']:
            if length >= len(base.no_whitespace(first_word)):
                break
            first_chars.append(char)
            length += len(base.no_whitespace(char[0]))
        first_width = max(c[2] for c in first_chars) - min(c[1] for c in first_chars)
        right = 612 - previous['x0']
        return (following['top'] < 76 and right - previous['x1'] < first_width + 3.8
                and alignment(pending) == 'left' and not base.bold_line(previous)
                and not re.fullmatch(r'\*+', previous['text']))

    def events(start, end):
        return [event for number in range(start, end + 1)
                for event in sorted([{**line, 'page': number} for line in pages[number - 1]['lines']]
                                    + [{'page': number, 'top': top, 'rule': True} for top in pages[number - 1]['rules']],
                                    key=lambda item: item['top'])]

    def build(items, cid, header=''):
        content = {'id': cid, 'blocks': [], 'notes': {'before': [], 'after': []}}
        pending, counter, state, header_text = [], 0, 'body', ''
        source_lines, source_styles, consumed, excluded, rules = [], Counter(), Counter(), [], []
        def destination():
            return content['blocks'] if state == 'body' else content['notes'][state]
        def flush():
            nonlocal counter
            if not pending:
                return
            runs = []
            for index, line in enumerate(pending):
                if index:
                    previous = pending[index - 1]
                    # Preservar versos/quebras explícitas; refluem apenas linhas de prosa.
                    separator = '' if previous['text'].endswith(('-', '\u00ad')) else (
                        '\n' if previous['page'] == line['page'] and previous['x1'] - previous['x0'] < 330 else ' ')
                    base.add_run(runs, separator)
                for run in base.line_runs(line, pages[line['page'] - 1]['links']):
                    base.add_run(runs, run['text'], run['style'])
                    for char in base.no_whitespace(run['text']):
                        consumed[(char, *run['style'])] += 1
            text = ''.join(run['text'] for run in runs)
            assert text.strip() and '\ufffd' not in text and '(cid:' not in text
            counter += 1
            block = {'id': f'{cid}-{counter:04}', 'type': 'paragraph', 'text': text}
            if re.fullmatch(r'\*{3,}', text):
                block['type'] = 'divider'
            else:
                align = alignment(pending)
                # Títulos de reportagens e documentos identificados pela fonte em negrito.
                if all(base.bold_line(line) for line in pending):
                    block.update(type='heading', level=3)
                if align != 'left':
                    block['alignment'] = align
            if any(any(run['style']) for run in runs):
                block['segments'] = base.segments(runs)
            destination().append(block)
            pending.clear()
        for event in items:
            if event.get('rule'):
                flush()
                counter += 1
                destination().append({'id': f'{cid}-{counter:04}', 'type': 'divider'})
                rules.append({'page': event['page'], 'top': event['top']})
                continue
            text = event['text']
            if header_text != header:
                header_text += text
                assert header.startswith(header_text), f'Cabeçalho divergente: {cid}'
                continue
            if text in MARKERS:
                flush()
                excluded.append({'page': event['page'], 'marker': text})
                if text in {'Chapter Notes', 'Chapter Summary'}:
                    state = 'before'
                elif text == 'Chapter End Notes':
                    state = 'after'
                elif text == 'Chapter Text' or text in END_NOTE_REFERENCES:
                    state = 'body'
                continue
            source_lines.append(text)
            for char in event['chars']:
                style = base.style_at(char, event, pages[event['page'] - 1]['links'])
                for letter in base.no_whitespace(char[0]):
                    source_styles[(letter, *style)] += 1
            if pending:
                previous = pending[-1]
                if previous['page'] != event['page']:
                    join = continues(previous, event, pending)
                    report['pageBoundaries'].append({'chapter': cid, 'nextPage': event['page'], 'joined': join,
                        'previous': previous['text'], 'following': text})
                    if not join:
                        flush()
                elif event['top'] - previous['top'] > median(c[4] for c in previous['chars']) * 1.5:
                    flush()
            pending.append(event)
        flush()
        assert header_text == header and content['blocks']
        original = base.no_whitespace(''.join(source_lines))
        imported = base.no_whitespace(base.text_of(content))
        assert original == imported, f'Texto perdido, duplicado ou fora de ordem: {cid}'
        assert source_styles == consumed, f'Formatação ou links divergentes: {cid}'
        return content, original, consumed, excluded, rules

    initial = events(2, 2)
    note_start = next(i for i, e in enumerate(initial) if e.get('text') == 'Notes')
    work_notes, work_glyphs, _, _, _ = build(initial[note_start + 1:], 'work-note')
    assert work_glyphs == base.no_whitespace(independent_pages[1].split('\nNotes\n', 1)[1])
    report['workNotesSha256'] = base.digest(work_glyphs)
    chapters, artifacts = [], {}
    for index, chapter in enumerate(outlines):
        number, title, start = chapter['number'], chapter['title'], chapter['page']
        end = outlines[index + 1]['page'] - 1 if index + 1 < len(outlines) else 498
        cid = f'cap-{number:02}'
        content, glyphs, styles, excluded, rules = build(events(start, end), cid, title)
        independent = base.no_whitespace(''.join(line for page in independent_pages[start - 1:end]
                                        for line in page.splitlines() if line.strip() not in MARKERS))
        assert independent.startswith(base.no_whitespace(title))
        independent = independent[len(base.no_whitespace(title)):]
        assert glyphs == independent, f'Extrações independentes divergentes: {cid}'
        # Aviso explícito do resumo inicial do capítulo 6; texto integral também preservado nas notas.
        warnings = ['Atentado com arma de fogo, sangue e descrição de sentimentos ligados a morte.'] if number == 6 else []
        payload = serialized(content)
        artifacts[ROOT / f'src/content/chapters/{WORK}/{cid}.json'] = payload
        chapters.append({'id': cid, 'number': number, 'title': title,
                         'notes': {'hasBefore': bool(content['notes']['before']), 'hasAfter': bool(content['notes']['after']), 'before': [], 'after': []},
                         'contentWarnings': warnings, 'blocks': []})
        report['chapters'].append({'id': cid, 'number': number, 'title': title, 'startPage': start, 'endPage': end,
            'bodyBlocks': len(content['blocks']), 'notesBefore': len(content['notes']['before']), 'notesAfter': len(content['notes']['after']),
            'sourceGlyphSha256': base.digest(glyphs), 'importedGlyphSha256': base.digest(base.no_whitespace(base.text_of(content))),
            'independentGlyphSha256': base.digest(independent), 'structuredTextSha256': base.digest(base.text_of(content)),
            'fileSha256': base.digest(payload), 'nonWhitespaceCharacters': len(glyphs),
            'italicCharacters': sum(v for (_, italic, _, _), v in styles.items() if italic),
            'boldCharacters': sum(v for (_, _, bold, _), v in styles.items() if bold),
            'links': sorted({href for (_, _, _, href) in styles if href}),
            'vectorDividers': rules, 'editorialMarkersExcluded': excluded})
        print(f'{cid}: páginas {start}–{end}; {len(content["blocks"])} blocos; notas {len(content["notes"]["before"])}/{len(content["notes"]["after"])}', flush=True)
    work = {
        'id': WORK, 'slug': WORK, 'title': 'estudo de caso',
        'author': {'displayName': 'nonielb', 'ao3Name': 'nonielb', 'authorLink': 'https://x.com/noniel_b'},
        'ao3Authors': ['nonielb'], 'relationships': ['Lorena Ferette/Eduarda "Juquinha" Fragoso'],
        'characters': ['Eduarda "Juquinha" Fragoso', 'Lorena Ferette', 'Santiago Ferette', 'Paulo "Paulinho" Reitz',
                       'Gerluce Maria das Graças', 'Maggye Damatta', 'Lolô (Três Graças)'],
        'synopsis': '"Macedo!", passos rápidos, urgentes, obedientes. Como devem ser, quando seu dono chama. Como os de Zenilda se tornaram. Como os de Leonardo são. Como os de Lorena nunca foram.\n\n"Pois não, doutor?"\n\n"Pegue o carro. Tenho uma tarefa pra você."\n\nOU\n\nSantiago Ferette é um covarde narcisista e Eduarda Fragoso é um problema.',
        'status': 'completed', 'language': 'pt-BR', 'fandom': 'Três Graças (TV) — Loquinha', 'category': 'F/F',
        'classification': {'rating': 'Mature (M)', 'archiveWarning': 'Graphic Depictions Of Violence'},
        'tags': ['Canon Compliant', 'Character Study', 'Established Relationship', 'Fluff and Angst',
                 'author is ace but these hoes are NOT', 'Medical Recovery', 'Panic Attacks', 'Hospitalization'],
        'contentAdvisories': ['Atentado com arma de fogo, pensamentos relacionados a morte, descrição (leve) de ataques de pânico.'],
        'stats': {'words': 162836, 'publishedChapters': 17, 'plannedChapters': 17,
                  'publishedAt': '2026-03-25', 'updatedAt': '2026-09-30'},
        'cover': {'variant': 'typographic', 'tone': 'violet', 'ornament': 'stars', 'caption': ''},
        'reading': {'mode': 'internal', 'externalUrl': None}, 'downloads': {'enabled': True},
        'links': {'original': 'https://archiveofourown.org/works/81846846'},
        'editorial': {'submittedByAuthor': True, 'contentReady': False, 'sourceFile': path.name,
                      'sourceUpdatedAt': '2026-09-30', 'coverOfficial': False},
        'chapters': chapters, 'workNotes': work_notes['blocks'],
    }
    catalog_path = ROOT / 'src/content/works.json'
    catalog_text = catalog_path.read_text(encoding='utf8')
    catalog = json.loads(catalog_text)
    existing = [w for w in catalog if w['id'] == WORK]
    assert not existing or (len(existing) == 1 and existing[0] == work), 'Preservar cadastro existente divergente'
    updated_catalog = catalog_text
    if not existing:
        assert catalog_text.endswith('\n]\n')
        entry = '\n'.join('  ' + line for line in serialized(work).rstrip().splitlines())
        updated_catalog = catalog_text[:-3] + ',\n' + entry + '\n]\n'
        assert json.loads(updated_catalog)[:-1] == catalog
        assert json.loads(updated_catalog)[-1] == work
    for target, payload in artifacts.items():
        assert not target.exists() or target.read_text(encoding='utf8') == payload, f'Preservar capítulo existente: {target}'
    for target, payload in artifacts.items():
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(payload.encode('utf8'))
    catalog_path.write_bytes(updated_catalog.encode('utf8'))
    (ROOT / 'docs/IMPORTACAO-ESTUDO-DE-CASO.json').write_bytes(serialized(report).encode('utf8'))
    print('17 capítulos importados; texto, ordem, formatação e links conferidos com duas extrações locais.', flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('pdf', nargs='?', type=Path, default=ROOT / 'sources/estudo_de_caso.pdf')
    import_work(parser.parse_args().pdf)
