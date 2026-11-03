import { ArrowUpRight, BookOpen, ExternalLink } from 'lucide-react';
import { Link } from 'react-router';
import WorkCover from '../WorkCover';
import { getReadingUrl } from '../../services/catalog';
import type { WorkCardProps } from './props';
import styles from './styles.module.scss';

export default function WorkCard({ work }: WorkCardProps) {
  const externalUrl = getReadingUrl(work);
  const isExternal = work.reading.mode === 'external';
  const item = <>
    <div className={styles.art}><WorkCover work={work}/><span className={styles.openIcon}>
      {isExternal ? <ExternalLink size={17}/> : <ArrowUpRight size={17}/>}</span></div>
    <div className={styles.row}><span className={styles.category}>{isExternal ? 'SITE PRÓPRIO' : 'ACERVO ALEXANDRIA'}</span>
      {work.status === 'ongoing' && <span className={styles.status}>Em andamento</span>}</div>
    <h3 className={styles.title}>{work.title}</h3>
    <p className={styles.author}>{work.author.displayName ? `por ${work.author.displayName}` : 'Experiência independente'}</p>
    <div className={styles.bottom}><BookOpen size={13}/><span>{work.stats.publishedChapters !== null ? `${work.stats.publishedChapters} capítulos` : 'Acessar projeto'}</span>
      <span className={styles.arrow}>↗</span></div>
  </>;

  return <article className={styles.card}>
    {externalUrl ? <a className={styles.link} href={externalUrl} target="_blank" rel="noopener noreferrer" aria-label={`Abrir ${work.title} no site próprio (nova aba)`}>{item}</a> :
      <Link className={styles.link} to={`/obra/${work.slug}`} aria-label={`Ver detalhes de ${work.title}`}>{item}</Link>}
  </article>;
}
