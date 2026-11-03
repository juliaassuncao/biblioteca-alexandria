import JSZip from 'jszip';
import type { ExportAsset, ExportBook } from '../export-types.ts';
import { chapterPath, exportAuthor, exportTitle, renderChapter, renderCover, xhtml, xml } from './xhtml-renderer.ts';
import { epubStyles } from './styles.ts';

export async function generateEpub(book: ExportBook, assets: ExportAsset[]): Promise<Blob> {
  const zip = new JSZip();
  const put = (name: string, data: string | Uint8Array) => zip.file(name, data, { createFolders: false });
  // EPUB exige a primeira entrada sem compressão e sem campos extras.
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE', createFolders: false });
  put('META-INF/container.xml', `<?xml version="1.0" encoding="UTF-8"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="EPUB/package.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`);
  const author = exportAuthor(book);
  const identifier = `urn:alexandria:${book.work.id}${book.scope === 'chapter' ? `:chapter:${book.chapters[0]!.chapter.id}` : ''}`;
  const modified = `${book.work.stats.updatedAt ?? new Date().toISOString().slice(0, 10)}T00:00:00Z`;
  const cover = book.scope === 'work';
  const items = book.chapters.map((chapter, i) => `<item id="chapter-${i}" href="${xml(chapterPath(chapter))}" media-type="application/xhtml+xml"/>`).join('');
  const spine = book.chapters.map((_, i) => `<itemref idref="chapter-${i}"/>`).join('');
  put('EPUB/package.opf', `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id" xml:lang="${xml(book.work.language)}"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="book-id">${identifier}</dc:identifier><dc:title>${xml(exportTitle(book))}</dc:title>${author ? `<dc:creator>${xml(author)}</dc:creator>` : ''}<dc:language>${xml(book.work.language)}</dc:language><dc:description>${xml(book.work.synopsis)}</dc:description>${book.work.stats.publishedAt ? `<dc:date>${xml(book.work.stats.publishedAt)}</dc:date>` : ''}<meta property="dcterms:modified">${modified}</meta></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="css" href="styles/reader.css" media-type="text/css"/>${cover ? '<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>' : ''}${items}${assets.map((asset, i) => `<item id="image-${i}" href="${xml(asset.path)}" media-type="${asset.mediaType}"/>`).join('')}</manifest><spine>${cover ? '<itemref idref="cover"/>' : ''}<itemref idref="nav"/>${spine}</spine></package>`);
  put('EPUB/nav.xhtml', xhtml('Sumário', book.work.language, `<nav epub:type="toc" id="toc"><h1>Sumário</h1><ol>${book.chapters.map(chapter => `<li><a href="${xml(chapterPath(chapter))}">${chapter.chapter.number}. ${xml(chapter.chapter.title)}</a></li>`).join('')}</ol></nav>`));
  put('EPUB/styles/reader.css', epubStyles);
  if (cover) put('EPUB/cover.xhtml', renderCover(book));
  for (const chapter of book.chapters) put(`EPUB/${chapterPath(chapter)}`, renderChapter(chapter, book, assets));
  for (const asset of assets) put(`EPUB/${asset.path}`, asset.bytes);
  const data = await zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  return new Blob([data], { type: 'application/epub+zip' });
}
