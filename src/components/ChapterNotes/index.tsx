import { useId } from 'react';
import ChapterBody from '../ChapterBody';
import type { ChapterNotesProps } from './props';
import styles from './styles.module.scss';
export default function ChapterNotes({ blocks, position }: ChapterNotesProps) {
  const headingId = useId();
  if (!blocks.length) return null;
  return <section className={styles.notes} data-position={position} aria-labelledby={headingId}>
    <header><span className={styles.marker} aria-hidden="true" /><div><h2 id={headingId}>Notas da autora · {position === 'before' ? 'antes do capítulo' : 'depois do capítulo'}</h2></div></header>
    <ChapterBody blocks={blocks} context="note" />
  </section>;
}
