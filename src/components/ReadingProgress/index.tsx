import { useEffect, useState } from 'react';
import { readingProgress } from '../../services/reading-progress';
import type { ReadingProgressProps } from './props';
import styles from './styles.module.scss';

export default function ReadingProgress({ target, enabled }: ReadingProgressProps) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    setValue(0);
    if (!enabled || !target.current) return;
    let frame = 0;
    let active = true;
    const measure = () => {
      frame = 0;
      if (!target.current || !active) return;
      const rect = target.current.getBoundingClientRect();
      setValue(readingProgress(window.scrollY, window.innerHeight, rect.top + window.scrollY, rect.height));
    };
    const schedule = () => { if (!frame && active) frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(schedule);
    observer.observe(target.current);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    document.fonts.ready.then(schedule);
    schedule();
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [target, enabled]);
  if (!enabled) return null;
  return <progress className={styles.progress} value={value} max={100} aria-label="Progresso de leitura deste capítulo">{value}%</progress>;
}
