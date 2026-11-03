// Agrupamentos editoriais por IDs: o texto e os JSONs da importação não mudam.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const report = JSON.parse(readFileSync(new URL('docs/IMPORTACAO-MORTE-A-LINGUAGEM.json', root), 'utf8'));
const explicit = {
  1: [['document', 1, 24, 'syllabus']],
  2: [['document', 1, 4, 'syllabus'], ['email', 179, 188], ['document', 207, 211, 'document'], ['document', 213, 214, 'document'], ['document', 229, 235, 'article']],
  3: [['document', 171, 182, 'draft'], ['chat', 232, 239]],
  4: [['document', 1, 6, 'syllabus'], ['excerpt', 275, 275], ['document', 277, 279, 'letter']],
  5: [['email', 104, 112]],
  6: [['document', 218, 232, 'article']],
  8: [['document', 2, 7, 'syllabus']],
  10: [['excerpt', 146, 150]],
  13: [['email', 180, 190], ['document', 211, 214, 'letter']],
  14: [['notice', 20, 24, 'notification'], ['excerpt', 256, 256], ['excerpt', 258, 258]],
};
const senderName = /^(?:Lorena Ferette:?|Eduarda Fragoso:?|Paulinho Reitzdhusudhas curso de escrita:?|11 \[Número desconhecido\]:?)$/u;
function italic(segment, inside = false) {
  if (segment.type === 'text') return !segment.text.trim() || inside;
  return segment.children.every(child => italic(child, inside || segment.type === 'emphasis'));
}
const target = new URL('src/content/presentation/morte-a-linguagem/', root);
mkdirSync(target, { recursive: true });
for (const chapter of report.chapters) {
  const path = new URL(`src/content/chapters/morte-a-linguagem/${chapter.id}.json`, root);
  const bytes = readFileSync(path);
  if (createHash('sha256').update(bytes).digest('hex') !== chapter.fileSha256) throw Error(`Revisar conteúdo alterado antes de agrupar: ${chapter.id}`);
  const { blocks } = JSON.parse(bytes);
  const byNumber = number => `${chapter.id}-${String(number).padStart(4, '0')}`;
  const groups = (explicit[chapter.number] ?? []).map(([type, start, end, kind]) => ({ type, start: byNumber(start), end: byNumber(end), ...(kind ? { kind } : {}) }));
  const covered = id => groups.some(group => id >= group.start && id <= group.end);
  let run = [];
  const flush = () => {
    if (run.some(block => senderName.test(block.text ?? '') || block.alignment === 'right')) groups.push({ type: 'chat', start: run[0].id, end: run.at(-1).id });
    run = [];
  };
  for (const block of blocks) {
    const candidate = !covered(block.id) && (block.type === 'image' || senderName.test(block.text ?? '') || block.alignment === 'right' || (block.segments?.length && block.segments.every(segment => italic(segment))));
    if (candidate) run.push(block); else flush();
  }
  flush();
  groups.sort((a, b) => a.start.localeCompare(b.start));
  for (const group of groups) if (group.type === 'chat') group.senderIds = blocks.filter(block => block.id >= group.start && block.id <= group.end && senderName.test(block.text ?? '')).map(block => block.id);
  if (groups.length) {
    writeFileSync(new URL(`${chapter.id}.json`, target), JSON.stringify({ chapterId: chapter.id, groups }, null, 2) + '\n');
    console.log(`${chapter.id}: ${groups.length} agrupamentos em ${fileURLToPath(target)}`);
  }
}
