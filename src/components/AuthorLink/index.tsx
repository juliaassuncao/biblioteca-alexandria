import type { AuthorLinkProps } from './props';
import styles from './styles.module.scss';
export default function AuthorLink({ author, label }: AuthorLinkProps) {
  const name = label ?? author.displayName ?? author.ao3Name;
  if (!name) return null;
  let href: string | undefined;
  try { const url = new URL(author.authorLink ?? ''); if (['http:', 'https:'].includes(url.protocol)) href = url.href; } catch { /* Nome sem perfil conhecido. */ }
  return href ? <a className={styles.link} href={href} target="_blank" rel="noopener noreferrer">{name}</a> : <span>{name}</span>;
}
