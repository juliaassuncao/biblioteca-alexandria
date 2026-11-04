import type { ChapterBlock, ChatBlockData, ChatEntry, ChatParticipant, TextBlock, TweetBlockData, TweetPublication } from '../types/fanfic.ts';
import { formattedSlice } from './formatted-slice.ts';

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function presentConversation(id: string, sourceBlocks: ChapterBlock[], names: string[], rightSenders = names.slice(1), leadingNarrativeLength = 0): ChatBlockData {
  const participants: ChatParticipant[] = names.map((name, index) => ({ id: `person-${index}`, name }));
  const entries: ChatEntry[] = [];
  const pattern = new RegExp(`(?:^|(?<=\\s))(${names.map(escape).join('|')}):`, 'g');
  let current: Extract<ChatEntry, { kind: 'message' }> | undefined;
  let introduction: TextBlock | undefined;
  for (const [sourceIndex, sourceBlock] of sourceBlocks.entries()) {
    let block = sourceBlock;
    if (sourceIndex === 0 && leadingNarrativeLength && (sourceBlock.type === 'paragraph' || sourceBlock.type === 'heading')) {
      introduction = { ...sourceBlock, ...formattedSlice(sourceBlock, 0, leadingNarrativeLength), id: `${sourceBlock.id}-narrative` };
      block = { ...sourceBlock, ...formattedSlice(sourceBlock, leadingNarrativeLength) };
    }
    if (block.type === 'image') {
      if (!current) throw new Error('Imagem sem remetente na conversa');
      current.body.push(block);
      continue;
    }
    if (block.type !== 'paragraph' && block.type !== 'heading') throw new Error('Bloco inesperado na conversa');
    const matches = [...block.text.matchAll(pattern)];
    if (!matches.length || matches[0]?.index !== 0) throw new Error(`Mensagem sem remetente: ${block.id}`);
    matches.forEach((match, index) => {
      const start = match.index!;
      const end = matches[index + 1]?.index ?? block.text.length;
      const senderEnd = start + match[0].length;
      // The sender/body separator is represented by the bubble's heading spacing.
      const bodyStart = senderEnd + (/^[ \n]/.test(block.text.slice(senderEnd)) ? 1 : 0);
      const participantIndex = names.indexOf(match[1]!);
      const sender: TextBlock = { ...block, ...formattedSlice(block, start, senderEnd), id: `${block.id}-${index}-sender` };
      current = { id: `${block.id}-${index}-message`, kind: 'message', side: rightSenders.includes(match[1]!) ? 'right' : 'left', participantId: participants[participantIndex]!.id, sender, body: [] };
      if (block.text.slice(bodyStart, end).trim()) current.body.push({ ...block, ...formattedSlice(block, bodyStart, end), id: `${block.id}-${index}-body` });
      entries.push(current);
    });
  }
  if (entries.some(entry => entry.kind === 'message' && !entry.body.length)) throw new Error('Mensagem sem conteúdo');
  return { id, type: 'chat', chatId: id, participants, entries, sourceBlocks, ...(introduction ? { introduction } : {}) };
}

export function presentTweets(id: string, sourceBlocks: ChapterBlock[]): TweetBlockData {
  const posts: TweetPublication[] = [];
  let thread: TweetPublication[] = [];
  for (const block of sourceBlocks) {
    if (block.type === 'image') {
      if (!posts.length) throw new Error('Mídia sem publicação');
      posts[posts.length - 1]!.body.push(block);
      continue;
    }
    if (block.type !== 'paragraph' && block.type !== 'heading') throw new Error('Bloco inesperado na publicação');
    const matches = [...block.text.matchAll(/(?:^[‘“']?(?:\|\n)?|\n(?:\|\n)?)(@\w+)(?: replying to (@?\w+))?:/g)];
    const leadingEnd = matches[0]?.index ?? block.text.length;
    if (leadingEnd > 0) {
      if (!posts.length) throw new Error(`Publicação sem identificação: ${block.id}`);
      const end = withoutThreadSeparator(block.text, leadingEnd);
      if (block.text.slice(0, end).trim()) posts[posts.length - 1]!.body.push({ ...block, ...formattedSlice(block, 0, end), id: `${block.id}-continuation` });
    }
    matches.forEach((match, index) => {
      const start = match.index! + match[0].length;
      const end = withoutThreadSeparator(block.text, matches[index + 1]?.index ?? block.text.length);
      // Only an explicit reply marker can establish a relationship. A new
      // independent publication starts a new source thread, even when adjacent.
      if (!match[2]) thread = [];
      const target = match[2]?.replace(/^@/, '').toLocaleLowerCase();
      const parent = target ? [...thread].reverse().find(post => post.author.username?.replace(/^@/, '').toLocaleLowerCase() === target) : undefined;
      const post: TweetPublication = { id: `${block.id}-${index}-post`, author: { username: match[1]! }, ...(match[2] ? { replyTo: match[2] } : {}), ...(parent ? { replyToId: parent.id } : {}), body: [{ ...block, ...formattedSlice(block, start, end), id: `${block.id}-${index}-body` }] };
      posts.push(post);
      thread.push(post);
    });
  }
  return { id, type: 'tweet', posts, sourceBlocks };
}

// A vertical bar separates replies in the PDF; separate cards perform that role.
function withoutThreadSeparator(text: string, end: number): number {
  const separator = text.slice(0, end).match(/[ \t\n]*\|[ \t\n]*$/);
  return separator ? end - separator[0].length : end;
}
