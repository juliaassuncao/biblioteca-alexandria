import type { ReaderPreferences } from '../../services/reader-preferences';

export interface ReaderSettingsProps {
  value: ReaderPreferences;
  onChange: (patch: Partial<ReaderPreferences>) => void;
}
