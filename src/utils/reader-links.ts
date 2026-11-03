export function isSafeReaderLink(value: unknown): value is string {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) || (
      url.protocol === 'mailto:' && url.pathname.includes('@') && !/%0a|%0d|[\r\n]/i.test(value)
    );
  } catch {
    return false;
  }
}

export function isSafeReaderImage(value: unknown): value is string {
  const remoteImage = isSafeReaderLink(value) && /^https?:/i.test(value);
  return remoteImage || (
    typeof value === 'string' && /^\/(?!\/)[^\\\s]+$/.test(value) && !/[\u0000-\u001f]/.test(value)
  );
}
