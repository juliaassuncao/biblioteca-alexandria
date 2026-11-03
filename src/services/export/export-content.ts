import type { ChapterBlock, Fanfic, FormattedText } from '../../types/fanfic.ts';
import { assertChapterContent } from '../chapter-content.ts';
import { DOCUMENT_LABELS } from '../../components/DocumentBlock/constants.ts';
import type { ExportBook, ExportLoader, ExportNode, ExportRequest } from './export-types.ts';

// Obras internas enviadas pelas autoras têm downloads por padrão; false revoga a disponibilidade.
export const canExport = (work: Fanfic) => work.reading.mode === 'internal'
  && work.editorial.submittedByAuthor === true && work.downloads?.enabled !== false;
const paragraph = (id: string, text: string): ExportNode => ({ id, kind: 'text', role: 'paragraph', value: { text } });
const formatted = (id: string, value: FormattedText): ExportNode => ({ id, kind: 'text', role: 'paragraph', value });

export function transformBlocks(blocks: ChapterBlock[], narrative = false): ExportNode[] {
  return blocks.map((block): ExportNode => {
    switch (block.type) {
      case 'paragraph':
        if (narrative && /^\s*(?:#{3,}|(?:\*\s*){3,}|(?:~\s*){3,})\s*$/.test(block.text)) return { id: block.id, kind: 'divider' };
        return { id: block.id, kind: 'text', role: 'paragraph', value: block };
      case 'heading': return { id: block.id, kind: 'text', role: 'heading', level: block.level, value: block };
      case 'quote': return { id: block.id, kind: 'text', role: 'quote', value: block, attribution: block.attribution };
      case 'aside': return { id: block.id, kind: 'text', role: 'aside', value: block };
      case 'divider': return { id: block.id, kind: 'divider' };
      case 'image': return { ...block, kind: 'image' };
      case 'external-link': return { id: block.id, kind: 'link', href: block.href, label: block.label };
      case 'document': case 'notice': case 'excerpt': return {
        id: block.id, kind: 'section', role: block.type,
        title: block.type === 'document' ? block.title ?? DOCUMENT_LABELS[block.kind] : block.type === 'notice' ? block.title ?? 'Comunicado' : undefined,
        children: [...transformBlocks(block.body), ...(block.type === 'excerpt' && block.attribution ? [paragraph(`${block.id}-attribution`, block.attribution)] : [])],
      };
      case 'email': return { id: block.id, kind: 'section', role: 'email', title: 'E-mail', children: [
        ...([['De', block.from], ['Para', block.to], ['Assunto', block.subject], ['Data', block.date]] as const)
          .flatMap(([label, value]) => value ? [paragraph(`${block.id}-${label}`, `${label}: ${value}`)] : []),
        ...transformBlocks(block.body), ...transformBlocks(block.signature ?? []),
        ...(block.attachments ?? []).map((item, i): ExportNode => ({ id: `${block.id}-attachment-${i}`, kind: 'link', ...item })),
      ] };
      case 'chat': {
        const participants = block.participants ?? [];
        const children: ExportNode[] = participants.flatMap(person => [
          ...(person.name ? [paragraph(`${block.id}-${person.id}-name`, person.name)] : []),
          ...(person.avatar ? [{ id: `${block.id}-${person.id}-avatar`, kind: 'image' as const, ...person.avatar }] : []),
        ]);
        if (block.entries) children.push(...block.entries.map((entry): ExportNode => {
          if (entry.kind !== 'message') return { id: entry.id, kind: 'section', role: entry.kind, children: [formatted(`${entry.id}-text`, entry.content)] };
          const person = participants.find(person => person.id === entry.participantId);
          return { id: entry.id, kind: 'section', role: 'message', side: entry.side, children: [
            ...(entry.sender ? transformBlocks([entry.sender]) : person?.name ? [paragraph(`${entry.id}-sender`, person.name)] : []),
            ...transformBlocks(entry.body), ...(entry.time ? [paragraph(`${entry.id}-time`, entry.time)] : []),
          ] };
        }));
        else children.push(...(block.messages ?? []).map((message): ExportNode => ({ id: message.id, kind: 'section', role: 'message', side: 'left', children: [
          paragraph(`${message.id}-sender`, message.sender), formatted(`${message.id}-body`, message),
          ...(message.time ? [paragraph(`${message.id}-time`, message.time)] : []),
        ] })));
        return { id: block.id, kind: 'section', role: 'chat', title: block.title ?? 'Conversa', children };
      }
      default: { const unsupported: never = block; throw new Error(`Bloco sem suporte de exportação: ${JSON.stringify(unsupported)}`); }
    }
  });
}

export async function prepareExport(request: ExportRequest, load: ExportLoader): Promise<ExportBook> {
  const { work, chapter: requested, content: cached } = request;
  if (!canExport(work)) throw new Error('Downloads indisponíveis para esta obra.');
  const selected = requested ? work.chapters.filter(chapter => chapter.id === requested.id && chapter.number === requested.number) : work.chapters;
  if (!selected.length) throw new Error('Nenhum capítulo publicado disponível para exportar.');
  if (!requested && work.stats.publishedChapters !== selected.length) throw new Error('O índice não corresponde à quantidade de capítulos publicados.');
  const failures: string[] = [];
  const chapters: ExportBook['chapters'] = [];
  // Sequencial: evita importar todos os arquivos simultaneamente em dispositivos pequenos.
  for (const chapter of selected) {
    try {
      const result = requested && cached ? { status: 'ready' as const, content: cached } : await load(work, chapter.number);
      if (result.status !== 'ready') throw new Error('Conteúdo ausente ou inválido');
      assertChapterContent(result.content, chapter);
      chapters.push({ chapter, warnings: [...new Set([...chapter.contentWarnings, ...(result.content.contentWarnings ?? [])])],
        before: transformBlocks(result.content.notes.before), body: transformBlocks(result.content.blocks, true), after: transformBlocks(result.content.notes.after) });
    } catch (error) {
      console.error(`Exportação: capítulo ${chapter.number}`, error);
      failures.push(`${chapter.number} — ${chapter.title}`);
    }
  }
  if (failures.length) throw new Error(`Não foi possível exportar. Confira o conteúdo dos capítulos: ${failures.join('; ')}.`);
  return { work, scope: requested ? 'chapter' : 'work', chapters };
}

export function visitNodes(book: ExportBook, visit: (node: ExportNode) => void) {
  const walk = (nodes: ExportNode[]) => nodes.forEach(node => { visit(node); if (node.kind === 'section') walk(node.children); });
  book.chapters.forEach(chapter => { walk(chapter.before); walk(chapter.body); walk(chapter.after); });
}
