import { loadChapter } from '../chapters';
import { prepareExport } from './export-content.ts';
import { collectAssets } from './export-assets.ts';
import { exportFilename } from './export-filename.ts';
import type { ExportFormat, ExportRequest } from './export-types.ts';

// A geração não ocupa a thread de interação do leitor.
self.onmessage = async ({ data }: MessageEvent<{ request: ExportRequest; format: ExportFormat }>) => {
  try {
    const book = await prepareExport(data.request, loadChapter);
    const assets = await collectAssets(book);
    const blob = data.format === 'pdf'
      ? await (await import('./pdf/index.ts')).generatePdf(book, assets)
      : await (await import('./epub/index.ts')).generateEpub(book, assets);
    self.postMessage({ blob, filename: exportFilename(book, data.format) });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'Falha ao gerar o arquivo.' });
  }
};
