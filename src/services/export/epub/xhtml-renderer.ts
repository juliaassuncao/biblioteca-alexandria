import { signatureParts } from '../../document-signatures.ts';
import type { FormattedText, InlineSegment } from '../../../types/fanfic.ts';
import type { ExportAsset, ExportBook, ExportChapter, ExportNode } from '../export-types.ts';

export function xml(text: string): string {
  if (/[^\u0009\u000a\u000d\u0020-\ud7ff\ue000-\ufffd\u{10000}-\u{10ffff}]/u.test(text)) throw new Error('Texto contém caracteres incompatíveis com XML.');
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
export const chapterPath = (chapter: ExportChapter) => `chapters/${chapter.chapter.id}.xhtml`;
export const exportTitle = (book: ExportBook) => book.scope === 'work' ? book.work.title : `${book.work.title} — Capítulo ${book.chapters[0]!.chapter.number}: ${book.chapters[0]!.chapter.title}`;
export const exportAuthor = (book: ExportBook) => book.work.author.displayName ?? book.work.author.ao3Name;
export function xhtml(title: string, language: string, body: string, nested = false) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${xml(language)}" lang="${xml(language)}"><head><title>${xml(title)}</title><meta charset="UTF-8"/><link rel="stylesheet" type="text/css" href="${nested ? '../' : ''}styles/reader.css"/></head><body>${body}</body></html>`;
}

function localLink(href: string, book: ExportBook) {
  const url = new URL(href, 'https://alexandria.invalid');
  const match = book.chapters.find(item => url.pathname === `/obra/${book.work.slug}/capitulo/${item.chapter.number}`);
  if (match) return `${match.chapter.id}.xhtml${url.hash}`;
  return href;
}

export function renderNodes(nodes: ExportNode[], book: ExportBook, assets: ExportAsset[]): string {
  const assetsBySource = new Map(assets.map(asset => [asset.src, asset]));
  const inline = (segments: InlineSegment[]): string => segments.map(segment => {
    switch (segment.type) {
      case 'text': return xml(segment.text);
      case 'strong': return `<strong>${inline(segment.children)}</strong>`;
      case 'emphasis': return `<em>${inline(segment.children)}</em>`;
      case 'link': return `<a href="${xml(localLink(segment.href, book))}">${inline(segment.children)}</a>`;
      default: throw new Error('Segmento sem suporte no EPUB.');
    }
  }).join('');
  const value = (text: FormattedText) => text.segments ? inline(text.segments) : xml(text.text);
  const render = (items: ExportNode[]): string => items.map(node => {
    const id = `id="${xml(node.id)}"`;
    switch (node.kind) {
      case 'divider': return `<div ${id} class="divider" role="separator" aria-label="Mudança de cena">* * *</div>`;
      case 'text': {
        if (node.role === 'signature') {
          const { name, rest } = signatureParts(node.value);
          return `<p ${id} class="signature"><span>${xml(name)}</span>${value(rest)}</p>`;
        }
        const style = node.value.alignment ? ` style="text-align:${node.value.alignment}"` : '';
        const tag = node.role === 'heading' ? `h${node.level ?? 2}` : 'p';
        return `<${tag} ${id}${style}>${value(node.value)}</${tag}>${node.attribution ? `<p id="${xml(node.id)}-attribution">${xml(node.attribution)}</p>` : ''}`;
      }
      case 'link': return `<p ${id}><a href="${xml(localLink(node.href, book))}">${xml(node.label)}</a></p>`;
      case 'image': {
        const asset = assetsBySource.get(node.src);
        if (!asset) throw new Error(`Imagem não incorporada: ${node.src}`);
        return `<figure ${id}${node.alignment ? ` style="text-align:${node.alignment}"` : ''}><img src="../${xml(asset.path)}" alt="${xml(node.alt)}"/>${node.caption ? `<figcaption>${xml(node.caption)}</figcaption>` : ''}</figure>`;
      }
      case 'section': return `<div ${id}>${node.title ? `<p><strong>${xml(node.title)}</strong></p>` : ''}${render(node.children)}</div>`;
      default: throw new Error('Bloco sem suporte no EPUB.');
    }
  }).join('\n');
  return render(nodes);
}

export function renderChapter(chapter: ExportChapter, book: ExportBook, assets: ExportAsset[]) {
  const notes = (nodes: ExportNode[], label: string) => nodes.length ? `<section class="notes"><h2>${label}</h2>${renderNodes(nodes, book, assets)}</section>` : '';
  return xhtml(chapter.chapter.title, book.work.language,
    `<header><p>${xml(book.work.title)}</p>${exportAuthor(book) ? `<p>${xml(exportAuthor(book)!)}</p>` : ''}<p>Capítulo ${chapter.chapter.number}</p><h1>${xml(chapter.chapter.title)}</h1></header>` +
    (chapter.warnings.length ? `<section class="warnings"><h2>Avisos de conteúdo</h2>${chapter.warnings.map(warning => `<p>${xml(warning)}</p>`).join('')}</section>` : '') +
    notes(chapter.before, 'Notas da autora — antes') + `<section class="narrative">${renderNodes(chapter.body, book, assets)}</section>` + notes(chapter.after, 'Notas da autora — depois'), true);
}

export function renderCover(book: ExportBook) {
  const work = book.work;
  return xhtml(exportTitle(book), work.language, `<section class="cover" epub:type="cover"><p>Biblioteca de Alexandria</p><h1>${xml(work.title)}</h1>${exportAuthor(book) ? `<p>${xml(exportAuthor(book)!)}</p>` : ''}<p class="credit">Edição para leitura · capa tipográfica editorial</p></section>` +
    `<section><h2>Sinopse</h2><p>${xml(work.synopsis)}</p>` +
    (work.classification ? `<h2>Classificação</h2><p>${xml(work.classification.rating)}</p><p>${xml(work.classification.archiveWarning ?? '')}</p>` : '') +
    `<p>${xml(work.category)}</p><h2>Avisos de conteúdo</h2>${work.contentAdvisories.map(item => `<p>${xml(item)}</p>`).join('')}` +
    (work.tags.length ? `<h2>Tags</h2><p>${xml(work.tags.join(' · '))}</p>` : '') +
    (work.links.original ? `<p><a href="${xml(work.links.original)}">Publicação original</a></p>` : '') + '</section>');
}
