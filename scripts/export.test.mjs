import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, posix } from 'node:path';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readCatalog, readChapterFiles, readPresentationFiles, validateCatalog } from './validate-catalog.mjs';
import { createChapterService } from '../src/services/chapter-data.ts';
import { canExport, prepareExport, transformBlocks, visitNodes } from '../src/services/export/export-content.ts';
import { collectAssets } from '../src/services/export/export-assets.ts';
import { exportFilename } from '../src/services/export/export-filename.ts';
import { generateEpub } from '../src/services/export/epub/index.ts';
import { generatePdf } from '../src/services/export/pdf/index.ts';

const works = readCatalog();
const work = works.find(work => work.id === 'morte-a-linguagem');
const loaders = Object.fromEntries(readChapterFiles().map(file => [`../content/chapters/${file.path}`, async () => file.content]));
const presentations = Object.fromEntries(readPresentationFiles().map(file => [`../content/presentation/${file.path}`, async () => file.content]));
const service = createChapterService(loaders, presentations);
const loadAsset = async src => new Uint8Array(await readFile(resolve('public', src.slice(1))));
async function saveOutput(work, filename, blob) {
  if (!process.env.EXPORT_TEST_OUTPUT) return;
  const output = resolve(process.env.EXPORT_TEST_OUTPUT, work.id);
  await mkdir(output, { recursive: true });
  await writeFile(resolve(output, filename), new Uint8Array(await blob.arrayBuffer()));
}
const normalize = text => text.normalize('NFKC').replace(/[\s\u00ad]/gu, '');
const parse = text => new DOMParser({ onError: (level, message) => { throw new Error(`${level}: ${message}`); } }).parseFromString(text, 'application/xml');
const expectedText = book => {
  const texts = [];
  visitNodes(book, node => {
    if (node.kind === 'text') { texts.push(node.value.text); if (node.attribution) texts.push(node.attribution); }
    if (node.kind === 'link') texts.push(node.label);
  });
  return texts;
};
function assertTextInOrder(actual, expected) {
  let position = 0;
  const normalized = normalize(actual);
  for (const text of expected) {
    const index = normalized.indexOf(normalize(text), position);
    assert.ok(index >= 0, `Texto ausente ou fora de ordem: ${text.slice(0, 120)}`);
    position = index + normalize(text).length;
  }
}
async function inspectPdf(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  assert.equal(new TextDecoder().decode(bytes.slice(0, 5)), '%PDF-');
  const doc = await getDocument({ data: bytes, useSystemFonts: true }).promise;
  const pages = [];
  let links = 0, images = 0;
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    // Rodapés não pertencem à narrativa e podem cair entre duas partes do parágrafo.
    pages.push((await page.getTextContent()).items.filter(item => item.transform?.[5] > 34).map(item => item.str ?? '').join(' '));
    links += (await page.getAnnotations()).filter(annotation => annotation.subtype === 'Link').length;
    const operators = await page.getOperatorList();
    images += operators.fnArray.filter(op => op === 85 || op === 86).length;
  }
  const result = { pages, links, images, metadata: await doc.getMetadata(), outline: await doc.getOutline(), numPages: doc.numPages };
  await doc.destroy();
  return result;
}
async function inspectEpub(blob, book) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const header = new DataView(bytes.buffer);
  assert.equal(header.getUint32(0, true), 0x04034b50);
  assert.equal(header.getUint16(8, true), 0, 'mimetype sem compressão');
  assert.equal(header.getUint16(28, true), 0, 'mimetype sem campos extras');
  assert.equal(new TextDecoder().decode(bytes.slice(30, 38)), 'mimetype');
  const zip = await JSZip.loadAsync(bytes, { checkCRC32: true });
  assert.equal(await zip.file('mimetype').async('string'), 'application/epub+zip');
  const files = Object.keys(zip.files).filter(name => !zip.files[name].dir);
  const container = parse(await zip.file('META-INF/container.xml').async('string'));
  assert.equal(container.getElementsByTagName('rootfile')[0].getAttribute('full-path'), 'EPUB/package.opf');
  const opf = parse(await zip.file('EPUB/package.opf').async('string'));
  assert.equal(opf.documentElement.getAttribute('version'), '3.0');
  assert.equal(opf.getElementsByTagName('dc:language')[0].textContent, book.work.language);
  const author = book.work.author.displayName ?? book.work.author.ao3Name;
  const creators = opf.getElementsByTagName('dc:creator');
  if (author) assert.equal(creators[0].textContent, author);
  else assert.equal(creators.length, 0);
  const manifest = [...opf.getElementsByTagName('item')];
  const ids = new Set(manifest.map(item => item.getAttribute('id')));
  manifest.forEach(item => assert.ok(zip.file(`EPUB/${item.getAttribute('href')}`), `Recurso presente: ${item.getAttribute('href')}`));
  [...opf.getElementsByTagName('itemref')].forEach(item => assert.ok(ids.has(item.getAttribute('idref'))));
  const spine = [...opf.getElementsByTagName('itemref')].map(item => item.getAttribute('idref')).filter(id => id.startsWith('chapter-'));
  assert.deepEqual(spine, book.chapters.map((_, index) => `chapter-${index}`));
  const declared = new Set(['mimetype', 'META-INF/container.xml', 'EPUB/package.opf', ...manifest.map(item => `EPUB/${item.getAttribute('href')}`)]);
  assert.ok(files.every(file => declared.has(file)), 'Todos os arquivos no manifest');
  const text = [];
  for (const file of files.filter(file => file.endsWith('.xhtml'))) {
    const doc = parse(await zip.file(file).async('string'));
    assert.equal(doc.getElementsByTagName('script').length, 0);
    const elementIds = [...doc.getElementsByTagName('*')].map(el => el.getAttribute('id')).filter(Boolean);
    assert.equal(new Set(elementIds).size, elementIds.length, `IDs únicos em ${file}`);
    for (const element of [...doc.getElementsByTagName('*')]) for (const attr of ['href', 'src']) {
      const href = element.getAttribute(attr);
      if (!href || /^[a-z]+:/i.test(href)) continue;
      const [path, fragment] = href.split('#');
      const target = path ? posix.normalize(posix.join(posix.dirname(file), path)) : file;
      assert.ok(zip.file(target), `Link/recurso resolvido: ${file}: ${href}`);
      if (fragment) assert.ok((await zip.file(target).async('string')).includes(`id="${fragment}"`));
    }
  }
  for (const item of book.chapters) text.push(parse(await zip.file(`EPUB/chapters/${item.chapter.id}.xhtml`).async('string')).documentElement.textContent);
  assertTextInOrder(text.join(' '), expectedText(book));
  assert.equal(files.filter(file => /^EPUB\/chapters\//.test(file)).length, book.chapters.length);
  assert.equal(blob.type, 'application/epub+zip');
  return zip;
}

test('exportação: obra publicada, autorização, capítulo isolado, falhas e nomes', async () => {
  const book = await prepareExport({ work }, service.load);
  assert.deepEqual(book.chapters.map(item => item.chapter.number), Array.from({ length: 14 }, (_, i) => i + 1));
  assert.equal(exportFilename(book, 'pdf'), 'Morte-a-Linguagem-Vique.pdf');
  let loaded = [];
  const single = await prepareExport({ work, chapter: work.chapters[0] }, async (work, number) => { loaded.push(number); return service.load(work, number); });
  assert.deepEqual(loaded, [1]);
  assert.equal(exportFilename(single, 'epub'), 'Morte-a-Linguagem-Capitulo-01-Prefacio.epub');
  await assert.rejects(prepareExport({ work: { ...work, downloads: { enabled: false } } }, service.load), /indisponíveis/);
  await assert.rejects(prepareExport({ work: { ...work, reading: { mode: 'external' } } }, service.load), /indisponíveis/);
  await assert.rejects(prepareExport({ work }, async (work, number) => number === 7 ? { status: 'unavailable' } : service.load(work, number)), /7 — Semana 3 - Unheimlich/);
  assert.ok(validateCatalog([{ ...work, reading: { mode: 'external' } }]).some(error => /downloads/.test(error)));
  assert.throws(() => transformBlocks([{ id: 'bad', type: 'unknown' }]), /sem suporte/);
  await assert.rejects(collectAssets({ ...book, chapters: [{ ...book.chapters[0], body: [{ id: 'img', kind: 'image', src: '/missing.png', alt: 'Imagem' }] }] }, async () => new Uint8Array()), /inválida/);
});

test('downloads por padrão independem de IDs e respeitam autoria, desativação explícita e obras externas', async () => {
  const future = { ...structuredClone(work), id: 'nova-obra-enviada', slug: 'nova-obra-enviada' };
  delete future.downloads;
  assert.equal(canExport(future), true);
  assert.equal((await prepareExport({ work: future }, (_work, number) => service.load(work, number))).chapters.length, work.chapters.length);
  assert.equal(canExport({ ...future, downloads: { enabled: false } }), false);
  assert.equal(canExport({ ...future, editorial: { ...future.editorial, submittedByAuthor: false } }), false);
  assert.equal(canExport({ ...future, reading: { mode: 'external', externalUrl: null }, downloads: { enabled: true } }), false);
  for (const external of works.filter(item => item.reading.mode === 'external')) assert.equal(canExport(external), false);
});

for (const work of works.filter(item => item.reading.mode === 'internal')) {
test(`PDF e EPUB reais: ${work.title}, obra completa e capítulo isolado`, { timeout: 600000 }, async t => {
  const original = JSON.stringify(readChapterFiles());
  const book = await prepareExport({ work }, service.load);
  const assets = await collectAssets(book, loadAsset);
  const epub = await generateEpub(book, assets);
  await saveOutput(work, 'obra.epub', epub);
  const zip = await inspectEpub(epub, book);
  assert.equal(Object.keys(zip.files).filter(name => name.startsWith('EPUB/images/')).length, assets.filter(asset => asset.mediaType.startsWith('image/')).length);
  for (const asset of assets) assert.deepEqual(new Uint8Array(await zip.file(`EPUB/${asset.path}`).async('uint8array')), asset.bytes);
  const pdf = await generatePdf(book, assets, resolve('public/fonts/export'));
  await saveOutput(work, 'obra.pdf', pdf);
  const inspection = await inspectPdf(pdf);
  assert.equal(inspection.metadata.info.Title, work.title);
  assert.equal(inspection.metadata.info.Author, work.author.displayName ?? work.author.ao3Name ?? undefined);
  assert.equal(inspection.outline.length, work.chapters.length);
  assert.ok(inspection.links >= work.chapters.length);
  assert.ok(inspection.images >= assets.filter(asset => asset.mediaType.startsWith('image/')).length);
  assertTextInOrder(inspection.pages.join(' '), expectedText(book));
  assert.equal(JSON.stringify(readChapterFiles()), original, 'JSONs intactos');
  const chapter = work.chapters[Math.min(8, work.chapters.length - 1)];
  const single = await prepareExport({ work, chapter }, service.load);
  const singleAssets = await collectAssets(single, loadAsset);
  const singleEpub = await generateEpub(single, singleAssets);
  await saveOutput(work, 'capitulo.epub', singleEpub);
  await inspectEpub(singleEpub, single);
  const singlePdf = await generatePdf(single, singleAssets, resolve('public/fonts/export'));
  await saveOutput(work, 'capitulo.pdf', singlePdf);
  const singleInspection = await inspectPdf(singlePdf);
  assert.equal(singleInspection.outline.length, 1);
  assertTextInOrder(singleInspection.pages.join(' '), expectedText(single));
  assert.equal(singleInspection.outline[0].title, `${chapter.number}. ${chapter.title}`);
  assert.deepEqual(single.chapters.map(item => item.chapter.number), [chapter.number]);
  t.diagnostic(`${work.title}: PDF completo ${inspection.numPages} páginas, ${pdf.size} bytes; EPUB ${epub.size} bytes; ${work.chapters.length} capítulos. Individual: capítulo ${chapter.number}, ${singleInspection.numPages} páginas, PDF ${singlePdf.size} bytes, EPUB ${singleEpub.size} bytes.`);
});
}

test('blocos especiais: todos os tipos, segmentos, remetentes, horários, datas e anexos', { timeout: 60000 }, async () => {
  const p = (id, text) => ({ id, type: 'paragraph', text });
  const blocks = [
    { id: 'heading', type: 'heading', level: 2, text: 'Título especial' },
    { ...p('formatted', 'Negrito itálico link'), alignment: 'right', segments: [{ type: 'strong', children: [{ type: 'text', text: 'Negrito ' }] }, { type: 'emphasis', children: [{ type: 'text', text: 'itálico ' }] }, { type: 'link', href: 'https://example.com', children: [{ type: 'text', text: 'link' }] }] },
    { id: 'quote', type: 'quote', text: 'Citação integral', attribution: 'Atribuição' },
    { id: 'aside', type: 'aside', text: 'Destaque integral' },
    { id: 'divider', type: 'divider', text: '#####' },
    { id: 'chat', type: 'chat', chatId: 'conversation', title: 'Conversa de teste', participants: [{ id: 'a', name: 'Participante' }], entries: [
      { id: 'date', kind: 'date', content: { text: 'Dia de teste' } },
      { id: 'message', kind: 'message', side: 'right', participantId: 'a', sender: p('sender', 'Remetente'), time: '12:34', body: [p('message-body', 'Mensagem integral')] },
      { id: 'system', kind: 'system', content: { text: 'Sistema de teste' } },
    ] },
    { id: 'legacy-chat', type: 'chat', chatId: 'legacy', messages: [{ id: 'legacy-message', sender: 'Remetente legado', text: 'Mensagem legada', time: '13:00' }] },
    { id: 'email', type: 'email', from: 'origem@example.com', to: 'destino@example.com', subject: 'Assunto completo', date: 'Data original', body: [p('email-body', 'Corpo do e-mail')], signature: [p('signature', 'Assinatura original')], attachments: [{ label: 'Anexo original', href: 'https://example.com/file' }] },
    { id: 'document', type: 'document', kind: 'form', title: 'Formulário original', body: [p('field', 'Campo: valor')] },
    { id: 'notice', type: 'notice', kind: 'alert', title: 'Aviso original', body: [p('notice-body', 'Corpo do aviso')] },
    { id: 'excerpt', type: 'excerpt', attribution: 'Autoria do trecho', body: [p('excerpt-body', 'Trecho original')] },
    { id: 'link', type: 'external-link', href: 'https://example.com', label: 'Referência original' },
  ];
  const chapter = { ...work.chapters[0], notes: { hasBefore: true, hasAfter: true, before: [], after: [] } };
  const content = { id: chapter.id, blocks, notes: { before: [p('before', 'Nota inicial integral')], after: [p('after', 'Nota final integral')] } };
  const testWork = { ...work, chapters: [chapter], stats: { ...work.stats, publishedChapters: 1 } };
  const book = await prepareExport({ work: testWork, chapter, content }, () => { throw new Error('Conteúdo em memória deve ser reutilizado'); });
  const zip = await inspectEpub(await generateEpub(book, []), book);
  const markup = await zip.file('EPUB/chapters/cap-01.xhtml').async('string');
  assert.match(markup, /<strong>Negrito /);
  assert.match(markup, /<em>itálico /);
  assert.match(markup, /text-align:right/);
  assert.ok(!markup.includes('#####'));
  const pdf = await inspectPdf(await generatePdf(book, [], resolve('public/fonts/export')));
  assertTextInOrder(pdf.pages.join(' '), expectedText(book));
  assert.ok(pdf.links >= 3);
});
