import type { DocumentKind } from './fanfic';
export interface PresentationGroup {
  type: 'chat' | 'email' | 'document' | 'notice' | 'excerpt';
  start: string;
  end: string;
  kind?: DocumentKind | 'notice' | 'notification' | 'alert';
  senderIds?: string[];
}
export interface ChapterPresentation { chapterId: string; groups: PresentationGroup[]; }
