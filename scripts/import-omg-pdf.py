"""Importação local de OMG (i think i might love you), sem rede ou dependências novas.

Reutiliza os segmentos do piloto. Requer pdfplumber/pypdf em PYTHONPATH.
O exemplar tem itálico por matriz de texto, dez separadores vetoriais e uma página vazia.
"""
from __future__ import annotations

import argparse
from collections import Counter
from hashlib import sha256
import importlib.util
import json
from pathlib import Path
import sys

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('pilot', Path(__file__).with_name('import-morte-pdf.py'))
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)
ROOT = base.ROOT
WORK = 'omg-i-think-i-might-love-you'
TITLE = 'OMG (i think i might love you)'
SOURCE_NAME = 'OMG (i think i might love you).pdf'
SOURCE_HASH = 'fca8cdccf30affa6035fdb003ab8a12387eb62c94ba8b0a3d18dbf412c5596c3'
# Todas as dezoito transições conferidas no exemplar, sem classificador em runtime.
CONTINUE_AT_PAGE = {2, 5, 6, 8, 11, 12, 13, 14, 15, 16}


def serialized(value):
    return json.dumps(value, ensure_ascii=False, indent=2) + '\n'


def import_pdf(path):
    assert sha256(path.read_bytes()).hexdigest() == SOURCE_HASH, 'Revisar o exemplar antes de importar outro PDF'
    reader = base.PdfReader(path)
    independent = [p.extract_text() for p in reader.pages]
    assert len(independent) == 20 and not independent[-1].strip()
    pages = []
    sheared_characters = 0
    with base.pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            lines = []
            for line in page.extract_text_lines():
                chars = []
                for char in line['chars']:
                    matrix = char['matrix']
                    # Inter-Regular também representa o itálico: inclinação c/a = 0.25.
                    # Não inferir ênfase pelo vocabulário nem pelo conteúdo da frase.
                    assert abs(matrix[0] - .75) < .001 and abs(matrix[1]) < .001
                    assert abs(matrix[3] - .75) < .001
                    italic = abs(matrix[2] / matrix[0] - .25) < .001
                    assert italic or abs(matrix[2]) < .001, 'Matriz não reconhecida'
                    font = char['fontname'] + ('-Italic' if italic else '')
                    assert char['fontname'] == 'AAAAAA+Inter-Regular', 'Revisar nova fonte'
                    sheared_characters += len(base.no_whitespace(char['text'])) if italic else 0
                    chars.append([char['text'], char['x0'], char['x1'], font, char['size']])
                lines.append({**{k: line[k] for k in ('text', 'x0', 'x1', 'top', 'bottom')}, 'chars': chars})
            rules = [rect['top'] for rect in page.rects
                     if abs(rect['x0'] - 28.5) < .01 and abs(rect['width'] - 539.25) < .01
                     and abs(rect['height'] - .75) < .01
                     and rect['non_stroking_color'] == (0.5608, 0.5608, 0.5373)
                     and 0 <= rect['top'] < page.height]
            assert not page.images and not page.hyperlinks, 'Revisar recursos novos antes de importar'
            pages.append({'number': page.page_number, 'lines': lines, 'rules': rules})
            page.close()
    assert not pages[-1]['lines'] and not pages[-1]['rules']
    assert sum(len(p['rules']) for p in pages) == 10
    assert [line['text'] for line in pages[0]['lines'][:3]] == [TITLE, 'nonielb', 'Capítulo 1']
    assert base.no_whitespace(independent[0]).startswith(base.no_whitespace(TITLE + 'nonielbCapítulo 1'))

    cid = 'cap-01'
    content = {'id': cid, 'blocks': [], 'notes': {'before': [], 'after': []}}
    pending, counter = [], 0
    original_lines, source_styles, imported_styles, boundaries, dividers = [], Counter(), Counter(), [], []

    def flush():
        nonlocal counter
        if not pending:
            return
        runs = []
        for index, line in enumerate(pending):
            if index:
                previous = pending[index - 1]
                base.add_run(runs, '' if previous['text'].endswith(('-', '\u00ad')) else ' ')
            for run in base.line_runs(line, []):
                base.add_run(runs, run['text'], run['style'])
                for char in base.no_whitespace(run['text']):
                    imported_styles[(char, *run['style'])] += 1
        text = ''.join(run['text'] for run in runs)
        assert text.strip() and '\ufffd' not in text and '(cid:' not in text
        counter += 1
        block = {'id': f'{cid}-{counter:04}', 'type': 'paragraph', 'text': text}
        if any(any(run['style']) for run in runs):
            block['segments'] = base.segments(runs)
        content['blocks'].append(block)
        pending.clear()

    for page in pages[:-1]:
        lines = page['lines'][3:] if page['number'] == 1 else page['lines']
        events = [{**line, 'page': page['number']} for line in lines]
        events += [{'page': page['number'], 'top': top, 'rule': True} for top in page['rules']]
        for event in sorted(events, key=lambda item: item['top']):
            if event.get('rule'):
                flush()
                counter += 1
                content['blocks'].append({'id': f'{cid}-{counter:04}', 'type': 'divider'})
                dividers.append({'page': event['page'], 'top': event['top'], 'id': f'{cid}-{counter:04}'})
                continue
            original_lines.append(event['text'])
            for char in event['chars']:
                style = base.style_at(char, event, [])
                for letter in base.no_whitespace(char[0]):
                    source_styles[(letter, *style)] += 1
            if pending:
                previous = pending[-1]
                if previous['page'] != event['page']:
                    join = event['page'] in CONTINUE_AT_PAGE
                    boundaries.append({'nextPage': event['page'], 'joined': join,
                                       'previous': previous['text'], 'following': event['text']})
                    if not join:
                        flush()
                elif event['top'] - previous['top'] > 24:
                    flush()
            pending.append(event)
    flush()
    assert len(boundaries) == 18
    original = base.no_whitespace(''.join(original_lines))
    imported = base.no_whitespace(base.text_of(content))
    independently_extracted = base.no_whitespace(''.join(independent))[len(base.no_whitespace(TITLE + 'nonielbCapítulo 1')):]
    assert original == imported == independently_extracted, 'Texto perdido, duplicado ou fora de ordem'
    assert source_styles == imported_styles, 'Formatação divergente'
    assert sheared_characters == sum(v for (_, italic, _, _), v in imported_styles.items() if italic)
    assert content['blocks'][0]['text'] == 'Por que você não vem pra São Paulo?'
    assert content['blocks'][-1]['text'] == 'Porque entre elas tem uma ilha revestida de pedra. E a mulher está exatamente nela. A metade inferior de seu corpo fora de vista.'

    chapter = {'id': cid, 'number': 1, 'title': 'Capítulo 1',
        'notes': {'hasBefore': False, 'hasAfter': False, 'before': [], 'after': []}, 'contentWarnings': [], 'blocks': []}
    work = {
        'id': WORK, 'slug': WORK, 'title': TITLE,
        'author': {'displayName': 'nonielb', 'ao3Name': 'nonielb', 'authorLink': 'https://x.com/noniel_b'},
        'ao3Authors': ['nonielb'], 'relationships': ['Lorena Ferette/Eduarda "Juquinha" Fragoso'],
        'characters': ['Eduarda "Juquinha" Fragoso', 'Lorena Ferette', 'Paulo "Paulinho" Reitz', 'Gerluce Maria das Graças'],
        'synopsis': 'Aos 28 anos de idade, Eduarda Fragoso, uma talentosíssima paisagista, curtia sua vida em BH entre projetos grandiosos e mulheres lindas até que de uma hora para outra tudo parece perder sentido e ela se vê forçada a ir para SP em busca de respostas.\n\nOU\n\nPaulinho convence Eduarda a se mudar para SP em busca de inspiração e se reconectar com seu ofício e ela ganha muito mais do que barganhou em sua moradia temporária.\n\nOU\n\nE Se Fosse Verdade!AU com um toque de fio vermelho',
        'status': 'ongoing', 'language': 'pt-BR', 'fandom': 'Três Graças (TV) — Loquinha', 'category': None,
        'classification': {'rating': 'Mature (M)', 'archiveWarning': None},
        'tags': ['haunted to lovers', 'roommates – freeform', 'soulmates – freeform', 'alternate universe',
                 'anti-paulistismo', 'eduarda é mineira', 'linguagem de amor: atos de tormento',
                 'abstinência de pão de queijo', 'carly rae jepsen tem uma música sobre isso',
                 'tudo posso no lúdico que abraço', 'romcom'],
        'contentAdvisories': ['Avisos de conteúdo não informados pela autoria.'],
        'stats': {'words': None, 'publishedChapters': 1, 'plannedChapters': None,
                  'publishedAt': None, 'updatedAt': '2026-10-31'},
        'cover': {'variant': 'typographic', 'tone': 'violet', 'ornament': 'ghost', 'caption': ''},
        'reading': {'mode': 'internal', 'externalUrl': None}, 'downloads': {'enabled': True},
        'links': {'original': None},
        'editorial': {'submittedByAuthor': True, 'contentReady': False, 'sourceFile': SOURCE_NAME,
                      'sourceUpdatedAt': '2026-10-31', 'coverOfficial': False},
        'chapters': [chapter],
    }
    payload = serialized(content)
    report = {'source': {'file': SOURCE_NAME, 'localFile': path.name, 'sha256': SOURCE_HASH, 'pages': 20},
        'chapterCount': 1, 'chapters': [{'id': cid, 'number': 1, 'title': chapter['title'], 'startPage': 1, 'endPage': 19,
            'bodyBlocks': len(content['blocks']), 'notesBefore': 0, 'notesAfter': 0,
            'nonWhitespaceCharacters': len(imported), 'sourceGlyphSha256': base.digest(original),
            'importedGlyphSha256': base.digest(imported), 'independentGlyphSha256': base.digest(independently_extracted),
            'structuredTextSha256': base.digest(base.text_of(content)), 'fileSha256': base.digest(payload),
            'italicCharacters': sheared_characters, 'boldCharacters': 0}],
        'vectorDividers': dividers, 'pageBoundaries': boundaries,
        'excluded': [{'page': 1, 'kind': 'work-title', 'text': TITLE}, {'page': 1, 'kind': 'author', 'text': 'nonielb'},
                     {'page': 1, 'kind': 'chapter-title', 'text': 'Capítulo 1'}, {'page': 20, 'kind': 'blank-page'}],
        'formatting': {'font': 'AAAAAA+Inter-Regular', 'italicTextMatrix': [0.75, 0, 0.1875, 0.75]},
        'unknownMetadata': ['links.original', 'stats.words', 'stats.plannedChapters', 'stats.publishedAt',
                            'category', 'classification.archiveWarning'],
        'warnings': {'form': 'Não informados', 'pdf': 'Não há seção de avisos no exemplar; ausência não declara inexistência de temas sensíveis.'},
        'limitations': ['PDF sem estrutura semântica de parágrafos: espaços e quebras reconstituídos pela geometria.',
                        'Revisão editorial humana da disposição dos parágrafos permanece pendente.']}
    catalog_path = ROOT / 'src/content/works.json'
    catalog_text = catalog_path.read_text(encoding='utf8')
    catalog = json.loads(catalog_text)
    existing = [w for w in catalog if w['id'] == WORK]
    assert not existing or (len(existing) == 1 and existing[0] == work), 'Preservar cadastro existente divergente'
    updated = catalog_text
    if not existing:
        assert catalog_text.endswith('\n]\n')
        entry = '\n'.join('  ' + line for line in serialized(work).rstrip().splitlines())
        updated = catalog_text[:-3] + ',\n' + entry + '\n]\n'
        assert json.loads(updated)[:-1] == catalog and json.loads(updated)[-1] == work
    target = ROOT / f'src/content/chapters/{WORK}/{cid}.json'
    assert not target.exists() or target.read_text(encoding='utf8') == payload, 'Preservar capítulo existente divergente'
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(payload.encode('utf8'))
    catalog_path.write_bytes(updated.encode('utf8'))
    (ROOT / 'docs/IMPORTACAO-OMG.json').write_bytes(serialized(report).encode('utf8'))
    print(f'1 capítulo importado: {len(content["blocks"])} blocos, {len(imported)} caracteres não brancos, '
          f'{sheared_characters} caracteres em itálico, 10 separadores; duas extrações coincidentes.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('pdf', nargs='?', type=Path, default=ROOT / f'sources/{WORK}.pdf')
    import_pdf(parser.parse_args().pdf)
