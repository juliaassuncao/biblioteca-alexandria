import { ArrowRight, Check } from 'lucide-react';
import { Link } from 'react-router';
import { chapterHref } from '../../services/chapters';
import type { ChapterRowProps } from './props';
import styles from './styles.module.scss';

export default function ChapterRow({ work, chapter, available, read, current, onSelect, editorial = false }: ChapterRowProps) {
  const content = <>
    <span className={styles.number} aria-hidden="true">{String(chapter.number).padStart(editorial ? 3 : 2, '0')}</span>
    <span className={styles.main}>
      <strong>{chapter.title}</strong>
      {editorial ? <span className={styles.details}><span className={read ? styles.read : undefined}>{read && <Check size={13} aria-hidden="true" />}{read ? 'Lido' : 'Não lido'}</span></span> : <span className={styles.details}>
        <span>{available ? 'Disponível' : 'Leitura indisponível'}</span>
        {read && <span className={styles.read}><Check size={13} aria-hidden="true" /> Lido</span>}
        {(chapter.notes.hasBefore || chapter.notes.hasAfter) && <span>Nota da autora</span>}
      </span>}
      {!editorial && chapter.contentWarnings.map(warning => <span className={styles.warning} key={warning}>{warning}</span>)}
    </span>
    {available && <ArrowRight className={styles.arrow} size={20} aria-hidden="true" />}
  </>;
  return available ? <Link className={`${styles.row}${editorial ? ` ${styles.editorial}` : ''}`} to={chapterHref(work, chapter)} aria-label={`Capítulo ${chapter.number}: ${chapter.title}${read ? ', lido' : editorial ? ', não lido' : ''}`} aria-current={current ? 'page' : undefined} onClick={onSelect}>{content}</Link>
    : <div className={`${styles.row} ${styles.unavailable}`} aria-disabled="true">{content}</div>;
}
