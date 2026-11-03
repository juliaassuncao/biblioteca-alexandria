import type { FormattedText, InlineSegment } from '../types/fanfic.ts';
// Recorta só a apresentação inline; a concatenação continua idêntica ao texto original.
function sliceSegments(parts: InlineSegment[], offset: number): InlineSegment[] {
 let remaining = offset;
 const result: InlineSegment[] = [];
 const length = (part: InlineSegment): number => part.type === 'text' ? part.text.length : part.children.reduce((sum, p) => sum + length(p), 0);
 for (const part of parts) {
  const size = length(part);
  if (remaining >= size) { remaining -= size; continue; }
  result.push(part.type === 'text' ? { ...part, text: part.text.slice(remaining) } : { ...part, children: sliceSegments(part.children, remaining) });
  remaining = 0;
 }
 return result;
}
export function signatureParts(value: FormattedText): { name: string; rest: FormattedText } {
 const index = value.text.indexOf('\n');
 const offset = index < 0 ? value.text.length : index;
 return { name: value.text.slice(0, offset), rest: { text: value.text.slice(offset), ...(value.segments ? { segments: sliceSegments(value.segments, offset) } : {}) } };
}
