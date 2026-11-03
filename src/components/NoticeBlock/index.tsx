import { Bell } from 'lucide-react';
import ChapterBody from '../ChapterBody';
import type { NoticeBlockProps } from './props';
import styles from './styles.module.scss';
export default function NoticeBlock({ block }: NoticeBlockProps) {
  const label = block.title ?? (block.kind === 'notification' ? 'Notificação na narrativa' : block.kind === 'alert' ? 'Alerta na narrativa' : 'Comunicado na narrativa');
  return <aside className={styles.notice} data-kind={block.kind} aria-label={label}><header><Bell size={16} aria-hidden="true" /><span>{label}</span></header><ChapterBody blocks={block.body} context="document" /></aside>;
}
