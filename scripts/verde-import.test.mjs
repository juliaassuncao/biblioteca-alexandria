import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { readCatalog, readChapterFiles } from './validate-catalog.mjs';
import { createChapterService, chapterHref } from '../src/services/chapter-data.ts';
import { applyChapterPresentation, sourceBlocks } from '../src/services/chapter-presentation.ts';
import { readPresentationFiles } from './validate-catalog.mjs';

const root = new URL('../', import.meta.url);
const catalog = readCatalog();
const work = catalog.find(item => item.id === 'no-verde-dos-seus-olhos');
const files = readChapterFiles().filter(file => file.workId === work.id);
const report = JSON.parse(readFileSync(new URL('docs/IMPORTACAO-NO-VERDE-DOS-SEUS-OLHOS.json', root), 'utf8'));
const digest = text => createHash('sha256').update(text).digest('hex');
const allBlocks = content => [...content.notes.before, ...content.blocks, ...content.notes.after];

test('Nat, coautoria, dados oficiais e nota da obra são preservados com downloads autorizados', () => {
  assert.equal(work.title, 'No verde dos seus olhos');
  assert.deepEqual(work.author, { displayName: 'Nat', ao3Name: 'perrysbian', authorLink: 'https://x.com/mdvguillenx' });
  assert.deepEqual(work.ao3Authors, ['AlanisCaratella', 'perrysbian']);
  assert.equal(work.stats.words, 242334);
  assert.equal(work.stats.plannedChapters, null);
  assert.equal(work.stats.updatedAt, '2026-10-21');
  assert.equal(work.links.original, 'https://archiveofourown.org/works/81930951');
  assert.equal(work.classification.rating, 'Explicit');
  assert.equal(work.workNotes[0].text, 'só para as medveguillens');
  assert.equal(work.relationships.length, 2);
  assert.equal(work.characters.length, 7);
  assert.equal(work.cover.ornament, 'paintbrush');
  assert.equal(work.downloads.enabled, true);
  assert.equal(work.editorial.contentReady, false);
});

test('os 32 capítulos importados carregam individualmente e têm navegação completa', async () => {
  assert.equal(work.chapters.length, 32);
  assert.equal(files.length, 32);
  const calls = [];
  const service = createChapterService(Object.fromEntries(files.map(file => [
    `../content/chapters/${work.id}/${file.chapterId}.json`, async () => { calls.push(file.chapterId); return file.content; },
  ])));
  assert.equal(service.availableChapters(work).length, 32);
  assert.deepEqual(calls, []);
  for (const chapter of work.chapters) {
    const result = await service.load(work, chapter.number);
    assert.equal(result.status, 'ready', chapter.id);
    assert.ok(result.content.blocks.length);
    assert.equal(chapterHref(work, chapter), `/obra/${work.slug}/capitulo/${chapter.number}`);
    const neighbors = service.neighbors(work, chapter.number);
    assert.equal(neighbors.previous?.number, chapter.number === 1 ? undefined : chapter.number - 1);
    assert.equal(neighbors.next?.number, chapter.number === 32 ? undefined : chapter.number + 1);
  }
  assert.equal(calls.length, 32);
  assert.equal((await service.load(work, 33)).status, 'not-found');
});

function formatting(segments, italic = false, bold = false) {
  let counts = [0, 0];
  for (const segment of segments) {
    if (segment.type === 'text') {
      const length = Array.from(segment.text.replace(/\s/gu, '')).length;
      counts[0] += italic ? length : 0;
      counts[1] += bold ? length : 0;
    } else {
      const child = formatting(segment.children, italic || segment.type === 'emphasis', bold || segment.type === 'strong');
      counts = counts.map((value, i) => value + child[i]);
    }
  }
  return counts;
}

test('texto, ordem, notas, itálicos e negritos dos 32 capítulos coincidem com as duas extrações do PDF', () => {
  assert.equal(report.source.sha256, '3de22fdf05bb50811ba2d366fda6a3c20897f05a5ee41bbe2cb33c0019d3871c');
  assert.equal(report.source.pages, 523);
  assert.equal(report.chapters.length, 32);
  for (const chapter of report.chapters) {
    const file = files.find(item => item.chapterId === chapter.id);
    const blocks = allBlocks(file.content);
    const text = blocks.map(block => block.text ?? '').join('\n\n');
    assert.equal(digest(text), chapter.structuredTextSha256, chapter.id);
    for (const field of ['sourceGlyphSha256', 'importedGlyphSha256', 'independentGlyphSha256']) {
      assert.equal(digest(text.replace(/\s/gu, '')), chapter[field], `${chapter.id}: ${field}`);
    }
    assert.equal(digest(readFileSync(new URL(`src/content/chapters/${work.id}/${chapter.id}.json`, root))), chapter.fileSha256);
    const counts = blocks.reduce((sum, block) => {
      const current = formatting(block.segments ?? []);
      return sum.map((value, i) => value + current[i]);
    }, [0, 0]);
    assert.deepEqual(counts, [chapter.italicCharacters, chapter.boldCharacters], chapter.id);
    assert.equal(file.content.notes.before.length, chapter.notesBefore);
    assert.equal(file.content.notes.after.length, chapter.notesAfter);
    assert.equal(work.chapters[chapter.number - 1].title, chapter.title);
  }
});

test('apresentação especial reconstrói integralmente os blocos importados da nova obra', () => {
  const presentations = readPresentationFiles().filter(file => file.workId === work.id);
  assert.ok(presentations.length > 0);
  for (const file of presentations) {
    const original = files.find(chapter => chapter.chapterId === file.chapterId).content.blocks;
    const transformed = applyChapterPresentation(file.chapterId, original, file.content);
    assert.deepEqual(sourceBlocks(transformed), original);
  }
});
