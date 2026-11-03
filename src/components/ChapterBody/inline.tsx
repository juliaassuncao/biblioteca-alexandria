import type { FormattedText, InlineSegment } from '../../types/fanfic';
import { isSafeReaderLink } from '../../utils/reader-links';

function segmentsToElements(segments: InlineSegment[]) {
  return segments.map((segment, index) => {
    switch (segment.type) {
      case 'text': return segment.text;
      case 'emphasis': return <em key={index}>{segmentsToElements(segment.children)}</em>;
      case 'strong': return <strong key={index}>{segmentsToElements(segment.children)}</strong>;
      case 'link': return isSafeReaderLink(segment.href)
        ? <a key={index} href={segment.href} target="_blank" rel="noopener noreferrer">{segmentsToElements(segment.children)}</a>
        : <span key={index}>{segmentsToElements(segment.children)}</span>;
    }
  });
}

export function inlineContent(content: FormattedText) {
  return content.segments ? segmentsToElements(content.segments) : content.text;
}
