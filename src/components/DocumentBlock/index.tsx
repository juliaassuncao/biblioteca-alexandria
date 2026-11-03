import { FileText } from 'lucide-react';
import ChapterBody from '../ChapterBody';
import { DOCUMENT_LABELS } from './constants';
import type { DocumentBlockProps } from './props';
import styles from './styles.module.scss';
export default function DocumentBlock({ block }: DocumentBlockProps) {
  return <section className={styles.document} data-kind={block.kind} aria-label={block.title ?? DOCUMENT_LABELS[block.kind]}>
    <header><FileText size={15} aria-hidden="true" /><span>{block.title ?? DOCUMENT_LABELS[block.kind]}</span></header>
    <ChapterBody blocks={block.body} context="document" />
  </section>;
}
