import type { FormattedText, InlineSegment } from '../types/fanfic.ts';

// Slice the presentation while retaining the author's nested emphasis and links.
export function formattedSlice(value: FormattedText, start: number, end = value.text.length): FormattedText {
  const slice = (parts: InlineSegment[]): InlineSegment[] => {
    let cursor = 0;
    const length = (part: InlineSegment): number => part.type === 'text' ? part.text.length : part.children.reduce((sum, child) => sum + length(child), 0);
    const visit = (items: InlineSegment[]): InlineSegment[] => items.flatMap<InlineSegment>(part => {
      const from = cursor;
      if (part.type === 'text') {
        cursor += part.text.length;
        const text = part.text.slice(Math.max(0, start - from), Math.max(0, end - from));
        return text ? [{ ...part, text }] : [];
      }
      if (from + length(part) <= start || from >= end) { cursor += length(part); return []; }
      const children = visit(part.children);
      return children.length ? [{ ...part, children }] : [];
    });
    return visit(parts);
  };
  return { ...value, text: value.text.slice(start, end), ...(value.segments ? { segments: slice(value.segments) } : {}) };
}
