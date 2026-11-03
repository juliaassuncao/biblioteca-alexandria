import { useMemo, useState } from 'react';
import type { Fanfic } from '../types/fanfic';

export type CatalogFilter = 'all' | 'internal' | 'external';

export function useCatalogFilter(works: Fanfic[]) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CatalogFilter>('all');

  const filtered = useMemo(() => {
    const text = query.trim().toLocaleLowerCase('pt-BR');
    return works.filter((work) => {
      const matchesMode = filter === 'all' || work.reading.mode === filter;
      const haystack = [work.title, work.author.displayName, work.author.ao3Name,
        work.synopsis, ...work.tags].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR');
      return matchesMode && haystack.includes(text);
    });
  }, [filter, query, works]);

  return { query, setQuery, filter, setFilter, filtered };
}
