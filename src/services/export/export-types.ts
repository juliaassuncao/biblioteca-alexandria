import type { Chapter, ChapterContent, Fanfic, FormattedText } from '../../types/fanfic.ts';
import type { ChapterResult } from '../chapter-data.ts';

export type ExportFormat = 'pdf' | 'epub';
export type ExportNode =
  | { id: string; kind: 'text'; role: 'paragraph' | 'heading' | 'quote' | 'aside' | 'signature'; level?: 2 | 3; value: FormattedText; attribution?: string }
  | { id: string; kind: 'divider' }
  | { id: string; kind: 'image'; src: string; alt: string; caption?: string; alignment?: 'left' | 'center' | 'right' }
  | { id: string; kind: 'link'; href: string; label: string }
  | { id: string; kind: 'section'; role: 'chat' | 'message' | 'email' | 'document' | 'notice' | 'excerpt' | 'date' | 'system'; title?: string; side?: 'left' | 'right'; children: ExportNode[] };
export interface ExportChapter { chapter: Chapter; warnings: string[]; before: ExportNode[]; body: ExportNode[]; after: ExportNode[]; }
export interface ExportBook { work: Fanfic; scope: 'work' | 'chapter'; chapters: ExportChapter[]; }
export type ExportLoader = (work: Fanfic, number: number) => Promise<ChapterResult>;
export interface ExportRequest { work: Fanfic; chapter?: Chapter; content?: ChapterContent; }
export interface ExportAsset { src: string; path: string; mediaType: 'image/png' | 'image/jpeg' | 'font/ttf' | 'text/plain'; bytes: Uint8Array; }
export type AssetLoader = (src: string) => Promise<Uint8Array>;
