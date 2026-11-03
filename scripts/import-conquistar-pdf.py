"""Importação local de Como conquistar (e perder) uma mulher em 30 dias; reutiliza o extrator do piloto.

PYTHONPATH deve apontar para pdfplumber, pypdf e Pillow. --check não escreve.
"""
from __future__ import annotations
import argparse
from collections import Counter
from hashlib import sha256
import importlib.util
import json
from pathlib import Path
import re
import sys

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('pilot', Path(__file__).with_name('import-morte-pdf.py'))
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)
ROOT = base.ROOT
WORK = 'como-conquistar-e-perder'
REPORT = ROOT / 'docs/IMPORTACAO-COMO-CONQUISTAR-E-PERDER.json'
# Limites das notas iniciais conferidos no exemplar fornecido (sem Chapter Text).
BODY_START = {12: 'Era quinta-feira,', 14: '— Tá, o que a gente vai fazer?', 19: 'O dia amanheceu ensolarado', 22: 'Eduarda Fragoso encarava os carros', 29: 'Lorena estava andando pelas ruas de Roma', 4: '— Isso ficou muito bom, Lenna!', 7: 'Exatamente às oito horas', 8: 'Sábado amanheceu', 15: 'Lorena Ferette sentia', 16: 'Ao chegar em casa naquela madrugada', 17: 'Na manhã de sexta', 18: 'Eduarda tinha tanto receio', 20: '— Cara que saudade de você!', 21: 'Lorena Ferette era perfeita.', 23: '“Que as velas', 25: '“ Depois de percorrermos', 26: '“– Esse amor', 27: 'Eduarda Fragoso sabia', 28: 'O fundador da cidade', 30: 'Lorena Ferette nunca teve sorte'}
MARKERS = base.EDITORIAL_MARKERS | {'Chapter Text', 'Chapter Summary'}


def serialized(value):
    return json.dumps(value, ensure_ascii=False, indent=2) + '\n'

def run(path, check=False, fresh=False):
    source_hash = sha256(path.read_bytes()).hexdigest()
    assert source_hash == '1e7ddf430e228149d412c5afcc1a06ecec2291b38b1baf0a04281d031affff6a', 'PDF diferente do exemplar conferido: revisar antes de importar'
    reader = base.PdfReader(path)
    assert len(reader.pages) == 465
    outlines = []
    for item in reader.outline:
        if not isinstance(item, list) and (match := re.fullmatch(r'Chapter (\d+): (.+)', item.title)):
            outlines.append((int(match[1]), match[2].strip(), reader.get_destination_page_number(item) + 1))
    assert len(outlines) == 30 and [x[0] for x in outlines] == list(range(1, 31))
    cache_path = ROOT / 'sources/conquistar-layout.json'
    if fresh or not cache_path.exists():
        pages = base.load_layout(path, source_hash, fresh=True)
        if not check:
            cache_path.write_text(serialized({'sourceSha256': source_hash, 'pages': pages}), encoding='utf8')
    else:
        cached = json.loads(cache_path.read_text(encoding='utf8'))
        assert cached['sourceSha256'] == source_hash, 'Cache de outro PDF'
        pages = cached['pages']
    assert not any(page['images'] for page in pages), 'Revisar e extrair imagens antes de importar'
    report = {'source': {'file': path.name, 'sha256': source_hash, 'pages': len(pages)},
              'chapterCount': 30, 'chapters': [], 'pageBoundaries': [],
              'limitations': ['PDF sem tags de parágrafo: espaços e quebras reconstituídos pela geometria.',
                              'Revisão editorial humana da disposição dos parágrafos pendente.']}
    artifacts = {}
    chapters = []
    for index, (number, title, start) in enumerate(outlines):
        cid = f'cap-{number:02}'
        end = outlines[index + 1][2] - 1 if index + 1 < len(outlines) else 464
        content = {'id': cid, 'blocks': [], 'notes': {'before': [], 'after': []}}
        state, pending, header = 'body', [], True
        source_lines, consumed, source_styles, discarded = [], Counter(), Counter(), []
        counter = 0
        header_glyphs = ''

        def flush():
            nonlocal pending, counter
            if not pending:
                return
            runs = []
            for i, line in enumerate(pending):
                if i:
                    base.add_run(runs, base.separator_between(pending[i - 1], line, pending))
                for part in base.line_runs(line, pages[line['page'] - 1]['links']):
                    base.add_run(runs, part['text'], part['style'])
                    for char in base.no_whitespace(part['text']):
                        consumed[(char, *part['style'][:2])] += 1
            text = ''.join(part['text'] for part in runs)
            counter += 1
            block = {'id': f'{cid}-{counter:04}', 'type': 'paragraph', 'text': text}
            align = base.alignment(pending)
            if re.fullmatch(r'[#*_·•\-—]{3,}|\*', text):
                block['type'] = 'divider'
            else:
                if align == 'center' and all(base.bold_line(line) for line in pending):
                    block.update(type='heading', level=3)
                if align != 'left':
                    block['alignment'] = align
            if any(any(part['style']) for part in runs):
                block['segments'] = base.segments(runs)
            (content['blocks'] if state == 'body' else content['notes'][state]).append(block)
            pending = []

        for page_number in range(start, end + 1):
            page = pages[page_number - 1]
            for raw in page['lines']:
                event = {**raw, 'page': page_number}
                text = event['text']
                if header:
                    header_glyphs += base.no_whitespace(text)
                    expected_header = base.no_whitespace(f'Chapter {number}: {title}')
                    assert expected_header.startswith(header_glyphs), f'Cabeçalho divergente em {cid}'
                    if header_glyphs == expected_header:
                        header = False
                    continue
                if text in MARKERS:
                    flush()
                    discarded.append({'page': page_number, 'marker': text})
                    state = 'before' if text == 'Chapter Notes' else 'after' if text == 'Chapter End Notes' else 'before' if text == 'Chapter Summary' else 'body'
                    continue
                if state == 'before' and text.startswith(BODY_START.get(number, '\0')):
                    flush()
                    state = 'body'
                source_lines.append(text)
                for char in event['chars']:
                    style = base.style_at(char, event, page['links'])
                    for letter in base.no_whitespace(char[0]):
                        source_styles[(letter, *style[:2])] += 1
                if pending:
                    prev = pending[-1]
                    if prev['page'] != page_number:
                        # O exemplar usa as mesmas margens do piloto; sem as exceções específicas de Morte.
                        join = (prev['x1'] >= 544.5 and abs(prev['x0'] - 66.49) < .7
                                and base.alignment(pending) == 'left' and not base.bold_line(prev)
                                and not re.fullmatch(r'[#*_]+', prev['text']))
                        report['pageBoundaries'].append({'chapter': number, 'nextPage': page_number, 'joined': join})
                        if not join:
                            flush()
                    elif event['top'] - prev['top'] > 18:
                        flush()
                pending.append(event)
        flush()
        assert not header and content['blocks']
        original = base.no_whitespace(''.join(source_lines))
        imported = base.no_whitespace(base.text_of(content))
        independent = base.no_whitespace(''.join(line for n in range(start, end + 1)
                       for line in reader.pages[n - 1].extract_text().splitlines() if line.strip() not in MARKERS))
        assert independent.startswith(header_glyphs)
        independent = independent[len(header_glyphs):]
        assert original == imported == independent, f'Texto divergente em {cid}'
        assert consumed == source_styles, f'Formatação divergente em {cid}'
        assert '\ufffd' not in imported
        payload = serialized(content)
        artifacts[f'src/content/chapters/{WORK}/{cid}.json'] = payload
        chapters.append({'id': cid, 'number': number, 'title': title,
                         'notes': {'hasBefore': bool(content['notes']['before']), 'hasAfter': bool(content['notes']['after']), 'before': [], 'after': []},
                         'contentWarnings': [], 'blocks': []})
        report['chapters'].append({'id': cid, 'number': number, 'title': title, 'startPage': start, 'endPage': end,
            'bodyBlocks': len(content['blocks']), 'notesBefore': len(content['notes']['before']), 'notesAfter': len(content['notes']['after']),
            'sourceGlyphSha256': base.digest(original), 'importedGlyphSha256': base.digest(imported),
            'independentGlyphSha256': base.digest(independent), 'structuredTextSha256': base.digest(base.text_of(content)),
            'fileSha256': base.digest(payload), 'nonWhitespaceCharacters': len(imported),
            'italicCharacters': sum(count for (_, italic, _), count in consumed.items() if italic),
            'boldCharacters': sum(count for (_, _, bold), count in consumed.items() if bold), 'editorialMarkersExcluded': discarded})
        print(f'{cid}: {start}-{end}; blocos {len(content["blocks"])}; notas {len(content["notes"]["before"])}/{len(content["notes"]["after"])}', flush=True)
    catalog_path = ROOT / 'src/content/works.json'
    catalog_text = catalog_path.read_text(encoding='utf8')
    catalog = json.loads(catalog_text)
    work = next(w for w in catalog if w['id'] == WORK)
    if check:
        assert work['chapters'] == chapters
        assert json.loads(REPORT.read_text(encoding='utf8')) == report
        for relative, payload in artifacts.items():
            assert (ROOT / relative).read_text(encoding='utf8') == payload, relative
        print('30 capítulos conferidos contra o PDF; texto, ordem, notas e formatação íntegros.')
    else:
        assert not work['chapters'] or work['chapters'] == chapters
        work['chapters'] = chapters
        for relative, payload in artifacts.items():
            target = ROOT / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(payload.encode('utf8'))
        # Não reformatar nem regravar outras obras ao reproduzir a importação.
        previous_catalog = json.loads(catalog_text)
        if previous_catalog != catalog:
            assert previous_catalog[:-1] == catalog[:-1] and catalog[-1]['id'] == WORK
            original = catalog_text.rsplit('  {\n    "id": "' + WORK + '"', 1)[0]
            updated = '\n'.join('  ' + line for line in serialized(work).rstrip().splitlines())
            updated_catalog = original + updated + '\n]\n'
            assert json.loads(updated_catalog) == catalog
            catalog_path.write_bytes(updated_catalog.encode('utf8'))
        REPORT.write_bytes(serialized(report).encode('utf8'))

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('pdf', nargs='?', type=Path, default=ROOT / 'sources/Como_conquistar_e_perder.pdf')
    parser.add_argument('--check', action='store_true')
    parser.add_argument('--fresh', action='store_true')
    args = parser.parse_args()
    run(args.pdf, args.check, args.fresh)
