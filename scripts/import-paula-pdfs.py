"""Importa os PDFs locais de Paula usando os mesmos blocos e extrator do piloto.

Requer os extratores locais em PYTHONPATH. Os caches de geometria e de extração
independente ficam em sources/, fora do aplicativo. Não acessa sites externos.
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
CONFIG = {
    'encontrei-o-sol-nos-seus-olhos': {
        'file': 'Encontrei_o_sol_nos_seus.pdf', 'count': 33, 'left': 66.49218472949218,
        'hash': '3144fcb5a386efe214191b1319ff3a2d1b6a28eedaef9ef35feaac60f6f55860',
    },
    'close-call': {
        'file': 'close_call.pdf', 'count': 27, 'left': 76.99218429199217,
        'hash': '5aed8bce7139aa324ecc592de2712ea3cf5ace46baebcca487cb8d0d6a6ebe0f',
    },
}
MARKERS = base.EDITORIAL_MARKERS | {'Chapter Text', 'Chapter Summary'}
POV_LABELS = {'Lorena', 'Juquinha', 'Eduarda'}
IMAGE_ALT = {
    (392, 0): 'Figurinha: montagem de uma mulher com um balde de pipoca junto a um carrinho de pipoca.',
    (393, 0): 'Figurinha com os textos “CÊ TAVA SUMIDO!” e “passei uns dias no #1 MAS JÁ VOLTEI!”.',
    (394, 0): 'Figurinha de elevador: “SOBE?” junto ao #1 e “DESCE.” junto ao #2.',
    (394, 1): 'Figurinha com uma montagem e o texto “Vamos FRAGOAT! Temos uma guerra a impedir”.',
}


def serialized(value):
    return json.dumps(value, ensure_ascii=False, indent=2) + '\n'


def import_work(work_id):
    config = CONFIG[work_id]
    source = ROOT / 'sources' / config['file']
    source_hash = sha256(source.read_bytes()).hexdigest()
    assert source_hash == config['hash'], 'Revisar o exemplar antes de importar outro PDF'
    layout_path = ROOT / 'sources' / f'{work_id}-layout.json'
    text_path = ROOT / 'sources' / f'{work_id}-text.json'
    if not layout_path.exists():
        layout_path.write_text(serialized({'sourceSha256': source_hash,
                               'pages': base.load_layout(source, source_hash, fresh=True)}), encoding='utf8')
    if not text_path.exists():
        reader = base.PdfReader(source)
        outline = []
        def walk(items):
            for item in items:
                if isinstance(item, list):
                    walk(item)
                elif match := re.fullmatch(r'Chapter (\d+): (.+)', item.title):
                    outline.append({'number': int(match[1]), 'title': match[2],
                                    'page': reader.get_destination_page_number(item) + 1})
        walk(reader.outline)
        text_path.write_text(serialized({'sha256': source_hash, 'outline': outline,
                             'pages': [page.extract_text() for page in reader.pages]}), encoding='utf8')
    layout = json.loads(layout_path.read_text(encoding='utf8'))
    independent = json.loads(text_path.read_text(encoding='utf8'))
    assert layout['sourceSha256'] == independent['sha256'] == source_hash
    pages, outlines = layout['pages'], independent['outline']
    assert len(outlines) == config['count']
    assert [chapter['number'] for chapter in outlines] == list(range(1, config['count'] + 1))
    assert len(pages) == len(independent['pages'])
    unmapped = []
    # O próprio exemplar imprime .notdef como quadrado; não inferir emojis ausentes.
    # CID 3 é o espaço de largura 3.75pt, confirmado visualmente na página 953.
    substitutions = {'(cid:0)': '□', '(cid:3)': ' '}
    for page in pages:
        for line in page['lines']:
            if '(cid:' not in line['text']:
                continue
            seen, chars = set(), []
            for char in line['chars']:
                if '(cid:' in char[0]:
                    key = tuple(char)
                    if key in seen:
                        continue
                    seen.add(key)
                    assert char[0] in substitutions and char[3].startswith('DejaVuSerif')
                    replacement = substitutions[char[0]]
                    unmapped.append({'page': page['number'], 'cid': char[0], 'representation': replacement,
                                     'font': char[3], 'x0': char[1], 'x1': char[2]})
                    char = [replacement, *char[1:]]
                chars.append(char)
            line['chars'] = chars
            for token, replacement in substitutions.items():
                line['text'] = line['text'].replace(token, replacement)
            assert '(cid:' not in line['text']
    independent['pages'] = [text.replace('\x00', '□').replace('\x03', ' ') for text in independent['pages']]
    image_pages = [page for page in pages if page['images']]
    image_events, image_payloads, image_report = {}, {}, []
    if image_pages:
        assert work_id == 'close-call' and sum(len(page['images']) for page in image_pages) == 4
        reader = base.PdfReader(source)
        for page in image_pages:
            originals = reader.pages[page['number'] - 1].images
            assert len(originals) == len(page['images'])
            for index, (position, original) in enumerate(zip(page['images'], originals)):
                data = original.data
                assert data[:2] == b'\xff\xd8' and data[-2:] == b'\xff\xd9', 'Preservar o JPEG original'
                src = f'/images/chapters/{work_id}/page-{page["number"]}-image-{index + 1}.jpg'
                image_payloads[ROOT / 'public' / src.lstrip('/')] = data
                image_events.setdefault(page['number'], []).append({**position, 'page': page['number'],
                    'image': {'src': src, 'alt': IMAGE_ALT[(page['number'], index)], 'alignment': 'left'}})
                image_report.append({'page': page['number'], 'src': src, 'sha256': sha256(data).hexdigest(),
                                     'width': original.image.width, 'height': original.image.height})
    assert base.no_whitespace(independent['pages'][-1]).startswith('PleasedropbytheArchiveandcomment')
    left, right = config['left'], 612 - config['left']
    width = right - left
    report = {
        'source': {'file': source.name, 'sha256': source_hash, 'pages': len(pages)},
        'chapterCount': len(outlines), 'chapters': [], 'images': image_report, 'pageBoundaries': [],
        'sourceGlyphLimitations': unmapped,
        'limitations': [
            'PDF sem tags de parágrafo: reconstituição pela geometria das linhas.',
            'Texto, pontuação, ordem e glifos com negrito/itálico conferidos durante a importação.',
            'Comparação independente com pypdf; revisão editorial humana dos espaços e parágrafos pendente.',
        ],
    }

    def alignment(lines):
        if all(abs(line['x0'] - left) < 1 for line in lines):
            return 'left'
        if all(abs(line['x0'] + line['x1'] - 612) < 3.5 for line in lines):
            return 'center'
        if all(abs(line['x1'] - right) < 1 for line in lines):
            return 'right'
        return 'left'

    def continues(previous, following, pending):
        first_word = re.search(r'\S+', following['text'])
        first_chars = []
        length = 0
        for char in following['chars']:
            if length >= len(base.no_whitespace(first_word[0])):
                break
            first_chars.append(char)
            length += len(base.no_whitespace(char[0]))
        first_width = max(char[2] for char in first_chars) - min(char[1] for char in first_chars)
        return (abs(previous['x0'] - left) < 1 and abs(following['x0'] - left) < 1
                and right - previous['x1'] <= max(first_width, 2 * previous['chars'][0][4])
                and alignment(pending) == 'left' and not base.bold_line(previous)
                and not re.fullmatch(r'[#*_]+', previous['text']))

    def build(events, chapter_id, expected_header=None):
        content = {'id': chapter_id, 'blocks': [], 'notes': {'before': [], 'after': []}}
        pending, counter, state = [], 0, 'body'
        header_glyphs = ''
        expected = base.no_whitespace(expected_header) if expected_header else ''
        source_text, source_styles, consumed, excluded = [], Counter(), Counter(), []

        def flush():
            nonlocal counter
            if not pending:
                return
            runs = []
            for index, line in enumerate(pending):
                if index:
                    previous = pending[index - 1]
                    separator = '' if previous['text'].endswith(('-', '\u00ad')) else (
                        '\n' if previous['page'] == line['page'] and previous['x1'] - previous['x0'] < width * .73 else ' ')
                    base.add_run(runs, separator)
                for run in base.line_runs(line, pages[line['page'] - 1]['links']):
                    base.add_run(runs, run['text'], run['style'])
                    for char in base.no_whitespace(run['text']):
                        consumed[(char, *run['style'][:2])] += 1
            text = ''.join(run['text'] for run in runs)
            assert text.strip() and '\ufffd' not in text
            counter += 1
            block = {'id': f'{chapter_id}-{counter:04}', 'type': 'paragraph', 'text': text}
            if re.fullmatch(r'[#*_·•\-—]{3,}|\*|\*\s*\*\s*\*', text):
                block['type'] = 'divider'
            else:
                align = alignment(pending)
                if align == 'center' and all(base.bold_line(line) for line in pending):
                    block.update(type='heading', level=3)
                if align != 'left':
                    block['alignment'] = align
            if any(any(run['style']) for run in runs):
                block['segments'] = base.segments(runs)
            (content['blocks'] if state == 'body' else content['notes'][state]).append(block)
            pending.clear()

        for event in events:
            if 'image' in event:
                flush()
                counter += 1
                image = {'id': f'{chapter_id}-{counter:04}', 'type': 'image', **event['image']}
                (content['blocks'] if state == 'body' else content['notes'][state]).append(image)
                continue
            text = event['text']
            if header_glyphs != expected:
                header_glyphs += base.no_whitespace(text)
                assert expected.startswith(header_glyphs), f'Cabeçalho divergente: {chapter_id}'
                continue
            if text in MARKERS:
                flush()
                excluded.append({'page': event['page'], 'marker': text})
                state = 'before' if text in {'Chapter Notes', 'Chapter Summary'} else 'after' if text == 'Chapter End Notes' else 'body'
                continue
            # Limites conferidos nos PDFs: POVs e o artigo que abre close call 19.
            if state == 'before' and (text in POV_LABELS or (
                    work_id == 'close-call' and chapter_id == 'cap-19' and text.startswith('O Brasil avança'))):
                flush()
                state = 'body'
            source_text.append(text)
            for char in event['chars']:
                style = base.style_at(char, event, pages[event['page'] - 1]['links'])
                for letter in base.no_whitespace(char[0]):
                    source_styles[(letter, *style[:2])] += 1
            if pending:
                previous = pending[-1]
                if previous['page'] != event['page']:
                    join = continues(previous, event, pending)
                    report['pageBoundaries'].append({'chapter': chapter_id, 'nextPage': event['page'], 'joined': join})
                    if not join:
                        flush()
                else:
                    size = median(char[4] for char in previous['chars'])
                    if event['top'] - previous['top'] > size * 1.35:
                        flush()
            pending.append(event)
        flush()
        assert header_glyphs == expected and content['blocks']
        original = base.no_whitespace(''.join(source_text))
        imported = base.no_whitespace(base.text_of(content))
        assert original == imported, f'Texto perdido ou fora de ordem: {chapter_id}'
        assert consumed == source_styles, f'Formatação divergente: {chapter_id}'
        return content, original, consumed, excluded

    def events(start, end):
        return [event for number in range(start, end + 1)
                for event in sorted([{**line, 'page': number} for line in pages[number - 1]['lines']]
                                    + image_events.get(number, []), key=lambda item: item['top'])]

    initial = events(1, outlines[0]['page'] - 1)
    note_index = next(index for index, event in enumerate(initial) if event['text'] == 'Notes')
    work_content, work_glyphs, _, _ = build(initial[note_index + 1:], 'work-note')
    independent_notes = '\n'.join(independent['pages'][:outlines[0]['page'] - 1]).split('\nNotes\n', 1)[1]
    assert work_glyphs == base.no_whitespace(independent_notes)
    report['workNotesSha256'] = base.digest(work_glyphs)
    chapters, artifacts = [], {}
    for index, chapter in enumerate(outlines):
        number, title, start = chapter['number'], chapter['title'], chapter['page']
        end = outlines[index + 1]['page'] - 1 if index + 1 < len(outlines) else len(pages) - 1
        cid = f'cap-{number:02}'
        header = f'Chapter {number}: {title}'
        content, glyphs, styles, excluded = build(events(start, end), cid, header)
        independently_extracted = base.no_whitespace(''.join(line for page in independent['pages'][start - 1:end]
                                       for line in page.splitlines() if line.strip() not in MARKERS))
        assert independently_extracted.startswith(base.no_whitespace(header))
        independently_extracted = independently_extracted[len(base.no_whitespace(header)):]
        assert glyphs == independently_extracted, f'Extrações independentes divergem: {cid}'
        payload = serialized(content)
        artifacts[ROOT / 'src/content/chapters' / work_id / f'{cid}.json'] = payload
        chapters.append({'id': cid, 'number': number, 'title': title,
                         'notes': {'hasBefore': bool(content['notes']['before']), 'hasAfter': bool(content['notes']['after']), 'before': [], 'after': []},
                         'contentWarnings': [], 'blocks': []})
        report['chapters'].append({
            'id': cid, 'number': number, 'title': title, 'startPage': start, 'endPage': end,
            'bodyBlocks': len(content['blocks']), 'notesBefore': len(content['notes']['before']), 'notesAfter': len(content['notes']['after']),
            'sourceGlyphSha256': base.digest(glyphs), 'independentGlyphSha256': base.digest(independently_extracted),
            'fileSha256': base.digest(payload), 'structuredTextSha256': base.digest(base.text_of(content)),
            'nonWhitespaceCharacters': len(glyphs), 'italicCharacters': sum(v for (_, italic, _), v in styles.items() if italic),
            'boldCharacters': sum(v for (_, _, bold), v in styles.items() if bold), 'editorialMarkersExcluded': excluded,
        })
        print(f'{work_id}/{cid}: {len(content["blocks"])} blocos; notas {len(content["notes"]["before"])}/{len(content["notes"]["after"])}', flush=True)

    catalog_path = ROOT / 'src/content/works.json'
    catalog_text = catalog_path.read_text(encoding='utf8')
    catalog = json.loads(catalog_text)
    work = next(work for work in catalog if work['id'] == work_id)
    assert work['author']['ao3Name'] == 'wildshoni'
    assert not work['chapters'] or work['chapters'] == chapters, 'Não sobrescrever capítulos existentes'
    work['chapters'] = chapters
    work['workNotes'] = work_content['blocks']
    work['reading']['mode'] = 'internal'
    work['editorial']['contentReady'] = False
    start = catalog_text.index('  {\n    "id": "' + work_id + '"')
    _, end = json.JSONDecoder().raw_decode(catalog_text, start + 2)
    updated = catalog_text[:start] + '\n'.join('  ' + line for line in serialized(work).rstrip().splitlines()) + catalog_text[end:]
    assert json.loads(updated) == catalog
    for target, payload in artifacts.items():
        assert not target.exists() or target.read_text(encoding='utf8') == payload, f'Preservar arquivo existente: {target}'
    for target, payload in image_payloads.items():
        assert not target.exists() or target.read_bytes() == payload, f'Preservar imagem existente: {target}'
    for target, payload in artifacts.items():
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(payload.encode('utf8'))
    for target, payload in image_payloads.items():
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(payload)
    catalog_path.write_bytes(updated.encode('utf8'))
    (ROOT / 'docs' / f'IMPORTACAO-{work_id.upper()}.json').write_bytes(serialized(report).encode('utf8'))
    print(f'{work_id}: {len(chapters)} capítulos importados; conteúdo conferido nas duas extrações.', flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('work', choices=list(CONFIG))
    import_work(parser.parse_args().work)
