import { Download } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { canExport } from '../../services/export/export-content';
import { hasChapterContent } from '../../services/chapters';
import type { ExportFormat } from '../../services/export/export-types';
import type { DownloadActionsProps } from './props';
import styles from './styles.module.scss';

export default function DownloadActions({ work, chapter, content }: DownloadActionsProps) {
  const labelId = useId();
  const busy = useRef(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const [pending, setPending] = useState<ExportFormat | null>(null);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  if (!canExport(work)) return null;
  const available = chapter ? hasChapterContent(work, chapter) : work.chapters.length > 0;
  const subject = chapter ? 'capítulo' : 'obra';
  const generate = async (format: ExportFormat) => {
    if (busy.current) return;
    busy.current = true;
    controller.current = new AbortController();
    setPending(format); setFailed(false); setMessage(`Preparando ${format.toUpperCase()} ${chapter ? 'do capítulo' : 'da obra'}…`);
    try {
      const { createExport, downloadBlob } = await import('../../services/export');
      const result = await createExport({ work, chapter, content }, format, controller.current.signal);
      downloadBlob(result.blob, result.filename);
      setMessage(`Download de ${result.filename} iniciado.`);
    } catch (error) {
      if (controller.current?.signal.aborted) return;
      setFailed(true);
      setMessage(error instanceof Error ? error.message : 'Não foi possível gerar o arquivo. Tente novamente.');
    } finally { busy.current = false; setPending(null); }
  };
  return <section className={styles.actions} aria-labelledby={labelId}>
    <div className={styles.controls}>
      <span id={labelId}>Baixar {subject}</span>
      <div className={styles.formats} aria-busy={pending !== null}>
        {(['pdf', 'epub'] as const).map(format => <button key={format} type="button" disabled={!available || pending !== null}
          aria-label={`Baixar ${subject} em ${format.toUpperCase()}`} onClick={() => void generate(format)}>
          <Download size={14} aria-hidden="true" /> {pending === format ? 'Gerando…' : format.toUpperCase()}
        </button>)}
      </div>
    </div>
    <p className={styles.message} role={failed ? 'alert' : 'status'}>{available ? message : 'Conteúdo indisponível para download.'}</p>
  </section>;
}
