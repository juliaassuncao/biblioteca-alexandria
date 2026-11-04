import AuthorLink from '../AuthorLink';
import { ArrowUpRight, BookOpen } from 'lucide-react';
import { Link } from 'react-router';
import WorkCover from '../WorkCover';
import type { WorkCardProps } from './props';
import styles from './styles.module.scss';

export default function WorkCard({ work }: WorkCardProps) {
  const isExternal = work.reading.mode === 'external';
  const item = <>
    <div className={styles.art}><WorkCover work={work}/>{!isExternal && <span className={styles.openIcon}>
      <ArrowUpRight size={17}/></span>}</div>
    <div className={styles.row}><span className={styles.category}>{isExternal ? 'SITE PRÓPRIO' : 'ACERVO ALEXANDRIA'}</span>
      {work.status === 'ongoing' && <span className={styles.status}>Em andamento</span>}
      {work.status === 'completed' && <span className={styles.status}>Concluída</span>}</div>
    <h3 className={styles.title}>{work.title}</h3>
  </>;

  return <article className={styles.card}>
    <Link className={styles.link} to={`/obra/${work.slug}`} aria-label={`Ver detalhes de ${work.title}`}>{item}</Link>
    <p className={styles.author}>{work.author.displayName ? <>por <AuthorLink author={work.author} /></> : 'Experiência independente'}</p>
    <div className={styles.bottom}><BookOpen size={13}/><span>{work.stats.publishedChapters !== null ? `${work.stats.publishedChapters} capítulos` : 'Acessar projeto'}</span>{isExternal && <Link className={styles.details} to={`/obra/${work.slug}`}>Sobre a obra</Link>}<span className={styles.arrow}>↗</span></div>
  </article>;
}
