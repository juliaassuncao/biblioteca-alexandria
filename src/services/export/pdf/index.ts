import { createElement as h, type ReactNode } from 'react';
import { Buffer as BrowserBuffer } from 'buffer';
import { Document, Font, Image, Link, Page, Text, View, pdf } from '@react-pdf/renderer';
import type { InlineSegment } from '../../../types/fanfic.ts';
import type { ExportAsset, ExportBook, ExportNode } from '../export-types.ts';
import { visitNodes } from '../export-content.ts';
import { exportAuthor, exportTitle } from '../epub/xhtml-renderer.ts';
import { pdfStyles as s } from './styles.ts';

// png-js, usado pelo renderer, acessa Buffer global ao decodificar PNG no worker.
(globalThis as { Buffer?: unknown }).Buffer ??= BrowserBuffer;

async function loadFonts(base: string) {
  // Fontes novas por documento: caches de glifos não podem contaminar exportações seguintes.
  Font.clear();
  // O layout da biblioteca consulta Helvetica como fallback padrão, mesmo usando fontes locais.
  Font.register({ family: 'Helvetica', fonts: [
    { src: 'Helvetica', fontWeight: 400, fontStyle: 'normal' },
    { src: 'Helvetica-Bold', fontWeight: 700, fontStyle: 'normal' },
    { src: 'Helvetica-Oblique', fontWeight: 400, fontStyle: 'italic' },
    { src: 'Helvetica-BoldOblique', fontWeight: 700, fontStyle: 'italic' },
  ] });
  const variants = [
    { suffix: 'Regular', fontWeight: 400, fontStyle: 'normal' as const },
    { suffix: 'Bold', fontWeight: 700, fontStyle: 'normal' as const },
    { suffix: 'Italic', fontWeight: 400, fontStyle: 'italic' as const },
    { suffix: 'BoldItalic', fontWeight: 700, fontStyle: 'italic' as const },
  ];
  Font.register({ family: 'AlexandriaExport', fonts: variants.map(({ suffix, ...style }) => ({ src: `${base}/NotoSerif-${suffix}.ttf`, ...style })) });
  Font.register({ family: 'AlexandriaSymbols', fonts: variants.map(({ suffix: _suffix, ...style }) => ({ src: `${base}/NotoEmoji.ttf`, ...style })) });
  Font.registerHyphenationCallback(word => [word]);
  await Promise.all(['Helvetica', 'AlexandriaExport', 'AlexandriaSymbols'].flatMap(fontFamily =>
    [400, 700].flatMap(fontWeight => ['normal', 'italic'].map(fontStyle => Font.load({ fontFamily, fontWeight, fontStyle: fontStyle as 'normal' | 'italic' })))));
}

function checkGlyphs(book: ExportBook) {
  const texts = [book.work.title, book.work.synopsis, book.work.category, exportAuthor(book) ?? '', ...book.work.tags, ...book.work.contentAdvisories,
    book.work.classification?.rating ?? '', book.work.classification?.archiveWarning ?? ''];
  book.chapters.forEach(item => texts.push(item.chapter.title, ...item.warnings));
  visitNodes(book, node => {
    if (node.kind === 'text') texts.push(node.value.text, node.attribution ?? '');
    if (node.kind === 'section') texts.push(node.title ?? '');
    if (node.kind === 'link') texts.push(node.label);
    if (node.kind === 'image') texts.push(node.alt, node.caption ?? '');
  });
  const fonts = ['AlexandriaExport', 'AlexandriaSymbols'].map(fontFamily => Font.getFont({ fontFamily }).data!);
  const unsupported = [...new Set(texts.join(''))].filter(char => !/[\r\n\t]/.test(char) && !fonts.some(font => font.hasGlyphForCodePoint(char.codePointAt(0)!)));
  if (unsupported.length) throw new Error(`PDF interrompido: fontes sem suporte para os caracteres ${unsupported.join(' ')}. O conteúdo não foi omitido.`);
}

function inline(segments: InlineSegment[]): ReactNode[] {
  return segments.map((segment, key) => {
    switch (segment.type) {
      case 'text': return segment.text;
      case 'strong': return h(Text, { key, style: { fontWeight: 700 } }, inline(segment.children));
      case 'emphasis': return h(Text, { key, style: { fontStyle: 'italic' } }, inline(segment.children));
      case 'link': return h(Link, { key, src: segment.href, style: s.link }, inline(segment.children));
      default: throw new Error('Segmento sem suporte no PDF.');
    }
  });
}
function imageSource(asset: ExportAsset) {
  let binary = '';
  for (let offset = 0; offset < asset.bytes.length; offset += 8192) binary += String.fromCharCode(...asset.bytes.subarray(offset, offset + 8192));
  return `data:${asset.mediaType};base64,${btoa(binary)}`;
}

function renderNodes(nodes: ExportNode[], assets: ExportAsset[], narrative = false, indent = 0): ReactNode[] {
  return nodes.flatMap(node => {
    switch (node.kind) {
      case 'divider': return h(Text, { key: node.id, style: s.divider }, '* * *');
      case 'link': return h(Text, { key: node.id, style: s.paragraph }, h(Link, { src: node.href, style: s.link }, node.label));
      case 'text': {
        const content = h(Text, { key: node.id, hyphenationPenalty: 10000, style: [s.paragraph,
          ...(node.role === 'heading' ? [{ ...s.subtitle, fontSize: node.level === 3 ? 12 : 14 }] : []),
          ...(node.role === 'quote' || node.role === 'aside' ? [s.box] : []),
          { marginLeft: indent },
          { textAlign: node.value.alignment ?? (narrative && node.role === 'paragraph' ? 'justify' : 'left') }],
        }, node.value.segments ? inline(node.value.segments) : node.value.text);
        return [content, ...(node.attribution ? [h(Text, { key: `${node.id}-attribution`, style: s.small }, node.attribution)] : [])];
      }
      case 'image': {
        const asset = assets.find(asset => asset.src === node.src);
        if (!asset) throw new Error(`Imagem não incorporada: ${node.src}`);
        return h(View, { key: node.id, wrap: false },
          h(Image, { src: imageSource(asset), style: [s.image, { alignSelf: node.alignment === 'left' ? 'flex-start' : node.alignment === 'right' ? 'flex-end' : 'center' }] }),
          h(Text, { style: s.small }, node.caption ?? node.alt));
      }
      case 'section': {
        // Fragmentos editoriais independentes evitam caixas enormes atravessando páginas.
        return [
          ...(node.title ? [h(Text, { key: `${node.id}-title`, style: s.subtitle, minPresenceAhead: 24 }, node.title)] : []),
          ...renderNodes(node.children, assets, false, indent + (node.role === 'message' && node.side === 'right' ? 28 : 10)),
        ];
      }
      default: throw new Error('Bloco sem suporte no PDF.');
    }
  });
}

export async function generatePdf(book: ExportBook, assets: ExportAsset[], base = '/fonts/export'): Promise<Blob> {
  await loadFonts(base);
  checkGlyphs(book);
  const footer = () => h(Text, { style: s.footer, fixed: true, render: ({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}` });
  const pages: ReactNode[] = [];
  if (book.scope === 'work') {
    pages.push(h(Page, { key: 'cover', size: 'A5', style: s.page },
      h(Text, { style: s.small }, 'BIBLIOTECA DE ALEXANDRIA'),
      h(Text, { style: [s.title, { marginTop: 60, fontSize: 30 }] }, book.work.title),
      exportAuthor(book) ? h(Text, {}, exportAuthor(book)) : null,
      h(Text, { style: [s.small, { marginTop: 30 }] }, 'Edição para leitura · capa tipográfica editorial'), footer()));
    pages.push(h(Page, { key: 'metadata', size: 'A5', style: s.page },
      h(Text, { style: s.subtitle }, 'Sinopse'), h(Text, { style: s.paragraph }, book.work.synopsis),
      book.work.classification ? h(View, {}, h(Text, { style: s.subtitle }, 'Classificação'), h(Text, {}, book.work.classification.rating), h(Text, {}, book.work.classification.archiveWarning)) : null,
      h(Text, {}, book.work.category), h(Text, { style: s.subtitle }, 'Avisos de conteúdo'),
      ...book.work.contentAdvisories.map((item, key) => h(Text, { key, style: s.paragraph }, item)),
      book.work.tags.length ? h(View, {}, h(Text, { style: s.subtitle }, 'Tags'), h(Text, {}, book.work.tags.join(' · '))) : null,
      book.work.links.original ? h(Link, { src: book.work.links.original, style: s.link }, 'Publicação original') : null, footer()));
    pages.push(h(Page, { key: 'toc', size: 'A5', style: s.page }, h(Text, { style: s.title }, 'Sumário'),
      ...book.chapters.map(({ chapter }) => h(Text, { key: chapter.id, style: s.paragraph }, h(Link, { src: `#${chapter.id}`, style: s.link }, `${chapter.number}. ${chapter.title}`))), footer()));
  }
  for (const item of book.chapters) {
    const notes = (nodes: ExportNode[], label: string) => nodes.length ? [h(Text, { key: label, style: [s.subtitle, s.notes], minPresenceAhead: 24 }, label), ...renderNodes(nodes, assets)] : null;
    pages.push(h(Page, { key: item.chapter.id, id: item.chapter.id, bookmark: `${item.chapter.number}. ${item.chapter.title}`, size: 'A5', style: s.page },
      h(Text, { style: s.small }, book.work.title), exportAuthor(book) ? h(Text, { style: s.small }, exportAuthor(book)) : null,
      h(Text, { style: s.small }, `Capítulo ${item.chapter.number}`), h(Text, { style: s.title, minPresenceAhead: 32 }, item.chapter.title),
      ...item.warnings.map((warning, key) => h(Text, { key, style: s.small }, warning)),
      notes(item.before, 'Notas da autora — antes'), renderNodes(item.body, assets, true), notes(item.after, 'Notas da autora — depois'), footer()));
  }
  const instance = pdf(h(Document, { title: exportTitle(book), author: exportAuthor(book) ?? undefined, language: book.work.language,
    subject: book.work.synopsis, creator: 'Biblioteca de Alexandria', pageMode: 'useOutlines' }, pages));
  return instance.toBlob();
}
