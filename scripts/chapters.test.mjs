import test from 'node:test';
import assert from 'node:assert/strict';
import { createChapterService, parseChapterNumber, chapterHref } from '../src/services/chapter-data.ts';
import { validateBlocks, validateChapterContent } from '../src/services/chapter-content.ts';
import { readCatalog, readChapterFiles, validateChapterFiles } from './validate-catalog.mjs';
import { makeChapter, makeWork, makeContent, loaderKey } from './reader-fixtures.mjs';

test('numeração da URL recusa negativos, decimais, zero, prefixos e valores excessivos', () => {
  for (const value of [undefined, '', '0', '-1', '1.5', '01', '1x', '1e2', ' 1', '9007199254740992']) assert.equal(parseChapterNumber(value), null);
  assert.equal(parseChapterNumber('14'), 14);
  assert.equal(parseChapterNumber(1), 1);
});

test('abrir diretamente um capítulo carrega somente o arquivo solicitado', async () => {
  const work = makeWork();
  const calls = [];
  const service = createChapterService(Object.fromEntries(work.chapters.map(chapter => [loaderKey(work, chapter), async () => { calls.push(chapter.number); return makeContent(chapter); }])));
  assert.deepEqual(service.availableChapters(work).map(chapter => chapter.number), [1, 2, 3]);
  assert.deepEqual(calls, []);
  const result = await service.load(work, '2');
  assert.equal(result.status, 'ready');
  assert.equal(result.chapter.id, 'cap-02');
  assert.deepEqual(calls, [2]);
  assert.equal(chapterHref(work, result.chapter), '/obra/obra-teste/capitulo/2');
});

test('primeiro e último capítulos só apontam para vizinhos disponíveis e publicados', () => {
  const work = makeWork();
  const loaders = Object.fromEntries(work.chapters.map(chapter => [loaderKey(work, chapter), async () => makeContent(chapter)]));
  const service = createChapterService(loaders);
  assert.equal(service.neighbors(work, 1).previous, undefined);
  assert.equal(service.neighbors(work, 1).next.number, 2);
  assert.equal(service.neighbors(work, 2).previous.number, 1);
  assert.equal(service.neighbors(work, 3).next, undefined);
  delete loaders[loaderKey(work, work.chapters[1])];
  assert.equal(service.neighbors(work, 1).next, undefined);
});

test('capítulo inexistente, indisponível e número inválido têm estados distintos', async () => {
  const work = makeWork();
  const service = createChapterService({});
  assert.equal((await service.load(work, 0)).status, 'invalid-number');
  assert.equal((await service.load(work, 17)).status, 'not-found');
  assert.equal((await service.load(work, 1)).status, 'unavailable');
  assert.equal(service.hasContent(work, work.chapters[0]), false);
});

test('obra externa nunca executa carregamento interno, mesmo se houver arquivo', async () => {
  const work = makeWork(); work.reading.mode = 'external';
  let calls = 0;
  const service = createChapterService({ [loaderKey(work, work.chapters[0])]: async () => { calls++; return makeContent(); } });
  assert.equal((await service.load(work, 1)).status, 'external');
  assert.deepEqual(service.availableChapters(work), []);
  assert.equal(calls, 0);
});

test('falha de rede admite nova tentativa sem recarregar a aplicação', async () => {
  const work = makeWork(); let attempts = 0;
  const service = createChapterService({ [loaderKey(work, work.chapters[0])]: async () => {
    if (++attempts === 1) throw new Error('Falha simulada');
    return makeContent();
  } });
  assert.equal((await service.load(work, 1)).status, 'error');
  assert.equal((await service.load(work, 1)).status, 'ready');
});

test('arquivo vazio, ID divergente e tipo de bloco desconhecido não viram leitura pronta', async () => {
  const work = makeWork();
  for (const mutate of [data => { data.blocks = []; }, data => { data.id = 'outro'; }, data => { data.blocks[0].type = 'html'; }]) {
    const content = makeContent(); mutate(content);
    const service = createChapterService({ [loaderKey(work, work.chapters[0])]: async () => content });
    assert.equal((await service.load(work, 1)).status, 'error');
  }
});

test('formatação inline preserva exatamente texto, ordem, travessões e pontuação', () => {
  const paragraph = { id: 'p', type: 'paragraph', text: '— Um texto e um link.', segments: [
    { type: 'text', text: '— ' }, { type: 'emphasis', children: [{ type: 'strong', children: [{ type: 'text', text: 'Um texto' }] }] },
    { type: 'text', text: ' e um ' }, { type: 'link', href: 'https://example.org', children: [{ type: 'text', text: 'link' }] }, { type: 'text', text: '.' },
  ] };
  assert.deepEqual(validateBlocks([paragraph]), []);
  paragraph.text += '!';
  assert.ok(validateBlocks([paragraph]).some(error => error.includes('preservar')));
});

test('modelo valida todos os tipos de bloco e mensagens estruturadas sem HTML', () => {
  assert.deepEqual(validateBlocks([
    { id: 'p', type: 'paragraph', text: 'Teste' }, { id: 'h', type: 'heading', text: 'Subtítulo', level: 2 },
    { id: 'd', type: 'divider' }, { id: 'q', type: 'quote', text: 'Citação', attribution: 'Fonte de teste' },
    { id: 'a', type: 'aside', text: 'Trecho destacado' }, { id: 'i', type: 'image', src: '/images/test.png', alt: 'Imagem de teste' },
    { id: 'l', type: 'external-link', href: 'https://example.org', label: 'Link de teste' },
    { id: 'c', type: 'chat', chatId: 'chat-teste', messages: [{ id: 'm', sender: 'Remetente de teste', text: 'Mensagem de teste' }] },
  ]), []);
});

test('validador recusa links executáveis, imagens inseguras, links aninhados e IDs duplicados', () => {
  for (const block of [
    { id: 'x', type: 'external-link', href: 'javascript:alert(1)', label: 'Teste' },
    { id: 'x', type: 'image', src: 'data:text/html,<script>', alt: 'Teste' },
    { id: 'x', type: 'image', src: '//example.org/a.png', alt: '' },
    { id: 'x', type: 'heading', text: 'Teste', level: '2' },
    { id: 'x', type: 'chat', chatId: 'c' },
    { id: 'x', type: 'paragraph', text: 'Teste', segments: [{ type: 'link', href: 'https://example.org', children: [{ type: 'link', href: 'https://example.org', children: [{ type: 'text', text: 'Teste' }] }] }] },
  ]) assert.ok(validateBlocks([block]).length > 0);
  assert.ok(validateBlocks([{ id: 'x', type: 'divider' }, { id: 'x', type: 'divider' }]).some(error => error.includes('duplicado')));
});

test('notas de abertura e encerramento devem corresponder ao catálogo e ter IDs únicos', () => {
  const chapter = makeChapter(); chapter.notes.hasBefore = true; chapter.notes.hasAfter = true;
  const content = makeContent();
  assert.ok(validateChapterContent(content, chapter).some(error => error.includes('Notas before')));
  content.notes.before = [{ id: 'n-before', type: 'paragraph', text: 'Nota inicial de teste.' }];
  content.notes.after = [{ id: 'n-after', type: 'paragraph', text: 'Nota final de teste.' }];
  assert.deepEqual(validateChapterContent(content, chapter), []);
  content.notes.after[0].id = 'p-1';
  assert.ok(validateChapterContent(content, chapter).some(error => error.includes('duplicado')));
});

test('validação dos arquivos importados recusa obras externas, arquivos órfãos e JSON inválido', () => {
  const work = makeWork(); const file = { path: 'obra-teste/cap-01.json', workId: work.id, chapterId: 'cap-01', content: makeContent() };
  assert.deepEqual(validateChapterFiles([work], [file]), []);
  assert.ok(validateChapterFiles([work], [{ ...file, chapterId: 'cap-99' }]).length);
  assert.ok(validateChapterFiles([work], [{ ...file, workId: 'ausente' }]).length);
  assert.ok(validateChapterFiles([work], [{ ...file, error: 'JSON inválido' }]).length);
  work.reading.mode = 'external';
  assert.ok(validateChapterFiles([work], [file]).some(error => error.includes('externa')));
});

test('todos os arquivos reais de capítulo preservam vínculos, blocos e notas válidos', () => {
  const catalog = readCatalog(); const files = readChapterFiles();
  assert.deepEqual(validateChapterFiles(catalog, files), []);
  const pilot = catalog.find(work => work.id === 'morte-a-linguagem');
  assert.equal(pilot.chapters[13].contentWarnings[0], 'Homofobia familiar (trecho sinalizado pela autora)');
  if (pilot.editorial.contentReady) assert.equal(files.filter(file => file.workId === pilot.id).length, 14);
});
