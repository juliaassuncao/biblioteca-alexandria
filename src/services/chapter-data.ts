import type { Chapter, ChapterContent, Fanfic } from '../types/fanfic.ts';
import { assertChapterContent, validateBlocks } from './chapter-content.ts';
import { applyChapterPresentation } from './chapter-presentation.ts';

export type ChapterLoader = () => Promise<unknown>;
export type ChapterLoaders = Record<string, ChapterLoader>;
export type ChapterResult =
  | { status: 'ready'; chapter: Chapter; content: ChapterContent }
  | { status: 'invalid-number' | 'not-found' | 'external' | 'unavailable' }
  | { status: 'error'; error: unknown };

export function parseChapterNumber(value: string | number | undefined): number | null {
  const text = String(value ?? '');
  if (!/^[1-9]\d*$/.test(text)) return null;
  const number = Number(text);
  return Number.isSafeInteger(number) ? number : null;
}

export const chapterHref = (work: Pick<Fanfic, 'slug'>, chapter: Pick<Chapter, 'number'>) =>
  `/obra/${encodeURIComponent(work.slug)}/capitulo/${chapter.number}`;

export function createChapterService(loaders: ChapterLoaders, presentations: ChapterLoaders = {}) {
  const key = (work: Fanfic, chapter: Chapter) => `../content/chapters/${work.id}/${chapter.id}.json`;
  const hasContent = (work: Fanfic, chapter: Chapter) =>
    work.reading.mode === 'internal' && typeof loaders[key(work, chapter)] === 'function';
  const availableChapters = (work: Fanfic) => work.chapters.filter(chapter => hasContent(work, chapter));

  return {
    hasContent,
    availableChapters,
    neighbors(work: Fanfic, number: number) {
      // Não pular capítulos indisponíveis nem apontar para os ainda não publicados.
      return {
        previous: work.chapters.find(chapter => chapter.number === number - 1 && hasContent(work, chapter)),
        next: work.chapters.find(chapter => chapter.number === number + 1 && hasContent(work, chapter)),
      };
    },
    async load(work: Fanfic, value: string | number | undefined): Promise<ChapterResult> {
      if (work.reading.mode === 'external') return { status: 'external' };
      const number = parseChapterNumber(value);
      if (number === null) return { status: 'invalid-number' };
      const chapter = work.chapters.find(item => item.number === number);
      if (!chapter) return { status: 'not-found' };
      const loader = loaders[key(work, chapter)];
      if (!loader) return { status: 'unavailable' };
      try {
        const content = await loader();
        assertChapterContent(content, chapter);
        const presentationLoader = presentations[`../content/presentation/${work.id}/${chapter.id}.json`];
        if (presentationLoader) {
          const blocks = applyChapterPresentation(chapter.id, content.blocks, await presentationLoader());
          const errors = validateBlocks(blocks);
          if (errors.length) throw new Error(errors.join('; '));
          return { status: 'ready', chapter, content: { ...content, blocks } };
        }
        return { status: 'ready', chapter, content };
      } catch (error) {
        return { status: 'error', error };
      }
    },
  };
}
