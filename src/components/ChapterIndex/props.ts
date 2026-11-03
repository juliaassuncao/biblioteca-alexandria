import type { Fanfic } from '../../types/fanfic';

export interface ChapterIndexProps { work: Fanfic; currentNumber?: number; onSelect?: () => void; editorial?: boolean; }
