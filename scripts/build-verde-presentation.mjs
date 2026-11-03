// Mesmo fluxo do piloto: agrupamentos por IDs, sem modificar os JSONs importados.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { applyChapterPresentation, sourceBlocks } from '../src/services/chapter-presentation.ts';
import { isDeepStrictEqual } from 'node:util';

const root = new URL('../', import.meta.url);
const workId = 'no-verde-dos-seus-olhos';
const report = JSON.parse(readFileSync(new URL('docs/IMPORTACAO-NO-VERDE-DOS-SEUS-OLHOS.json', root), 'utf8'));
const names = new Set(['alanissguillen', 'Gabriela Medvedovsky', 'Alanis Guillen', 'Alanis 🤍', 'Gabriela 🤍', 'Gab M.', 'GioGrigio', 'Gabriela Medv.', 'Laura Dutra', 'Ana P. (babá da Sofi)']);
const explicit = {
  1: [['excerpt', 1, 1], ['chat', 46, 46]],
  2: [['chat', 60, 60], ['chat', 62, 62], ['chat', 67, 68], ['chat', 70, 71]],
  6: [['chat', 28, 29]],
  9: [['excerpt', 2, 2]],
  23: [['notice', 30, 30, 'notification']],
  24: [['chat', 78, 79], ['chat', 81, 82]],
  29: [['document', 37, 44, 'letter']],
};
const target = new URL(`src/content/presentation/${workId}/`, root);
mkdirSync(target, { recursive: true });
let count = 0;
for (const chapter of report.chapters) {
  const bytes = readFileSync(new URL(`src/content/chapters/${workId}/${chapter.id}.json`, root));
  if (createHash('sha256').update(bytes).digest('hex') !== chapter.fileSha256) throw Error(`Fonte modificada: ${chapter.id}`);
  const { blocks } = JSON.parse(bytes);
  const id = number => `${chapter.id}-${String(number).padStart(4, '0')}`;
  const groups = (explicit[chapter.number] ?? []).map(([type, start, end, kind]) => ({ type, start: id(start), end: id(end), ...(kind ? { kind } : {}) }));
  const covered = block => groups.some(group => block.id >= group.start && block.id <= group.end);
  for (const block of blocks) {
    if (covered(block)) continue;
    const text = block.text ?? '';
    const firstLine = text.split('\n')[0].replace(/:$/u, '');
    // Somente cabeçalhos explícitos do PDF. Não inferir remetentes ou horários.
    if (text.includes('\n') && names.has(firstLine)) {
      groups.push({ type: 'chat', start: block.id, end: block.id });
    } else if (/^(?:alanissguillen|Gabriela Medvedovsky) (?:curtiu seu story\.|enviou uma foto|respondeu ao story)/u.test(text)) {
      groups.push({ type: 'notice', kind: 'notification', start: block.id, end: block.id });
    }
  }
  groups.sort((a, b) => a.start.localeCompare(b.start));
  for (const group of groups) if (group.type === 'chat') {
    group.senderIds = blocks.filter(block => block.id >= group.start && block.id <= group.end && names.has((block.text ?? '').replace(/:$/u, ''))).map(block => block.id);
  }
  if (!groups.length) continue;
  const presentation = { chapterId: chapter.id, groups };
  if (!isDeepStrictEqual(sourceBlocks(applyChapterPresentation(chapter.id, blocks, presentation)), blocks)) throw Error(`Apresentação alterou a fonte: ${chapter.id}`);
  writeFileSync(new URL(`${chapter.id}.json`, target), JSON.stringify(presentation, null, 2) + '\n');
  count += groups.length;
}
console.log(`${count} agrupamentos de apresentação verificados sem perda ou mudança de ordem.`);
