import { Brush, Clover, Feather, Fingerprint } from 'lucide-react';
import type { WorkCoverProps } from './props';
import styles from './styles.module.scss';

export default function WorkCover({ work, featured = false }: WorkCoverProps) {
  return <div className={`${styles.cover} ${styles[work.cover.tone]} ${featured ? styles.featured : ''}`} aria-hidden="true">
    <span className={styles.lineTop}>BIBLIOTECA DE ALEXANDRIA</span>
    <div className={styles.composition}>
    <span className={styles.ornament}>
      {work.cover.ornament === 'fingerprint' ? (
        <Fingerprint size={45} strokeWidth={0.7} />
      ) : work.cover.ornament === 'clover' ? (
        <Clover size={45} strokeWidth={0.7} />
      ) : work.cover.ornament === 'paintbrush' ? (
        <Brush size={45} strokeWidth={0.7} />
      ) : (
        <Feather size={46} strokeWidth={0.7} />
      )}
    </span>
    <strong className={styles.title}>{work.title}</strong>
    <span className={styles.stroke}></span>
    <span className={styles.caption}>{work.cover.caption}</span>
    </div>
    <span className={styles.bottom}>ALEXANDRIA  ·  LOQUINHA</span>
  </div>;
}
