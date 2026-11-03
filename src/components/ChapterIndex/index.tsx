import { useId, useState } from 'react';
import { getAvailableChapters, hasChapterContent } from '../../services/chapters';
import { useChapterCompletion } from '../../hooks/useChapterCompletion';
import ChapterRow from '../ChapterRow';
import type { ChapterIndexProps } from './props';
import styles from './styles.module.scss';

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
export default function ChapterIndex({ work, currentNumber, onSelect, editorial = false }: ChapterIndexProps) {
  const [query, setQuery] = useState('');
  const inputId = useId();
  const { isRead } = useChapterCompletion(work.id);
  const chapters = work.chapters.filter(chapter => normalize(`${editorial ? String(chapter.number).padStart(3, '0') : chapter.number} ${chapter.title}`).includes(normalize(query.trim())));
  const available = getAvailableChapters(work);
  const search = <>
    <label htmlFor={inputId}>Buscar por número ou título do capítulo</label>
    <input id={inputId} type="search" placeholder="Buscar capítulo…" value={query} onChange={event => setQuery(event.target.value)} />
  </>;
  return <div className={styles.index}>
    {editorial ? <div className={styles.toolbar}>
      <dl className={styles.stats} aria-live="polite">
        <div><dt>Capítulos disponíveis</dt><dd>{available.length}</dd></div>
        <div><dt>Lidos neste navegador</dt><dd>{available.filter(chapter => isRead(chapter.id)).length}</dd></div>
      </dl>
      <div className={styles.search}>{search}</div>
    </div> : search}
    <p role="status" className={editorial && !query.trim() ? 'sr-only' : styles.result}>{chapters.length} de {work.chapters.length} capítulos</p>
    {chapters.length ? <ol>{chapters.map(chapter => <li key={chapter.id}><ChapterRow work={work} chapter={chapter} available={hasChapterContent(work, chapter)} read={isRead(chapter.id)} current={chapter.number === currentNumber} onSelect={onSelect} editorial={editorial} /></li>)}</ol>
      : <p>Nenhum capítulo encontrado. Tente outro número ou título.</p>}
  </div>;
}
