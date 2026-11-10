// Intervalos conferidos no PDF; apresentação sem regravar os capítulos importados.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { applyChapterPresentation, sourceBlocks } from '../src/services/chapter-presentation.ts';
import { validateBlocks } from '../src/services/chapter-content.ts';

const root = new URL('../', import.meta.url);
const workId = 'estudo-de-caso';
const report = JSON.parse(readFileSync(new URL('docs/IMPORTACAO-ESTUDO-DE-CASO.json', root), 'utf8'));
const explicit = {
  2: [
    { type: 'document', kind: 'letter', start: 45, end: 51 },
    { type: 'excerpt', start: 61, end: 63 },
    { type: 'chat', start: 65, end: 83 },
    { type: 'notice', kind: 'notice', start: 85, end: 85 },
  ],
  7: [
    { type: 'document', kind: 'article', start: 46, end: 50 },
    { type: 'document', kind: 'article', start: 166, end: 174 },
  ],
  9: [{ type: 'document', kind: 'article', start: 152, end: 165 }],
  11: [{ type: 'notice', kind: 'notice', start: 3, end: 14 }],
  16: [{ type: 'chat', start: 66, end: 78,
    inlineSenders: ['Lorena', 'Júnior', 'Maggye', 'Paulinho', 'Gerluce', 'Eduarda'], rightSenders: [] }],
  17: [{ type: 'excerpt', start: 206, end: 208 }],
};
const target = new URL(`src/content/presentation/${workId}/`, root);
mkdirSync(target, { recursive: true });
let count = 0;
for (const chapter of report.chapters) {
  const selected = explicit[chapter.number];
  if (!selected) continue;
  const bytes = readFileSync(new URL(`src/content/chapters/${workId}/${chapter.id}.json`, root));
  if (createHash('sha256').update(bytes).digest('hex') !== chapter.fileSha256) throw Error(`Fonte modificada: ${chapter.id}`);
  const { blocks } = JSON.parse(bytes);
  const id = number => `${chapter.id}-${String(number).padStart(4, '0')}`;
  const groups = selected.map(({ start, end, ...rest }) => ({ ...rest, start: id(start), end: id(end) }));
  const presentation = { chapterId: chapter.id, groups };
  const result = applyChapterPresentation(chapter.id, blocks, presentation);
  if (!isDeepStrictEqual(sourceBlocks(result), blocks)) throw Error(`Apresentação alterou a fonte: ${chapter.id}`);
  const errors = validateBlocks(result);
  if (errors.length) throw Error(errors.join('; '));
  // As 19 mensagens privadas e as 13 mensagens em grupo mantêm a ordem da fonte.
  for (const block of result.filter(block => block.type === 'chat')) {
    const expected = chapter.number === 2 ? 19 : 13;
    if (block.entries.length !== expected) throw Error(`Quantidade de mensagens divergente: ${chapter.id}`);
  }
  writeFileSync(new URL(`${chapter.id}.json`, target), JSON.stringify(presentation, null, 2) + '\n');
  count += groups.length;
}
console.log(`${count} agrupamentos gerados; capítulos, segmentos e ordem preservados.`);
