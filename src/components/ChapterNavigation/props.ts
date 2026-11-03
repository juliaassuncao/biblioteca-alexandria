import type { Chapter, Fanfic } from '../../types/fanfic';

export interface ChapterNavigationProps {
  work: Fanfic;
  previous?: Chapter;
  next?: Chapter;
  onIndex: () => void;
  indexOpen?: boolean;
}
