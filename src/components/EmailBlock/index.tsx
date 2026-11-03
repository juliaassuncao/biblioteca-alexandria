import { Mail } from 'lucide-react';
import { isSafeReaderLink } from '../../utils/reader-links';
import ChapterBody from '../ChapterBody';
import type { EmailBlockProps } from './props';
import styles from './styles.module.scss';

export default function EmailBlock({ block }: EmailBlockProps) {
  const fields = [['De', block.from], ['Para', block.to], ['Assunto', block.subject], ['Data', block.date]];
  return <section className={styles.email} aria-label="E-mail na narrativa">
    <header><Mail size={17} aria-hidden="true" /><span>E-mail</span></header>
    {fields.some(([, value]) => value) && <dl>{fields.map(([label, value]) => value && <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
    <div className={styles.body}><ChapterBody blocks={block.body} context="document" /></div>
    {!!block.signature?.length && <footer><ChapterBody blocks={block.signature} context="document" /></footer>}
    {!!block.attachments?.length && <aside className={styles.attachments} aria-label="Anexos"><strong>Anexos</strong><ul>{block.attachments.map((attachment, index) => <li key={index}>{isSafeReaderLink(attachment.href) ? <a href={attachment.href} target="_blank" rel="noopener noreferrer">{attachment.label}</a> : attachment.label}</li>)}</ul></aside>}
  </section>;
}
