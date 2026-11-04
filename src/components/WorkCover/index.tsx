import { Brush, Clover, Feather, Fingerprint, FileSignature, Sun } from 'lucide-react';
import type { WorkCoverProps } from './props';
import styles from './styles.module.scss';

export default function WorkCover({ work, featured = false }: WorkCoverProps) {
  const longTitle = work.title.length > 32;
  const titleScale = Math.max(6.5, Math.min(12, 14 * Math.sqrt(24 / work.title.length)));
  return <div className={`${styles.cover} ${longTitle ? styles.longTitle : ''} ${styles[work.cover.tone]} ${featured ? styles.featured : ''}`} aria-hidden="true">
    <span className={styles.lineTop}>BIBLIOTECA DE ALEXANDRIA</span>
    <div className={styles.composition}>
    <span className={styles.ornament}>
      {work.cover.ornament === 'sun' ? (
        <Sun size={45} strokeWidth={0.7} />
      ) : work.cover.ornament === 'tennis-ball' ? (
        <svg width={45} height={45} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={0.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="10" r="7" />
          <path d="M7 5c4 2 4 8 0 10M17 5c-4 2-4 8 0 10" />
          <path d="M2 18h20" stroke="#f2f2db" />
        </svg>
      ) : work.cover.ornament === 'bible' ? (
        <svg width={45} height={45} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={0.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
          <path d="M12 6v8M9 9h6" />
        </svg>
      ) : work.cover.ornament === 'fingerprint' ? (
        <Fingerprint size={45} strokeWidth={0.7} />
      ) : work.cover.ornament === 'clover' ? (
        <Clover size={45} strokeWidth={0.7} />
      ) : work.cover.ornament === 'contract' ? (
        <FileSignature size={45} strokeWidth={0.7} />
      ) : work.cover.ornament === 'paintbrush' ? (
        <Brush size={45} strokeWidth={0.7} />
      ) : (
        <Feather size={46} strokeWidth={0.7} />
      )}
    </span>
    <strong className={styles.title} style={longTitle ? { fontSize: `min(${titleScale}cqw,${titleScale * 2.7}px)` } : undefined}>{work.title.toLocaleUpperCase('pt-BR')}</strong>
    <span className={styles.stroke}></span>
    <span className={styles.caption}>{work.cover.caption}</span>
    </div>
    <span className={styles.bottom}>ALEXANDRIA  ·  LOQUINHA</span>
  </div>;
}
