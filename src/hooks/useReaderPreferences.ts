import { useEffect, useState } from 'react';
import {
  DEFAULT_READER_PREFERENCES, normalizeReaderPreferences, readReaderPreferences, saveReaderPreferences,
  type ReaderPreferences,
} from '../services/reader-preferences';

export function useReaderPreferences() {
  const [preferences, setPreferences] = useState<ReaderPreferences>(() => {
    try { return readReaderPreferences(window.localStorage); }
    catch { return { ...DEFAULT_READER_PREFERENCES }; }
  });

  useEffect(() => {
    try { saveReaderPreferences(window.localStorage, preferences); }
    catch { /* Leitura continua disponível quando o armazenamento é bloqueado. */ }
  }, [preferences]);

  const updatePreferences = (patch: Partial<ReaderPreferences>) => {
    setPreferences(current => normalizeReaderPreferences({ ...current, ...patch }));
  };
  return { preferences, updatePreferences };
}
