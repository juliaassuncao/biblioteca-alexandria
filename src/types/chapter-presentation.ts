import type { DocumentKind } from './fanfic';
export interface PresentationGroup {
  type: 'chat' | 'tweet' | 'email' | 'document' | 'notice' | 'excerpt';
  start: string;
  end: string;
  kind?: DocumentKind | 'notice' | 'notification' | 'alert';
  senderIds?: string[];
  inlineSenders?: string[];
  rightSenders?: string[];
  leadingNarrativeLength?: number;
  signatureIds?: string[];
}
export interface ChapterPresentation { chapterId: string; groups: PresentationGroup[]; }
