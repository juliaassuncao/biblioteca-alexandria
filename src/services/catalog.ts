import { works } from '../content';
import type { Fanfic } from '../types/fanfic';

export const getWorkBySlug = (slug: string): Fanfic | undefined =>
  works.find((work) => work.slug === slug);

// URLs públicas do catálogo funcionam em produção sem configuração local.
// Variáveis legadas são apenas fallback para registros sem destino cadastrado.
export function getReadingUrl(work: Fanfic): string | null {
  if (work.reading.mode !== 'external') return null;
  const configured = work.id === 'bones'
    ? import.meta.env.VITE_BONES_URL
    : work.id === 'custode'
      ? import.meta.env.VITE_CUSTODE_URL
      : undefined;
  const candidate = (work.reading.externalUrl || configured || '').trim();
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    return ['https:', 'http:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}
