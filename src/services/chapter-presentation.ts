import type { ChapterBlock, ChatEntry, DocumentKind, TextBlock } from '../types/fanfic.ts';
import type { ChapterPresentation, PresentationGroup } from '../types/chapter-presentation.ts';
import { presentConversation, presentTweets } from './digital-presentation.ts';

export const DOCUMENT_KINDS = ['document', 'letter', 'syllabus', 'report', 'article', 'form', 'contract', 'draft'] as const;

export function validatePresentation(value: unknown, chapterId: string, blocks: ChapterBlock[]): string[] {
  if (!value || typeof value !== 'object' || !('chapterId' in value) || value.chapterId !== chapterId || !('groups' in value) || !Array.isArray(value.groups)) return ['Apresentação não corresponde ao capítulo'];
  const errors: string[] = [];
  let lastEnd = -1;
  for (const group of value.groups) {
    if (!group || typeof group !== 'object' || !['chat', 'tweet', 'email', 'document', 'notice', 'excerpt'].includes(group.type)) { errors.push('Tipo de apresentação inválido'); continue; }
    const start = blocks.findIndex(block => block.id === group.start);
    const end = blocks.findIndex(block => block.id === group.end);
    if (start < 0 || end < start || start <= lastEnd) { errors.push('Intervalo de apresentação inexistente, fora de ordem ou sobreposto'); continue; }
    lastEnd = end;
    if (group.leadingNarrativeLength !== undefined) {
      const first = blocks[start];
      if (group.type !== 'chat' || !Array.isArray(group.inlineSenders) || !Number.isInteger(group.leadingNarrativeLength) || group.leadingNarrativeLength <= 0 || !first || !('text' in first) || typeof first.text !== 'string' || group.leadingNarrativeLength >= first.text.length || !group.inlineSenders.some((name: string) => first.text!.slice(group.leadingNarrativeLength).startsWith(`${name}:`))) errors.push('Separação entre narrativa e conversa inválida');
    }
    if (group.inlineSenders !== undefined && (group.type !== 'chat' || !Array.isArray(group.inlineSenders) || !group.inlineSenders.length || !group.inlineSenders.every((name: unknown) => typeof name === 'string' && name.trim()) || new Set(group.inlineSenders).size !== group.inlineSenders.length || group.senderIds !== undefined)) errors.push('Remetentes inline inválidos');
    if (group.rightSenders !== undefined && (group.type !== 'chat' || !Array.isArray(group.inlineSenders) || !Array.isArray(group.rightSenders) || !group.rightSenders.every((name: unknown) => group.inlineSenders.includes(name)))) errors.push('Lados da conversa inválidos');
    if (blocks.slice(start, end + 1).some(block => block.type === 'divider')) errors.push('Apresentação não pode absorver separadores de cena');
    if (group.type === 'document' && !DOCUMENT_KINDS.includes(group.kind)) errors.push('Tipo de documento inválido');
    if (group.signatureIds !== undefined && (group.type !== 'document' || group.kind !== 'contract' || !Array.isArray(group.signatureIds) || !group.signatureIds.every((id: unknown) => typeof id === 'string' && blocks.slice(start, end + 1).some(block => block.id === id && block.type === 'paragraph')))) errors.push('Assinaturas exigem parágrafos do próprio contrato');
    if (group.type === 'notice' && !['notice', 'notification', 'alert'].includes(group.kind)) errors.push('Tipo de comunicado inválido');
    if (group.senderIds !== undefined && (group.type !== 'chat' || !Array.isArray(group.senderIds) || !group.senderIds.every((id: unknown) => typeof id === 'string' && blocks.slice(start, end + 1).some(block => block.id === id && (block.type === 'paragraph' || block.type === 'heading'))))) errors.push('Identificação de remetente inválida');
    if (group.messageSides !== undefined) {
      const senderIds = Array.isArray(group.senderIds) ? group.senderIds : [];
      const messages = blocks.slice(start, end + 1).filter(block => !senderIds.includes(block.id));
      if (group.type !== 'chat' || group.inlineSenders !== undefined || !group.messageSides || typeof group.messageSides !== 'object' || Array.isArray(group.messageSides)
        || !Object.entries(group.messageSides).every(([id, side]) => messages.some(block => block.id === id) && (side === 'left' || side === 'right'))) errors.push('Lados das mensagens inválidos');
    }
  }
  return errors;
}

function chatEntries(blocks: ChapterBlock[], senderIds: string[], messageSides: Record<string, 'left' | 'right'> = {}): ChatEntry[] {
  const entries: ChatEntry[] = [];
  let sender: TextBlock | undefined;
  for (const block of blocks) {
    if (senderIds.includes(block.id) && (block.type === 'paragraph' || block.type === 'heading')) {
      if (sender) throw new Error('Remetentes consecutivos sem mensagem');
      sender = block;
      continue;
    }
    const side = messageSides[block.id] ?? ('alignment' in block && block.alignment === 'right' ? 'right' : 'left');
    entries.push({ id: `${block.id}-message`, kind: 'message', side, ...(sender ? { sender } : {}), body: [block] });
    sender = undefined;
  }
  if (sender) throw new Error('Remetente sem mensagem no fim da conversa');
  return entries;
}

function wrapGroup(group: PresentationGroup, blocks: ChapterBlock[]): ChapterBlock {
  const id = `${group.start}-presentation`;
  switch (group.type) {
    case 'chat': return group.inlineSenders ? presentConversation(id, blocks, group.inlineSenders, group.rightSenders, group.leadingNarrativeLength) : { id, type: 'chat', chatId: id, entries: chatEntries(blocks, group.senderIds ?? [], group.messageSides) };
    case 'tweet': return presentTweets(id, blocks);
    case 'email': return { id, type: 'email', body: blocks };
    case 'document': return { id, type: 'document', kind: group.kind as DocumentKind, body: blocks, ...(group.signatureIds ? { signatureIds: group.signatureIds } : {}) };
    case 'notice': return { id, type: 'notice', kind: group.kind as 'notice' | 'notification' | 'alert', body: blocks };
    case 'excerpt': return { id, type: 'excerpt', body: blocks };
  }
}

export function applyChapterPresentation(chapterId: string, blocks: ChapterBlock[], value: unknown): ChapterBlock[] {
  const errors = validatePresentation(value, chapterId, blocks);
  if (errors.length) throw new Error(errors.join('; '));
  const { groups } = value as ChapterPresentation;
  const output: ChapterBlock[] = [];
  let cursor = 0;
  for (const group of groups) {
    const start = blocks.findIndex(block => block.id === group.start);
    const end = blocks.findIndex(block => block.id === group.end);
    output.push(...blocks.slice(cursor, start), wrapGroup(group, blocks.slice(start, end + 1)));
    cursor = end + 1;
  }
  output.push(...blocks.slice(cursor));
  return output;
}

export function sourceBlocks(blocks: ChapterBlock[]): ChapterBlock[] {
  return blocks.flatMap(block => {
    if ((block.type === 'chat' || block.type === 'tweet') && block.sourceBlocks) return block.sourceBlocks;
    if (block.type === 'tweet') return block.posts.flatMap(post => sourceBlocks(post.body));
    if (block.type === 'email') return [...sourceBlocks(block.body), ...sourceBlocks(block.signature ?? [])];
    if (block.type === 'document' || block.type === 'notice' || block.type === 'excerpt') return sourceBlocks(block.body);
    if (block.type === 'chat' && block.entries) return block.entries.flatMap(entry => entry.kind === 'message' ? [...(entry.sender ? [entry.sender] : []), ...sourceBlocks(entry.body)] : []);
    return [block];
  });
}
