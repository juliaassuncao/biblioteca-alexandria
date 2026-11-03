import ChapterBody from '../ChapterBody';
import type { ExcerptBlockProps } from './props';
import styles from './styles.module.scss';
export default function ExcerptBlock({ block }: ExcerptBlockProps) {
  return <figure className={styles.excerpt} aria-label="Trecho literário"><span className={styles.label}>Trecho literário</span><blockquote><ChapterBody blocks={block.body} context="quote" /></blockquote>{block.attribution && <figcaption>{block.attribution}</figcaption>}</figure>;
}
