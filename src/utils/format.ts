export function formatNumber(value: number | null): string | null {
  return value === null ? null : new Intl.NumberFormat('pt-BR').format(value);
}

export function formatDate(value: string | null): string | null {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Intl.DateTimeFormat('pt-BR').format(new Date(year, month - 1, day, 12));
}
