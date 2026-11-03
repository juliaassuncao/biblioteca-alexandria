export const COMPLETION_STORAGE_KEY = 'alexandria.reader.completed.v1';
export interface CompletedChapter { workId: string; chapterId: string; }

export function normalizeCompletion(value: unknown): CompletedChapter[] {
  if (!Array.isArray(value)) return [];
  const unique = new Map<string, CompletedChapter>();
  for (const item of value.slice(0, 10000)) {
    if (!item || typeof item !== 'object') continue;
    const { workId, chapterId } = item;
    if (typeof workId !== 'string' || typeof chapterId !== 'string' || !/^[a-z0-9-]+$/.test(workId) || !/^[a-z0-9-]+$/.test(chapterId)) continue;
    unique.set(JSON.stringify([workId, chapterId]), { workId, chapterId });
  }
  return [...unique.values()];
}

export function readCompletion(storage: Pick<Storage, 'getItem'>): CompletedChapter[] {
  try { return normalizeCompletion(JSON.parse(storage.getItem(COMPLETION_STORAGE_KEY) ?? 'null')); }
  catch { return []; }
}

export function toggleCompletion(entries: CompletedChapter[], workId: string, chapterId: string): CompletedChapter[] {
  const exists = entries.some(entry => entry.workId === workId && entry.chapterId === chapterId);
  return exists ? entries.filter(entry => entry.workId !== workId || entry.chapterId !== chapterId)
    : normalizeCompletion([...entries, { workId, chapterId }]);
}

export function saveCompletion(storage: Pick<Storage, 'setItem'>, entries: CompletedChapter[]): boolean {
  try { storage.setItem(COMPLETION_STORAGE_KEY, JSON.stringify(normalizeCompletion(entries))); return true; }
  catch { return false; }
}
