import { visitNodes } from './export-content.ts';
import type { AssetLoader, ExportAsset, ExportBook } from './export-types.ts';

export const fetchLocalAsset: AssetLoader = async src => {
  const url = new URL(src, globalThis.location.href);
  if (url.origin !== globalThis.location.origin) throw new Error(`Recurso externo não incorporado: ${src}. É necessário fornecer um arquivo local.`);
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error();
    return new Uint8Array(await response.arrayBuffer());
  } catch { throw new Error(`Não foi possível carregar o recurso: ${src}. Tente novamente.`); }
};

export async function collectAssets(book: ExportBook, load: AssetLoader = fetchLocalAsset): Promise<ExportAsset[]> {
  const sources = new Set<string>();
  visitNodes(book, node => { if (node.kind === 'image') sources.add(node.src); });
  const assets: ExportAsset[] = [];
  for (const src of sources) {
    const bytes = await load(src);
    const png = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
    const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const pngComplete = png && bytes.length > 45 && new TextDecoder().decode(bytes.slice(12, 16)) === 'IHDR'
      && new TextDecoder().decode(bytes.slice(-8, -4)) === 'IEND';
    const jpegComplete = jpeg && bytes.length > 4 && bytes[bytes.length - 2] === 255 && bytes[bytes.length - 1] === 217;
    if (!pngComplete && !jpegComplete) throw new Error(`Imagem sem suporte ou inválida: ${src}. Utilize PNG ou JPEG.`);
    if (typeof createImageBitmap === 'function') {
      try {
        const image = await createImageBitmap(new Blob([bytes.slice().buffer], { type: png ? 'image/png' : 'image/jpeg' }));
        image.close();
      } catch { throw new Error(`Não foi possível decodificar a imagem: ${src}`); }
    }
    assets.push({ src, path: `images/image-${assets.length + 1}.${png ? 'png' : 'jpg'}`, mediaType: png ? 'image/png' : 'image/jpeg', bytes });
  }
  return assets;
}
