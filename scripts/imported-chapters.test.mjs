import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { readCatalog, readChapterFiles, validateChapterFiles } from './validate-catalog.mjs';
import { createChapterService } from '../src/services/chapter-data.ts';
import { validateBlocks } from '../src/services/chapter-content.ts';
import { isSafeReaderLink, isSafeReaderImage } from '../src/utils/reader-links.ts';

const root = new URL('../', import.meta.url);
const report = JSON.parse(readFileSync(new URL('docs/IMPORTACAO-MORTE-A-LINGUAGEM.json', root), 'utf8'));
const pilot = readCatalog().find(work => work.id === 'morte-a-linguagem');
const files = readChapterFiles().filter(file => file.workId === pilot.id);
const digest = text => createHash('sha256').update(text).digest('hex');
const allBlocks = content => [...content.notes.before, ...content.blocks, ...content.notes.after];
const textOf = content => allBlocks(content).filter(block => block.type !== 'image').map(block => block.text ?? '').join('\n\n');

function formattingCounts(segments, italic = false, bold = false) {
  const result = { italic: 0, bold: 0 };
  for (const segment of segments) {
    if (segment.type === 'text') {
      const count = Array.from(segment.text.replace(/\s/gu, '')).length;
      result.italic += italic ? count : 0;
      result.bold += bold ? count : 0;
    } else {
      const counts = formattingCounts(segment.children, italic || segment.type === 'emphasis', bold || segment.type === 'strong');
      result.italic += counts.italic;
      result.bold += counts.bold;
    }
  }
  return result;
}

test('os 14 capítulos reais estão completos, vinculados ao catálogo e carregam individualmente', async () => {
  assert.equal(files.length, 14);
  assert.deepEqual(validateChapterFiles(readCatalog(), files), []);
  const loaders = Object.fromEntries(files.map(file => [`../content/chapters/${pilot.id}/${file.chapterId}.json`, async () => file.content]));
  const service = createChapterService(loaders);
  assert.equal(service.availableChapters(pilot).length, 14);
  for (let number = 1; number <= 14; number++) assert.equal((await service.load(pilot, number)).status, 'ready');
  assert.equal(service.neighbors(pilot, 1).previous, undefined);
  assert.equal(service.neighbors(pilot, 14).next, undefined);
});

test('texto e pontuação dos arquivos coincidem com o relatório das duas extrações do PDF', () => {
  assert.equal(report.source.sha256, '325ad639cd2b686ce6570cfa4b1359e991d8613b7a14616ff97881875dfa834e');
  assert.equal(report.source.pages, 284);
  for (const chapter of report.chapters) {
    const file = files.find(item => item.chapterId === chapter.id);
    const text = textOf(file.content);
    assert.equal(digest(text), chapter.structuredTextSha256, chapter.id);
    const glyphHash = digest(text.replace(/\s/gu, ''));
    assert.equal(glyphHash, chapter.sourceGlyphSha256, chapter.id);
    assert.equal(glyphHash, chapter.independentGlyphSha256, chapter.id);
    assert.equal(digest(readFileSync(new URL(`src/content/chapters/${pilot.id}/${chapter.id}.json`, root))), chapter.fileSha256);
    assert.equal(pilot.chapters[chapter.number - 1].title, chapter.title);
    assert.equal(file.content.notes.before.length, chapter.notesBefore);
    assert.equal(file.content.notes.after.length, chapter.notesAfter);
  }
});

test('itálicos, negritos e separadores preservam os glifos com formatação recuperável', () => {
  for (const chapter of report.chapters) {
    const content = files.find(file => file.chapterId === chapter.id).content;
    const counts = allBlocks(content).reduce((total, block) => {
      const current = formattingCounts(block.segments ?? []);
      return { italic: total.italic + current.italic, bold: total.bold + current.bold };
    }, { italic: 0, bold: 0 });
    assert.equal(counts.italic, chapter.italicCharacters, `${chapter.id}: itálico`);
    assert.equal(counts.bold, chapter.boldCharacters, `${chapter.id}: negrito`);
    const dividers = allBlocks(content).filter(block => block.type === 'divider');
    assert.equal(dividers.length, chapter.sceneDividers);
    assert.ok(dividers.every(block => block.text === '#####'));
  }
});

test('as três figurinhas originais têm arquivos íntegros, texto alternativo e posição na narrativa', () => {
  assert.equal(report.images.length, 3);
  const images = files.flatMap(file => file.content.blocks.filter(block => block.type === 'image'));
  assert.equal(images.length, 3);
  for (const image of report.images) assert.equal(digest(readFileSync(new URL(image.path, root))), image.sha256);
  assert.ok(images.every(image => image.alt && image.alignment === 'left'));
});

test('notas reais e aviso do capítulo 14 permanecem em suas posições', () => {
  const final = files.find(file => file.chapterId === 'cap-14').content;
  assert.ok(final.notes.before.some(block => block.text.includes('homofobia familiar')));
  assert.ok(pilot.chapters[13].contentWarnings.includes('Homofobia familiar (trecho sinalizado pela autora)'));
  assert.ok(final.notes.after.length > 0);
  for (const number of [4, 10]) {
    const chapter = pilot.chapters[number - 1];
    assert.equal(chapter.notes.hasBefore, false);
    assert.equal(chapter.notes.hasAfter, true);
  }
});

test('mailto recuperado do PDF funciona em links e permanece proibido em imagens', () => {
  assert.equal(isSafeReaderLink('mailto:lorenaa.ferette@gmail.com'), true);
  assert.equal(isSafeReaderImage('mailto:lorenaa.ferette@gmail.com'), false);
  assert.equal(isSafeReaderLink('mailto:test@example.org%0aBcc:other@example.org'), false);
  assert.deepEqual(validateBlocks([{ id: 'p', type: 'paragraph', text: 'Contato', alignment: 'right', segments: [
    { type: 'link', href: 'mailto:lorenaa.ferette@gmail.com', children: [{ type: 'text', text: 'Contato' }] },
  ] }]), []);
  assert.ok(validateBlocks([{ id: 'p', type: 'paragraph', text: 'Teste', alignment: ['right'] }]).length);
});
