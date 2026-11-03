import { isSafeReaderImage, isSafeReaderLink } from '../utils/reader-links.ts';

type RecordValue = Record<string, unknown>;
const object = (value: unknown): value is RecordValue => typeof value === 'object' && value !== null && !Array.isArray(value);
const nonempty = (value: unknown): value is string => typeof value === 'string' && !!value.trim();

export function validateSpecialContent(
  block: RecordValue,
  where: string,
  nested: (value: unknown, label: string) => string[],
  formatted: (value: RecordValue, label: string) => string[],
): string[] {
  const errors: string[] = [];
  const optionalText = (record: RecordValue, key: string, nullable = false) => {
    if (record[key] !== undefined && !(nullable && record[key] === null) && !nonempty(record[key])) errors.push(`${where}: ${key} inválido`);
  };
  const body = (value: unknown, label: string) => {
    if (!Array.isArray(value) || !value.length) errors.push(`${label}: conteúdo vazio`);
    errors.push(...nested(value, label));
  };
  optionalText(block, 'title');
  if (block.type === 'chat') {
    if (!nonempty(block.chatId)) errors.push(`${where}: identificação da conversa inválida`);
    const participants = new Set<string>();
    if (block.participants !== undefined) {
      if (!Array.isArray(block.participants)) errors.push(`${where}: participantes inválidos`);
      else for (const participant of block.participants) {
        if (!object(participant) || !nonempty(participant.id) || participants.has(participant.id)) { errors.push(`${where}: participante sem ID único`); continue; }
        participants.add(participant.id);
        optionalText(participant, 'name', true);
        if (participant.avatar !== undefined && participant.avatar !== null && (!object(participant.avatar) || !isSafeReaderImage(participant.avatar.src) || !nonempty(participant.avatar.alt))) errors.push(`${where}: avatar inválido`);
      }
    }
    if (!Array.isArray(block.entries) || !block.entries.length) return [...errors, `${where}: conversa sem mensagens reais`];
    const entryIds = new Set<string>();
    for (const entry of block.entries) {
      if (!object(entry) || !nonempty(entry.id) || entryIds.has(entry.id)) { errors.push(`${where}: entrada de conversa sem ID único`); continue; }
      entryIds.add(entry.id);
      if (entry.kind === 'date' || entry.kind === 'system') {
        if (!object(entry.content)) errors.push(`${where}: texto de data/sistema inválido`);
        else errors.push(...formatted(entry.content, where));
      } else if (entry.kind === 'message') {
        if (entry.side !== 'left' && entry.side !== 'right') errors.push(`${where}: direção da mensagem inválida`);
        if (entry.participantId !== undefined && (typeof entry.participantId !== 'string' || !participants.has(entry.participantId))) errors.push(`${where}: participante da mensagem não cadastrado`);
        optionalText(entry, 'time');
        if (entry.sender !== undefined) {
          if (!object(entry.sender) || typeof entry.sender.type !== 'string' || !['paragraph', 'heading'].includes(entry.sender.type)) errors.push(`${where}: remetente inválido`);
          else errors.push(...nested([entry.sender], `${where}, remetente`));
        }
        body(entry.body, `${where}, mensagem`);
      } else errors.push(`${where}: entrada de conversa desconhecida`);
    }
    return errors;
  }
  body(block.body, `${where}, corpo`);
  if (block.type === 'document' && (typeof block.kind !== 'string' || !['document', 'letter', 'syllabus', 'report', 'article', 'form', 'contract', 'draft'].includes(block.kind))) errors.push(`${where}: tipo de documento inválido`);
  if (block.type === 'notice' && (typeof block.kind !== 'string' || !['notice', 'notification', 'alert'].includes(block.kind))) errors.push(`${where}: tipo de comunicado inválido`);
  if (block.signatureIds !== undefined && (block.type !== 'document' || block.kind !== 'contract' || !Array.isArray(block.signatureIds) || !block.signatureIds.every(id => typeof id === 'string' && Array.isArray(block.body) && block.body.some((b: unknown) => object(b) && b.type === 'paragraph' && b.id === id)))) errors.push(`${where}: assinaturas inválidas`);
  if (block.type === 'excerpt') optionalText(block, 'attribution');
  if (block.type === 'email') {
    for (const key of ['from', 'to', 'subject', 'date']) optionalText(block, key, true);
    if (block.signature !== undefined) errors.push(...nested(block.signature, `${where}, assinatura`));
    if (block.attachments !== undefined) {
      if (!Array.isArray(block.attachments)) errors.push(`${where}: anexos inválidos`);
      else for (const attachment of block.attachments) if (!object(attachment) || !nonempty(attachment.label) || !isSafeReaderLink(attachment.href)) errors.push(`${where}: anexo sem nome ou URL segura`);
    }
  }
  return errors;
}
