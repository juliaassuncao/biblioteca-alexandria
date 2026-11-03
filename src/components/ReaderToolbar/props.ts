import type { Chapter, Fanfic } from '../../types/fanfic';
export interface ReaderToolbarProps {
  work: Fanfic;
  chapter?: Chapter;
  indexOpen: boolean;
  settingsOpen: boolean;
  onIndex: () => void;
  onSettings: () => void;
}
