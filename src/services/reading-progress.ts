export function readingProgress(scrollY: number, viewportHeight: number, top: number, height: number): number {
  if (![scrollY, viewportHeight, top, height].every(Number.isFinite) || height <= 0 || viewportHeight <= 0) return 0;
  const distance = height - viewportHeight;
  if (distance <= 0) return scrollY + viewportHeight >= top + height ? 100 : 0;
  return Math.round(Math.min(1, Math.max(0, (scrollY - top) / distance)) * 100);
}
