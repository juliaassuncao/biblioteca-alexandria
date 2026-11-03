"""Conversão local do PDF fornecido, sem rede e sem dependências do aplicativo.

Requer pdfplumber, pypdf e Pillow no ambiente de extração. O hash limita as
decisões de paginação ao exemplar efetivamente conferido. --check não escreve.
"""
from __future__ import annotations

import argparse
from collections import Counter
from hashlib import sha256
import json
from pathlib import Path
import re

import pdfplumber
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
SOURCE_HASH = '325ad639cd2b686ce6570cfa4b1359e991d8613b7a14616ff97881875dfa834e'
# Continuação confirmada de parágrafos centrados ou de notas com margem menor.
CONTINUE_AT_PAGE = {4, 116, 203, 230}
IMAGE_ALT = {
    82: 'pobre lesbica',
    97: 'desde quando deixaram passivas terem direito de fala?',
    158: 'e como sempre as portas fechadas para as lésbicas',
}
EDITORIAL_MARKERS = {'Chapter Notes', 'Chapter End Notes',
                     'See the end of the chapter for notes',
                     'See the end of the chapter for more notes'}


def no_whitespace(text):
    return re.sub(r'\s+', '', text)


def digest(text):
    return sha256(text.encode('utf8')).hexdigest()


def load_layout(path, source_hash, fresh=False):
    cache = ROOT / 'sources/morte-pdf-layout.json'
    if cache.exists() and not fresh:
        cached = json.loads(cache.read_text(encoding='utf8'))
        if cached['sourceSha256'] == source_hash:
            return cached['pages']
    pages = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            lines = []
            for line in page.extract_text_lines():
                lines.append({
                    **{key: line[key] for key in ('text', 'x0', 'x1', 'top', 'bottom')},
                    'chars': [[char['text'], char['x0'], char['x1'], char['fontname'], char['size']]
                              for char in line['chars']],
                })
            pages.append({'number': page.page_number, 'lines': lines,
                          'images': [{key: image[key] for key in ('x0', 'x1', 'top', 'bottom')}
                                     for image in page.images],
                          'links': [{key: link.get(key) for key in ('x0', 'x1', 'top', 'bottom', 'uri')}
                                    for link in page.hyperlinks]})
            page.close()
    return pages


def style_at(char, line, links):
    center = (char[1] + char[2]) / 2
    href = None
    for link in links:
        if link['top'] - 2 <= (line['top'] + line['bottom']) / 2 <= link['bottom'] + 2 and link['x0'] <= center <= link['x1']:
            href = link['uri']
            assert href and href.startswith(('http://', 'https://', 'mailto:')), href
    return ('Italic' in char[3] or 'Oblique' in char[3], 'Bold' in char[3], href)


def add_run(runs, text, style=(False, False, None)):
    if not text:
        return
    if runs and runs[-1]['style'] == style:
        runs[-1]['text'] += text
    else:
        runs.append({'text': text, 'style': style})


def line_runs(line, links):
    # extract_text_lines fornece os espaços pela geometria. Seus chars contêm
    # os glifos efetivamente pintados, com fonte e posição de cada um.
    glyphs = [(letter, style_at(char, line, links)) for char in line['chars']
              for letter in char[0] if not letter.isspace()]
    assert ''.join(letter for letter, _ in glyphs) == no_whitespace(line['text']), line['text']
    runs = []
    index = 0
    for letter in line['text']:
        if letter.isspace():
            previous = glyphs[index - 1][1] if index else (False, False, None)
            following = glyphs[index][1] if index < len(glyphs) else (False, False, None)
            style = previous if previous == following else (False, False, None)
        else:
            style = glyphs[index][1]
            index += 1
        add_run(runs, letter, style)
    return runs


def alignment(lines):
    # Justificação é identificável pelo avanço adicional entre palavras; não
    # confundir uma linha cheia ou um espaço inicial com alinhamento à direita.
    for line in lines:
        gaps = sorted(right[1] - left[2] for left, right in zip(line['chars'], line['chars'][1:])
                      if right[1] - left[2] > 1.8)
        if line['x0'] < 80 and line['x1'] > 544.5 and gaps and gaps[len(gaps) // 2] > 3.21:
            return 'left'
    if all(abs(line['x0'] - 66.49) < .7 for line in lines):
        return 'left'
    if all(abs(line['x0'] + line['x1'] - 612) < 3.5 for line in lines):
        return 'center'
    if all(abs(line['x1'] - 545.51) < .8 for line in lines):
        return 'right'
    return 'left'


def bold_line(line):
    return all('Bold' in char[3] for char in line['chars'])


def boundary_continues(previous, following, paragraph):
    if following['page'] in CONTINUE_AT_PAGE:
        return True
    return (previous['x1'] >= 544.5 and abs(previous['x0'] - 66.49) < .7
            and alignment(paragraph) == 'left' and not bold_line(previous)
            and not re.fullmatch(r'[#*_]+', previous['text']))


def separator_between(previous, following, paragraph):
    if previous['text'].endswith(('-', '\u00ad')):
        return ''
    # Linhas curtas contíguas não são quebras de paginação/prosa justificadas:
    # manter quebras explícitas de versos e subtítulos recuperáveis.
    if previous['page'] == following['page'] and previous['x1'] - previous['x0'] < 350:
        return '\n'
    if all(bold_line(line) for line in paragraph):
        return '\n'
    return ' '


def segments(runs):
    result = []
    for run in runs:
        italic, bold, href = run['style']
        part = {'type': 'text', 'text': run['text']}
        if italic:
            part = {'type': 'emphasis', 'children': [part]}
        if bold:
            part = {'type': 'strong', 'children': [part]}
        if href:
            part = {'type': 'link', 'href': href, 'children': [part]}
        # Fundir caixas adjacentes da mesma anotação em um único link.
        if href and result and result[-1]['type'] == 'link' and result[-1]['href'] == href:
            result[-1]['children'].extend(part['children'])
        else:
            result.append(part)
    return result


def all_blocks(content):
    return content['notes']['before'] + content['blocks'] + content['notes']['after']


def text_of(content):
    return '\n\n'.join(block.get('text', '') for block in all_blocks(content) if block['type'] != 'image')


def import_pdf(path, check=False, fresh=False):
    source_hash = sha256(path.read_bytes()).hexdigest()
    assert source_hash == SOURCE_HASH, 'PDF diferente do exemplar conferido: revisar paginação e atualizar o importador antes de converter.'
    reader = PdfReader(path)
    assert len(reader.pages) == 284
    catalog_path = ROOT / 'src/content/works.json'
    catalog_original = catalog_path.read_bytes().decode('utf8')
    catalog = json.loads(catalog_original)
    work = next(item for item in catalog if item['id'] == 'morte-a-linguagem')
    outlines = []

    def walk(items):
        for item in items:
            if isinstance(item, list):
                walk(item)
            elif match := re.fullmatch(r'Chapter (\d+): (.+)', item.title):
                outlines.append((int(match[1]), match[2], reader.get_destination_page_number(item) + 1))

    walk(reader.outline)
    assert len(outlines) == len(work['chapters']) == 14
    pages = load_layout(path, source_hash, fresh=fresh)
    report = {'source': {'file': 'Morte à Linguagem.pdf', 'sha256': source_hash, 'pages': 284},
              'chapterCount': 14, 'chapters': [], 'noteFlagCorrections': [], 'pageBoundaries': [],
              'limitations': ['PDF sem tags de parágrafo: reconstituição por posição, espaçamento e revisão das junções entre páginas.',
                              'Espaços e quebras de linha do PDF são refluídos; glifos, pontuação e ordem são comparados integralmente.',
                              'A conferência automatizada não substitui a revisão editorial humana da disposição dos parágrafos.']}
    prior_report_path = ROOT / 'docs/IMPORTACAO-MORTE-A-LINGUAGEM.json'
    if prior_report_path.exists():
        prior = json.loads(prior_report_path.read_text(encoding='utf8'))
        if prior['source']['sha256'] == source_hash:
            report['noteFlagCorrections'] = prior['noteFlagCorrections']
    artifacts = {}
    image_payloads = {}
    for index, (number, title, start) in enumerate(outlines):
        chapter = work['chapters'][index]
        assert chapter['number'] == number and chapter['title'] == title
        end = outlines[index + 1][2] - 1 if index + 1 < len(outlines) else 283
        content = {'id': chapter['id'], 'blocks': [], 'notes': {'before': [], 'after': []}}
        state = 'body'
        pending = []
        source_text = []
        source_styles = Counter()
        consumed_styles = Counter()
        link_targets = []
        discarded = []
        block_number = 0
        image_number = 0

        def destination():
            return content['blocks'] if state == 'body' else content['notes'][state]

        def flush():
            nonlocal block_number, pending
            if not pending:
                return
            runs = []
            for j, line in enumerate(pending):
                if j:
                    add_run(runs, separator_between(pending[j - 1], line, pending))
                for run in line_runs(line, pages[line['page'] - 1]['links']):
                    add_run(runs, run['text'], run['style'])
                    for letter in no_whitespace(run['text']):
                        consumed_styles[(letter, run['style'][0], run['style'][1])] += 1
                    if run['style'][2]:
                        link_targets.append(run['style'][2])
            text = ''.join(run['text'] for run in runs)
            block_number += 1
            block = {'id': f'{chapter["id"]}-{block_number:04}', 'type': 'paragraph', 'text': text}
            align = alignment(pending)
            if re.fullmatch(r'#{3,}', text):
                block['type'] = 'divider'
            else:
                if align == 'center' and all(bold_line(line) for line in pending) and not text.startswith('11 ['):
                    block.update(type='heading', level=3)
                if align != 'left':
                    block['alignment'] = align
            if any(any(run['style']) for run in runs):
                block['segments'] = segments(runs)
            destination().append(block)
            pending = []

        for page_number in range(start, end + 1):
            page = pages[page_number - 1]
            events = [{**line, 'page': page_number, 'kind': 'line'} for line in page['lines']]
            events += [{**image, 'page': page_number, 'kind': 'image'} for image in page['images']]
            for event in sorted(events, key=lambda item: (item['top'], item['x0'])):
                if event['kind'] == 'image':
                    flush()
                    image_number += 1
                    assert page_number in IMAGE_ALT
                    images = list(reader.pages[page_number - 1].images)
                    assert len(images) == 1
                    # PNG sem perda, sem redimensionar ou alterar os pixels da imagem.
                    from io import BytesIO
                    buffer = BytesIO()
                    images[0].image.save(buffer, format='PNG')
                    relative = f'public/images/chapters/morte-a-linguagem/{chapter["id"]}-{image_number:02}.png'
                    image_payloads[relative] = buffer.getvalue()
                    block_number += 1
                    destination().append({'id': f'{chapter["id"]}-{block_number:04}', 'type': 'image',
                                          'src': '/' + relative.removeprefix('public/'),
                                          'alt': IMAGE_ALT[page_number], 'alignment': 'left'})
                    continue
                text = event['text']
                if page_number == start and text == f'Chapter {number}: {title}':
                    discarded.append({'page': page_number, 'kind': 'chapter-title'})
                    continue
                if text in EDITORIAL_MARKERS:
                    flush()
                    discarded.append({'page': page_number, 'kind': text})
                    if text == 'Chapter Notes':
                        state = 'before'
                    elif text == 'Chapter End Notes':
                        state = 'after'
                    else:
                        state = 'body'
                    continue
                # Capítulo 8 tem nota inicial sem link para notas finais. A nota
                # fica na margem 79.2; o título da ementa está no corpo central.
                if number == 8 and state == 'before' and text == 'CURSO “ALTA LITERATURA PARA ESCRITORES E ARTISTAS”':
                    flush()
                    state = 'body'
                source_text.append(text)
                for char in event['chars']:
                    style = style_at(char, event, page['links'])
                    for letter in no_whitespace(char[0]):
                        source_styles[(letter, style[0], style[1])] += 1
                if pending:
                    previous = pending[-1]
                    if previous['page'] != event['page']:
                        join = boundary_continues(previous, event, pending)
                        report['pageBoundaries'].append({'nextPage': event['page'], 'joined': join,
                                                       'reviewedOverride': event['page'] in CONTINUE_AT_PAGE})
                        if not join:
                            flush()
                    elif event['top'] - previous['top'] > 18:
                        flush()
                pending.append(event)
            # Manter pending somente para conferir a possível continuação.
        flush()
        original_glyphs = no_whitespace(''.join(source_text))
        imported_glyphs = no_whitespace(text_of(content))
        assert original_glyphs == imported_glyphs, f'Perda ou duplicação de texto no capítulo {number}'
        assert source_styles == consumed_styles, f'Perda de formatação no capítulo {number}'
        independent_lines = []
        for page_number in range(start, end + 1):
            for line in reader.pages[page_number - 1].extract_text().splitlines():
                if line.strip() not in EDITORIAL_MARKERS | {f'Chapter {number}: {title}'}:
                    independent_lines.append(line)
        independent_glyphs = no_whitespace(''.join(independent_lines))
        assert independent_glyphs == imported_glyphs, f'Extração independente diverge no capítulo {number}'
        assert len(content['blocks']) > 0
        for side, flag in [('before', 'hasBefore'), ('after', 'hasAfter')]:
            actual = bool(content['notes'][side])
            if chapter['notes'][flag] != actual:
                report['noteFlagCorrections'].append({'chapter': number, 'field': flag,
                                                      'previous': chapter['notes'][flag], 'actual': actual})
                chapter['notes'][flag] = actual
        serialized = json.dumps(content, ensure_ascii=False, indent=2) + '\n'
        artifacts[f'src/content/chapters/morte-a-linguagem/{chapter["id"]}.json'] = serialized
        report['chapters'].append({
            'id': chapter['id'], 'number': number, 'title': title, 'startPage': start, 'endPage': end,
            'bodyBlocks': len(content['blocks']), 'notesBefore': len(content['notes']['before']),
            'notesAfter': len(content['notes']['after']), 'images': image_number,
            'sceneDividers': sum(block['type'] == 'divider' for block in all_blocks(content)),
            'links': sorted(set(link_targets)), 'nonWhitespaceCharacters': len(imported_glyphs),
            'sourceGlyphSha256': digest(original_glyphs), 'importedGlyphSha256': digest(imported_glyphs),
            'independentGlyphSha256': digest(independent_glyphs),
            'structuredTextSha256': digest(text_of(content)), 'fileSha256': digest(serialized),
            'italicCharacters': sum(count for (_, italic, _), count in source_styles.items() if italic),
            'boldCharacters': sum(count for (_, _, bold), count in source_styles.items() if bold),
            'editorialMarkersExcluded': discarded,
        })
        print(f'{chapter["id"]}: páginas {start}–{end}; narrativa {len(content["blocks"])}; notas {len(content["notes"]["before"])}/{len(content["notes"]["after"])}; imagens {image_number}')
    # Conservar todos os campos, exceto os cinco indicadores de notas conferidos.
    # contentReady permanece false até a revisão editorial humana de paginação.
    expected = json.loads(catalog_original)
    pilot = next(item for item in expected if item['id'] == work['id'])
    for chapter, updated in zip(pilot['chapters'], work['chapters']):
        chapter['notes']['hasBefore'] = updated['notes']['hasBefore']
        chapter['notes']['hasAfter'] = updated['notes']['hasAfter']
    assert catalog == expected
    report['images'] = [{'path': path, 'sha256': sha256(data).hexdigest()} for path, data in image_payloads.items()]
    report['totalNonWhitespaceCharacters'] = sum(chapter['nonWhitespaceCharacters'] for chapter in report['chapters'])
    report_path = ROOT / 'docs/IMPORTACAO-MORTE-A-LINGUAGEM.json'
    if check:
        for relative, text in artifacts.items():
            assert (ROOT / relative).read_text(encoding='utf8') == text, f'Arquivo diverge do PDF: {relative}'
        for relative, data in image_payloads.items():
            assert (ROOT / relative).read_bytes() == data, f'Imagem diverge do PDF: {relative}'
        previous_report = json.loads(report_path.read_text(encoding='utf8'))
        assert previous_report['chapters'] == report['chapters']
        print('Conferência do PDF contra os 14 arquivos: OK')
    else:
        for relative, text in artifacts.items():
            (ROOT / relative).parent.mkdir(parents=True, exist_ok=True)
            (ROOT / relative).write_bytes(text.encode('utf8'))
        for relative, data in image_payloads.items():
            (ROOT / relative).parent.mkdir(parents=True, exist_ok=True)
            (ROOT / relative).write_bytes(data)
        # Substituições pontuais preservam a formatação e o restante do JSON.
        for old, new in zip(json.loads(catalog_original), catalog):
            if old['id'] != work['id']:
                continue
            for old_chapter, new_chapter in zip(old['chapters'], new['chapters']):
                for flag in ['hasBefore', 'hasAfter']:
                    if old_chapter['notes'][flag] == new_chapter['notes'][flag]:
                        continue
                    pattern = r'("id": "' + re.escape(old_chapter['id']) + r'"[\s\S]*?"' + flag + r'": )' + str(old_chapter['notes'][flag]).lower()
                    catalog_original, count = re.subn(pattern, lambda match: match[1] + str(new_chapter['notes'][flag]).lower(), catalog_original, count=1)
                    assert count == 1
        assert json.loads(catalog_original) == catalog
        catalog_path.write_bytes(catalog_original.encode('utf8'))
        report_path.write_bytes((json.dumps(report, ensure_ascii=False, indent=2) + '\n').encode('utf8'))
        print('Importados 14 capítulos; texto e formatação comparados em todos os glifos não brancos.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('pdf', nargs='?', type=Path, default=ROOT / 'sources/Morte à Linguagem.pdf')
    parser.add_argument('--check', action='store_true')
    parser.add_argument('--fresh', action='store_true', help='Ler novamente a geometria de todas as páginas, sem cache local.')
    args = parser.parse_args()
    import_pdf(args.pdf, check=args.check, fresh=args.fresh)
