import { Brush, Clover, Feather, Fingerprint, FileSignature } from 'lucide-react';
import type { WorkCoverProps } from './props';
import styles from './styles.module.scss';

export default function WorkCover({ work, featured = false }: WorkCoverProps) {
  const longTitle = work.title.length > 32;
  const titleScale = Math.max(6.5, Math.min(12, 14 * Math.sqrt(24 / work.title.length)));
  return <div className={`${styles.cover} ${longTitle ? styles.longTitle : ''} ${styles[work.cover.tone]} ${featured ? styles.featured : ''}`} aria-hidden="true">
    <span className={styles.lineTop}>BIBLIOTECA DE ALEXANDRIA</span>
    <div className={styles.composition}>
    <span className={styles.ornament}>
      {work.cover.ornament === 'fingerprint' ? (
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
    <strong className={styles.title} style={longTitle ? { fontSize: `min(${titleScale}cqw,${titleScale * 2.7}px)` } : undefined}>{work.title}</strong>
    <span className={styles.stroke}></span>
    <span className={styles.caption}>{work.cover.caption}</span>
    </div>
    <span className={styles.bottom}>ALEXANDRIA  ·  LOQUINHA</span>
  </div>;
}
