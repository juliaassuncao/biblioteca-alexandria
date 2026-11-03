import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { chapterHref } from '../../services/chapters';
import type { ChapterNavigationProps } from './props';
import styles from './styles.module.scss';
export default function ChapterNavigation({ work, previous, next, onIndex }: ChapterNavigationProps) {
  return <div className={styles.footer}>
    <nav className={styles.navigation} aria-label="Navegação entre capítulos">
      <div>{previous && <Link to={chapterHref(work, previous)}><ArrowLeft size={18} aria-hidden="true" /><span><small>Capítulo anterior</small><strong>{previous.title}</strong></span></Link>}</div>
      <div>{next && <Link to={chapterHref(work, next)}><span><small>Próximo capítulo</small><strong>{next.title}</strong></span><ArrowRight size={18} aria-hidden="true" /></Link>}</div>
    </nav>
    <div className={styles.index}><Link to={`/obra/${work.slug}#chapters-heading`}>Voltar ao índice da obra</Link><button type="button" onClick={onIndex}>Pesquisar capítulos</button></div>
  </div>;
}
