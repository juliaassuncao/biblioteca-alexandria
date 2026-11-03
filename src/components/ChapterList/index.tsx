import ChapterIndex from '../ChapterIndex';
import type { ChapterListProps } from './props';
import styles from './styles.module.scss';
export default function ChapterList({ work }: ChapterListProps) {
  if (!work.chapters.length) return null;
  return <section className={styles.section} aria-labelledby="chapters-heading">
    <div className={styles.heading}><div><span className="eyebrow">ÍNDICE DA OBRA</span><h2 id="chapters-heading" tabIndex={-1}>Capítulos publicados</h2></div></div>
    <ChapterIndex work={work} editorial />
  </section>;
}
