import { works } from '../content';
import type { Fanfic } from '../types/fanfic';

export const getWorkBySlug = (slug: string): Fanfic | undefined =>
  works.find((work) => work.slug === slug);

// O link de site próprio pode ser preenchido em .env.local sem editar o JSON.
// Ao habilitar as URLs reais, o card redireciona diretamente para esses sites.
export function getReadingUrl(work: Fanfic): string | null {
  if (work.reading.mode !== 'external') return null;
  const configured = work.id === 'bones'
    ? import.meta.env.VITE_BONES_URL
    : work.id === 'custode'
      ? import.meta.env.VITE_CUSTODE_URL
      : undefined;
  const candidate = (configured || work.reading.externalUrl || '').trim();
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    return ['https:', 'http:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}
