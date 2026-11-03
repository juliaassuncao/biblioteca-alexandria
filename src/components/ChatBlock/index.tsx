import { MessageCircle } from 'lucide-react';
import type { ChatEntry } from '../../types/fanfic';
import { isSafeReaderImage } from '../../utils/reader-links';
import ChapterBody from '../ChapterBody';
import { inlineContent } from '../ChapterBody/inline';
import type { ChatBlockProps } from './props';
import styles from './styles.module.scss';

export default function ChatBlock({ block }: ChatBlockProps) {
  const entries: ChatEntry[] = block.entries ?? (block.messages ?? []).map(message => ({
    id: message.id, kind: 'message', side: 'left', time: message.time,
    sender: { id: `${message.id}-sender`, type: 'paragraph', text: message.sender },
    body: [{ id: `${message.id}-body`, type: 'paragraph', text: message.text, segments: message.segments }],
  }));
  const names = [...new Set(block.participants?.flatMap(participant => participant.name ? [participant.name] : [])
    ?? entries.flatMap(entry => entry.kind === 'message' && entry.sender ? [entry.sender.text] : []))];
  return <section className={styles.chat} aria-label={block.title ?? 'Conversa'}>
    <header className={styles.header}><MessageCircle size={17} aria-hidden="true" /><div><h3>{block.title ?? 'Conversa'}</h3>{names.length > 0 && <p>{names.join(' · ')}</p>}</div></header>
    <ol className={styles.messages}>{entries.map((entry, index) => {
      if (entry.kind !== 'message') return <li key={entry.id} className={styles.system} data-kind={entry.kind}>{inlineContent(entry.content)}</li>;
      const participant = block.participants?.find(item => item.id === entry.participantId);
      const next = entries[index + 1];
      const lastInGroup = next?.kind !== 'message' || next.side !== entry.side || !!next.sender;
      return <li className={styles.message} data-side={entry.side} data-tail={lastInGroup} key={entry.id}>
        {participant?.avatar && isSafeReaderImage(participant.avatar.src) && <img className={styles.avatar} src={participant.avatar.src} alt={participant.avatar.alt} loading="lazy" />}
        <div className={styles.bubble}>
          {entry.sender ? <div className={styles.sender}><ChapterBody blocks={[entry.sender]} context="message" /></div> : participant?.name && <p className={styles.participant}>{participant.name}</p>}
          <ChapterBody blocks={entry.body} context="message" />
          {entry.time && <span className={styles.time}>{entry.time}</span>}
        </div>
      </li>;
    })}</ol>
  </section>;
}
