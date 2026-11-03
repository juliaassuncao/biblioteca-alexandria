import type { ExportBook, ExportFormat } from './export-types.ts';
const slug = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
export function exportFilename(book: ExportBook, format: ExportFormat) {
  const chapter = book.chapters[0]?.chapter;
  const parts = book.scope === 'chapter' && chapter
    ? [book.work.title, `Capitulo-${String(chapter.number).padStart(2, '0')}`, chapter.title]
    : [book.work.title, book.work.author.displayName ?? book.work.author.ao3Name];
  return `${parts.filter((part): part is string => !!part).map(slug).join('-')}.${format}`;
}
