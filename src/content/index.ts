import rawWorks from './works.json';
import type { Fanfic } from '../types/fanfic';

// JSON é a fonte única do catálogo. npm run check:catalog valida os dados.
// Novas obras são acrescentadas ao fim do JSON; a exibição começa pelas mais recentes.
export const works = [...rawWorks].reverse() as unknown as Fanfic[];
export const featuredWork = works.find(work => work.id === 'no-verde-dos-seus-olhos');
