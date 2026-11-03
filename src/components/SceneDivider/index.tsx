import type { SceneDividerProps } from './props';
import styles from './styles.module.scss';
export default function SceneDivider({ label = 'Mudança de cena' }: SceneDividerProps) {
  return <div className={styles.divider} role="separator" aria-label={label}><span aria-hidden="true" /></div>;
}
