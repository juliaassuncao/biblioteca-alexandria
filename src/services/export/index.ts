import type { ExportFormat, ExportRequest } from './export-types.ts';

export function createExport(request: ExportRequest, format: ExportFormat, signal?: AbortSignal): Promise<{ blob: Blob; filename: string }> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(new DOMException('Exportação cancelada.', 'AbortError')); return; }
    const worker = new Worker(new URL('./export.worker.ts', import.meta.url), { type: 'module' });
    const cleanup = () => { worker.terminate(); signal?.removeEventListener('abort', cancel); };
    const cancel = () => { cleanup(); reject(new DOMException('Exportação cancelada.', 'AbortError')); };
    signal?.addEventListener('abort', cancel, { once: true });
    worker.onmessage = ({ data }) => {
      cleanup();
      if (data.error) reject(new Error(data.error));
      else if (!(data.blob instanceof Blob) || !data.blob.size) reject(new Error('O arquivo gerado está vazio. Tente novamente.'));
      else resolve({ blob: data.blob, filename: data.filename });
    };
    worker.onerror = event => { event.preventDefault(); cleanup(); reject(new Error('Não foi possível preparar o arquivo. Tente novamente.')); };
    try { worker.postMessage({ request, format }); }
    catch (error) { cleanup(); reject(error); }
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  try { anchor.click(); }
  finally { anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 60_000); }
}
