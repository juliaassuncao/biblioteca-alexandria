import test from 'node:test';
import assert from 'node:assert/strict';
import { readCatalog, readChapterFiles, readPresentationFiles, validatePresentationFiles } from './validate-catalog.mjs';
import { applyChapterPresentation, sourceBlocks } from '../src/services/chapter-presentation.ts';
import { validateBlocks } from '../src/services/chapter-content.ts';
import { createChapterService } from '../src/services/chapter-data.ts';

const catalog = readCatalog();
const chapters = readChapterFiles();
const presentations = readPresentationFiles().filter(file => file.workId === 'morte-a-linguagem');
const work = catalog.find(item => item.id === 'morte-a-linguagem');
const chapter = chapters.find(item => item.chapterId === 'cap-01');
const presentation = presentations.find(item => item.chapterId === 'cap-01');

test('todas as apresentações preservam integralmente blocos, IDs, formatação e ordem da fonte', () => {
  assert.equal(presentations.length, 12);
  assert.deepEqual(validatePresentationFiles(catalog, chapters, presentations), []);
  const types = new Set();
  for (const file of presentations) {
    const source = chapters.find(item => item.path === file.path).content;
    const before = structuredClone(source);
    const blocks = applyChapterPresentation(source.id, source.blocks, file.content);
    assert.deepEqual(sourceBlocks(blocks), source.blocks);
    assert.deepEqual(source, before, 'não deve mutar a fonte');
    for (const group of file.content.groups) types.add(group.type);
  }
  assert.deepEqual([...types].sort(), ['chat', 'document', 'email', 'excerpt', 'notice']);
});

test('serviço carrega apresentação sob demanda e preserva notas e avisos', async () => {
  let reads = 0;
  const service = createChapterService({ '../content/chapters/morte-a-linguagem/cap-01.json': async () => chapter.content }, {
    '../content/presentation/morte-a-linguagem/cap-01.json': async () => { reads++; return presentation.content; },
  });
  assert.equal(reads, 0);
  const result = await service.load(work, 1);
  assert.equal(result.status, 'ready');
  assert.equal(reads, 1);
  assert.deepEqual(result.content.notes, chapter.content.notes);
  assert.deepEqual(sourceBlocks(result.content.blocks), chapter.content.blocks);
});

test('apresentação inválida não habilita leitura nem altera a fonte', async () => {
  for (const mutate of [
    value => { value.chapterId = 'cap-99'; },
    value => { value.groups[0].start = 'ausente'; },
    value => { value.groups.push(value.groups[0]); },
    value => { value.groups[0].kind = 'unknown'; },
  ]) {
    const invalid = structuredClone(presentation.content);
    mutate(invalid);
    assert.throws(() => applyChapterPresentation(chapter.chapterId, chapter.content.blocks, invalid));
  }
  assert.ok(validatePresentationFiles(catalog, chapters, [{ ...presentation, workId: 'bones' }]).length);
  const service = createChapterService({ '../content/chapters/morte-a-linguagem/cap-01.json': async () => chapter.content }, {
    '../content/presentation/morte-a-linguagem/cap-01.json': async () => ({ chapterId: 'errado', groups: [] }),
  });
  assert.equal((await service.load(work, 1)).status, 'error');
});

test('blocos especiais aceitam dados reais e rejeitam metadados incoerentes ou inseguros', () => {
  const body = [chapter.content.blocks[0]];
  const chat = { id: 'chat', type: 'chat', chatId: 'chat', participants: [{ id: 'p', name: null }], entries: [
    { id: 'date', kind: 'date', content: { text: body[0].text } },
    { id: 'message', kind: 'message', side: 'left', participantId: 'p', body },
    { id: 'system', kind: 'system', content: { text: body[0].text } },
  ] };
  assert.deepEqual(validateBlocks([chat]), []);
  assert.deepEqual(validateBlocks([{ id: 'email', type: 'email', from: null, body }]), []);
  for (const invalid of [
    { ...chat, participants: [{ id: 'p', avatar: { src: 'javascript:alert(1)', alt: 'Avatar' } }] },
    { ...chat, participants: [] },
    { ...chat, entries: [...chat.entries, chat.entries[0]] },
    { ...chat, entries: [{ ...chat.entries[1], body: [] }] },
    { id: 'doc', type: 'document', kind: ['letter'], body },
    { id: 'notice', type: 'notice', kind: 'error', body },
    { id: 'email', type: 'email', body, attachments: [{ label: 'Anexo', href: 'javascript:alert(1)' }] },
    { id: 'email', type: 'email', from: {}, body },
  ]) assert.ok(validateBlocks([invalid]).length);
  let nested = body;
  for (let depth = 0; depth < 10; depth++) nested = [{ id: `doc-${depth}`, type: 'document', kind: 'letter', body: nested }];
  assert.match(validateBlocks(nested).join(';'), /profundidade/);
});
