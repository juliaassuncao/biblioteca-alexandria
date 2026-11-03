import { useId } from 'react';
import type { ChapterWarningProps } from './props';
import styles from './styles.module.scss';

export default function ChapterWarning({ warnings }: ChapterWarningProps) {
  const headingId = useId();
  if (!warnings.length) return null;
  return <aside className={styles.warning} aria-labelledby={headingId}>
    <h2 id={headingId}>Avisos de conteúdo deste capítulo</h2>
    <ul>{warnings.map(warning => <li key={warning}>{warning}</li>)}</ul>
  </aside>;
}
