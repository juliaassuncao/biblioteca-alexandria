import { useEffect, useState } from 'react';
import type { Fanfic } from '../types/fanfic';
import { loadChapter } from '../services/chapters';
import type { ChapterResult } from '../services/chapter-data';

export function useChapter(work: Fanfic, number: string | undefined) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<ChapterResult | { status: 'loading' }>({ status: 'loading' });
  useEffect(() => {
    let active = true;
    loadChapter(work, number).then(next => { if (active) setResult(next); });
    return () => { active = false; };
  }, [work, number, attempt]);
  return {
    result,
    retry: () => { setResult({ status: 'loading' }); setAttempt(current => current + 1); },
  };
}
