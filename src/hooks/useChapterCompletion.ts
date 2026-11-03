import { useSyncExternalStore } from 'react';
import { readCompletion, saveCompletion, toggleCompletion, type CompletedChapter } from '../services/reader-completion';

const listeners = new Set<() => void>();
const empty: CompletedChapter[] = [];
let entries = empty;
let initialized = false;
let persisted = true;

function snapshot() {
  if (!initialized && typeof window !== 'undefined') {
    initialized = true;
    try { entries = readCompletion(window.localStorage); }
    catch { persisted = false; }
  }
  return entries;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function useChapterCompletion(workId: string) {
  const current = useSyncExternalStore(subscribe, snapshot, () => empty);
  return {
    isRead: (chapterId: string) => current.some(entry => entry.workId === workId && entry.chapterId === chapterId),
    persisted,
    toggle: (chapterId: string) => {
      entries = toggleCompletion(snapshot(), workId, chapterId);
      try { persisted = saveCompletion(window.localStorage, entries); }
      catch { persisted = false; }
      listeners.forEach(listener => listener());
    },
  };
}
