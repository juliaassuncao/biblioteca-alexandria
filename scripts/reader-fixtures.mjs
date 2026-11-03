// Dados sintéticos exclusivos dos testes. Nunca importados pelo aplicativo.
export function makeChapter(number = 1) {
  return {
    id: `cap-${String(number).padStart(2, '0')}`, number, title: `Capítulo de teste ${number}`,
    notes: { hasBefore: false, hasAfter: false, before: [], after: [] }, contentWarnings: [], blocks: [],
  };
}

export function makeWork() {
  return {
    id: 'obra-teste', slug: 'obra-teste', reading: { mode: 'internal', externalUrl: null },
    chapters: [makeChapter(1), makeChapter(2), makeChapter(3)],
  };
}

export function makeContent(chapter = makeChapter()) {
  return { id: chapter.id, blocks: [{ id: 'p-1', type: 'paragraph', text: 'Texto de teste — “pontuação”.' }], notes: { before: [], after: [] } };
}

export const loaderKey = (work, chapter) => `../content/chapters/${work.id}/${chapter.id}.json`;
