import type { Chapter, ChapterContent } from '../types/fanfic.ts';
import { isSafeReaderImage, isSafeReaderLink } from '../utils/reader-links.ts';
import { validateSpecialContent } from './special-content-validation.ts';

const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const nonempty = (value: unknown): value is string => typeof value === 'string' && !!value.trim();

function inlineText(value: unknown, errors: string[], where: string, depth = 0, insideLink = false): string {
  if (!Array.isArray(value) || !value.length || depth > 12) {
    errors.push(`${where}: segmentos inválidos ou profundidade excessiva`);
    return '';
  }
  return value.map((part: unknown) => {
    if (!object(part)) { errors.push(`${where}: segmento inválido`); return ''; }
    if (part.type === 'text' && typeof part.text === 'string') return part.text;
    if (part.type === 'strong' || part.type === 'emphasis' || part.type === 'link') {
      if (part.type === 'link' && (!isSafeReaderLink(part.href) || insideLink)) errors.push(`${where}: link inline inválido`);
      return inlineText(part.children, errors, where, depth + 1, insideLink || part.type === 'link');
    }
    errors.push(`${where}: tipo de segmento desconhecido`);
    return '';
  }).join('');
}

function validateText(block: Record<string, unknown>, errors: string[], where: string) {
  if (!nonempty(block.text)) errors.push(`${where}: texto vazio ou inválido`);
  if (block.segments !== undefined && inlineText(block.segments, errors, where) !== block.text) {
    errors.push(`${where}: segmentos devem preservar exatamente o texto`);
  }
}

export function validateBlocks(value: unknown, where = 'Blocos', ids = new Set<string>(), depth = 0): string[] {
  if (depth > 8) return [`${where}: profundidade de blocos excessiva`];
  if (!Array.isArray(value)) return [`${where}: blocos devem ser uma lista`];
  const errors: string[] = [];
  for (const [index, block] of value.entries()) {
    const label = `${where}, bloco ${index + 1}`;
    if (!object(block)) { errors.push(`${label}: bloco inválido`); continue; }
    if (!nonempty(block.id)) errors.push(`${label}: ID inválido`);
    else {
      if (ids.has(block.id)) errors.push(`${label}: ID duplicado`);
      ids.add(block.id);
    }
    if (block.alignment !== undefined && block.alignment !== 'left' && block.alignment !== 'center' && block.alignment !== 'right' && block.alignment !== 'justify') errors.push(`${label}: alinhamento inválido`);
    const special = () => validateSpecialContent(block, label,
      (children, childLabel) => validateBlocks(children, childLabel, ids, depth + 1),
      (formatted, formattedLabel) => { const result: string[] = []; validateText(formatted, result, formattedLabel); return result; },
    );
    switch (block.type) {
      case 'paragraph': case 'aside': case 'quote': case 'heading':
        validateText(block, errors, label);
        if (block.type === 'heading' && block.level !== 2 && block.level !== 3) errors.push(`${label}: nível de título inválido`);
        if (block.type === 'quote' && block.attribution !== undefined && !nonempty(block.attribution)) errors.push(`${label}: atribuição inválida`);
        break;
      case 'divider':
        if (block.text !== undefined && !nonempty(block.text)) errors.push(`${label}: separador vazio ou inválido`);
        if (block.segments !== undefined) validateText(block, errors, label);
        break;
      case 'image':
        if (!isSafeReaderImage(block.src) || !nonempty(block.alt)) errors.push(`${label}: imagem exige URL segura e texto alternativo`);
        if (block.caption !== undefined && !nonempty(block.caption)) errors.push(`${label}: legenda inválida`);
        break;
      case 'external-link':
        if (!isSafeReaderLink(block.href) || !nonempty(block.label)) errors.push(`${label}: link externo inválido`);
        break;
      case 'chat': {
        if (block.entries !== undefined) { errors.push(...special()); break; }
        if (!nonempty(block.chatId) || !Array.isArray(block.messages) || !block.messages.length) {
          errors.push(`${label}: conversa sem identificação ou mensagens reais`);
          break;
        }
        const messageIds = new Set<string>();
        for (const message of block.messages) {
          if (!object(message)) { errors.push(`${label}: mensagem inválida`); continue; }
          if (!nonempty(message.id) || messageIds.has(message.id)) errors.push(`${label}: ID de mensagem inválido ou duplicado`);
          else messageIds.add(message.id);
          if (!nonempty(message.sender)) errors.push(`${label}: remetente inválido`);
          if (message.time !== undefined && !nonempty(message.time)) errors.push(`${label}: horário inválido`);
          validateText(message, errors, label);
        }
        break;
      }
      case 'email': case 'document': case 'notice': case 'excerpt': errors.push(...special()); break;
      default: errors.push(`${label}: tipo de bloco desconhecido`);
    }
  }
  return errors;
}

export function validateChapterContent(value: unknown, chapter: Chapter): string[] {
  if (!object(value)) return ['Conteúdo de capítulo inválido'];
  const errors: string[] = [];
  if (value.id !== chapter.id) errors.push('ID do arquivo diverge do catálogo');
  if (!Array.isArray(value.blocks) || !value.blocks.length) errors.push('Capítulo sem conteúdo narrativo');
  const ids = new Set<string>();
  errors.push(...validateBlocks(value.blocks, 'Narrativa', ids));
  if (!object(value.notes)) errors.push('Notas ausentes ou inválidas');
  else {
    for (const side of ['before', 'after'] as const) {
      const notes = value.notes[side];
      errors.push(...validateBlocks(notes, `Notas ${side}`, ids));
      const expected = side === 'before' ? chapter.notes.hasBefore : chapter.notes.hasAfter;
      if (Array.isArray(notes) && (notes.length > 0) !== expected) errors.push(`Notas ${side} divergem da indicação no catálogo`);
    }
  }
  if (value.contentWarnings !== undefined && (!Array.isArray(value.contentWarnings) || !value.contentWarnings.every(nonempty))) {
    errors.push('Avisos de conteúdo inválidos');
  }
  return errors;
}

export function assertChapterContent(value: unknown, chapter: Chapter): asserts value is ChapterContent {
  const errors = validateChapterContent(value, chapter);
  if (errors.length) throw new Error(errors.join('; '));
}
