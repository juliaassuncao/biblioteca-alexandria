import type { ChapterBlock } from '../../types/fanfic';
export type ChapterBodyContext = 'narrative' | 'note' | 'message' | 'document' | 'quote';
export interface ChapterBodyProps { blocks: ChapterBlock[]; context?: ChapterBodyContext; signatureIds?: string[]; }
