// Modelo universal de fanfic. "mode" controla a experiência de leitura.
export type WorkStatus = 'ongoing' | 'completed' | 'unknown';
export type CoverTone = 'wine' | 'ink' | 'sage';

export type InlineSegment =
  | { type: 'text'; text: string }
  | { type: 'emphasis' | 'strong'; children: InlineSegment[] }
  | { type: 'link'; href: string; children: InlineSegment[] };

export interface FormattedText {
  text: string;
  segments?: InlineSegment[];
  alignment?: 'left' | 'center' | 'right' | 'justify';
}

export interface ChatMessage extends FormattedText {
  id: string;
  sender: string;
  time?: string;
}

export type TextBlock =
  | ({ id: string; type: 'paragraph' } & FormattedText)
  | ({ id: string; type: 'heading'; level: 2 | 3 } & FormattedText);

export interface ChatParticipant {
  id: string;
  name?: string | null;
  avatar?: { src: string; alt: string } | null;
}

export type ChatEntry =
  | { id: string; kind: 'message'; side: 'left' | 'right'; participantId?: string; sender?: TextBlock; time?: string; body: ChapterBlock[] }
  | { id: string; kind: 'date' | 'system'; content: FormattedText };

export interface ChatBlockData {
  id: string;
  type: 'chat';
  chatId: string;
  title?: string;
  participants?: ChatParticipant[];
  entries?: ChatEntry[];
  messages?: ChatMessage[];
}

export interface EmailBlockData {
  id: string;
  type: 'email';
  from?: string | null;
  to?: string | null;
  subject?: string | null;
  date?: string | null;
  body: ChapterBlock[];
  signature?: ChapterBlock[];
  attachments?: { label: string; href: string }[];
}

export type DocumentKind = 'document' | 'letter' | 'syllabus' | 'report' | 'article' | 'form' | 'contract' | 'draft';
export interface DocumentBlockData { id: string; type: 'document'; kind: DocumentKind; title?: string; body: ChapterBlock[]; }
export interface NoticeBlockData { id: string; type: 'notice'; kind: 'notice' | 'notification' | 'alert'; title?: string; body: ChapterBlock[]; }
export interface ExcerptBlockData { id: string; type: 'excerpt'; attribution?: string; body: ChapterBlock[]; }

export type ChapterBlock =
  | TextBlock
  | { id: string; type: 'divider'; text?: string; segments?: InlineSegment[] }
  | ({ id: string; type: 'quote'; attribution?: string } & FormattedText)
  | ({ id: string; type: 'aside' } & FormattedText)
  | { id: string; type: 'image'; src: string; alt: string; caption?: string; alignment?: 'left' | 'center' | 'right' }
  | { id: string; type: 'external-link'; href: string; label: string }
  | ChatBlockData | EmailBlockData | DocumentBlockData | NoticeBlockData | ExcerptBlockData;

// O título, a numeração e os avisos já cadastrados pertencem ao catálogo.
export interface ChapterContent {
  id: string;
  blocks: ChapterBlock[];
  notes: { before: ChapterBlock[]; after: ChapterBlock[] };
  contentWarnings?: string[];
}

export interface ChapterNotes {
  hasBefore: boolean;
  hasAfter: boolean;
  before: ChapterBlock[];
  after: ChapterBlock[];
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  notes: ChapterNotes;
  contentWarnings: string[];
  blocks: ChapterBlock[];
}

export interface Author {
  displayName: string | null;
  ao3Name: string | null;
  authorLink?: string | undefined;
}

export interface Stats {
  words: number | null;
  publishedChapters: number | null;
  plannedChapters: number | null;
  publishedAt: string | null;
  updatedAt: string | null;
}

export interface Fanfic {
  id: string;
  slug: string;
  title: string;
  author: Author;
  ao3Authors?: string[];
  relationships?: string[];
  characters?: string[];
  workNotes?: ChapterBlock[];
  synopsis: string;
  status: WorkStatus;
  language: string;
  fandom: string;
  category: string;
  classification: { rating: string; archiveWarning: string } | null;
  tags: string[];
  contentAdvisories: string[];
  stats: Stats;
  cover: { variant: 'typographic'; tone: CoverTone; ornament: 'feather' | 'fingerprint' | 'clover' | 'paintbrush'; caption: string };
  reading: { mode: 'internal' | 'external'; externalUrl: string | null };
  // Internas enviadas pelas autoras: habilitado por padrão; false desativa explicitamente.
  downloads?: { enabled: boolean };
  links: { original: string | null };
  editorial: {
    submittedByAuthor: boolean;
    contentReady: boolean;
    sourceFile: string | null;
    sourceUpdatedAt: string | null;
    coverOfficial: boolean;
  };
  chapters: Chapter[];
}
