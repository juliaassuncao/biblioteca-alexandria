import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import { Link } from 'react-router';
import { chapterHref } from '../../services/chapters';
import type { ChapterNavigationProps } from './props';
import styles from './styles.module.scss';
export default function ChapterNavigation({ work, previous, next, onIndex, indexOpen = false }: ChapterNavigationProps) {
  return <div className={styles.footer}>
    <nav className={styles.navigation} aria-label="Navegação entre capítulos">
      <div>{previous && <Link to={chapterHref(work, previous)}><ArrowLeft size={18} aria-hidden="true" /><span><small>Capítulo anterior</small><strong>{previous.title}</strong></span></Link>}</div>
      <div>{next && <Link to={chapterHref(work, next)}><span><small>Próximo capítulo</small><strong>{next.title}</strong></span><ArrowRight size={18} aria-hidden="true" /></Link>}</div>
    </nav>
    <div className={styles.index}><button type="button" onClick={onIndex} aria-haspopup="dialog" aria-expanded={indexOpen} aria-controls="reader-index-panel"><BookOpen size={16} aria-hidden="true" /> Ver todos os capítulos</button></div>
  </div>;
}
