import { createChapterService } from './chapter-data';

// O glob enumera caminhos; os textos só são importados ao abrir um capítulo.
const loaders = import.meta.glob('../content/chapters/*/*.json', { import: 'default' });
const presentations = import.meta.glob('../content/presentation/*/*.json', { import: 'default' });
const service = createChapterService(loaders, presentations);

export const hasChapterContent = service.hasContent;
export const getAvailableChapters = service.availableChapters;
export const getChapterNeighbors = service.neighbors;
export const loadChapter = service.load;
export { chapterHref, parseChapterNumber } from './chapter-data';
