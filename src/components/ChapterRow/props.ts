import type { Chapter, Fanfic } from '../../types/fanfic';
export interface ChapterRowProps { work: Fanfic; chapter: Chapter; available: boolean; read: boolean; current?: boolean; onSelect?: () => void; editorial?: boolean; }
