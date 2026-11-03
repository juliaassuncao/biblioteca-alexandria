import { useEffect, useRef } from 'react';
import type { ReaderPanelProps } from './props';
import { panelTabStops } from './focus';
import styles from './styles.module.scss';

export default function ReaderPanel({ id, title, open, onClose, children, editorial = false }: ReaderPanelProps) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return <dialog ref={ref} id={id} className={`${styles.panel}${editorial ? ` ${styles.editorial}` : ''}`} aria-modal="true" aria-labelledby={`${id}-title`}
    onKeyDown={event => {
      // Campos de busca podem consumir Escape para limpar o termo no navegador.
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); }
      if (event.key === 'Tab') {
        const stops = panelTabStops(event.currentTarget);
        const first = stops[0];
        const last = stops[stops.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }}
    onCancel={event => { event.preventDefault(); onClose(); }}>
    <header><h2 id={`${id}-title`}>{title}</h2><button type="button" onClick={onClose}>Fechar</button></header>
    {editorial ? <div className={styles.content}>{children}</div> : children}
  </dialog>;
}
