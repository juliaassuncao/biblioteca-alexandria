export const READER_STORAGE_KEY = 'alexandria.reader.preferences.v1';
export const FONT_SIZE = { min: 16, max: 30, step: 2, default: 20 } as const;
export const LINE_HEIGHTS = { compact: 1.55, comfortable: 1.85, spacious: 2.15 } as const;
export const READING_WIDTHS = { narrow: '34rem', standard: '42rem', wide: '50rem' } as const;
export const READER_FONTS = { serif: "Georgia, 'Times New Roman', serif", sans: "'DM Sans', system-ui, sans-serif" } as const;

export interface ReaderPreferences {
  font: keyof typeof READER_FONTS;
  fontSize: number;
  lineHeight: keyof typeof LINE_HEIGHTS;
  theme: 'light' | 'sepia' | 'dark';
  width: keyof typeof READING_WIDTHS;
}

export const DEFAULT_READER_PREFERENCES: ReaderPreferences = {
  font: 'serif', fontSize: FONT_SIZE.default, lineHeight: 'comfortable', theme: 'light', width: 'standard',
};

export function normalizeReaderPreferences(value: unknown): ReaderPreferences {
  const defaults = { ...DEFAULT_READER_PREFERENCES };
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return defaults;
  const candidate = value as Record<string, unknown>;
  if (candidate.font === 'serif' || candidate.font === 'sans') defaults.font = candidate.font;
  if (typeof candidate.fontSize === 'number' && Number.isFinite(candidate.fontSize)) {
    defaults.fontSize = Math.min(FONT_SIZE.max, Math.max(FONT_SIZE.min, Math.round(candidate.fontSize)));
  }
  if (candidate.lineHeight === 'compact' || candidate.lineHeight === 'comfortable' || candidate.lineHeight === 'spacious') defaults.lineHeight = candidate.lineHeight;
  if (candidate.theme === 'light' || candidate.theme === 'sepia' || candidate.theme === 'dark') defaults.theme = candidate.theme;
  if (candidate.width === 'narrow' || candidate.width === 'standard' || candidate.width === 'wide') defaults.width = candidate.width;
  return defaults;
}

export function readReaderPreferences(storage: Pick<Storage, 'getItem'>): ReaderPreferences {
  try { return normalizeReaderPreferences(JSON.parse(storage.getItem(READER_STORAGE_KEY) ?? 'null')); }
  catch { return { ...DEFAULT_READER_PREFERENCES }; }
}

export function saveReaderPreferences(storage: Pick<Storage, 'setItem'>, value: ReaderPreferences): boolean {
  try { storage.setItem(READER_STORAGE_KEY, JSON.stringify(normalizeReaderPreferences(value))); return true; }
  catch { return false; }
}
