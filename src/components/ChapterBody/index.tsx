import { signatureParts } from '../../services/document-signatures';
import type { ChapterBlock } from '../../types/fanfic';
import { isSafeReaderImage, isSafeReaderLink } from '../../utils/reader-links';
import ChatBlock from '../ChatBlock';
import DocumentBlock from '../DocumentBlock';
import EmailBlock from '../EmailBlock';
import ExcerptBlock from '../ExcerptBlock';
import NoticeBlock from '../NoticeBlock';
import SceneDivider from '../SceneDivider';
import TweetBlock from '../TweetBlock';
import type { ChapterBodyContext, ChapterBodyProps } from './props';
import { inlineContent } from './inline';
import styles from './styles.module.scss';

function renderBlock(block: ChapterBlock, context: ChapterBodyContext, signature = false) {
  switch (block.type) {
    case 'paragraph':
      if (signature) { const { name, rest } = signatureParts(block); return <p className={`${styles.paragraph} ${styles.signature}`}><span>{name}</span>{inlineContent(rest)}</p>; }
      if (context === 'narrative' && /^\s*(?:#{3,}|(?:\*\s*){3,}|(?:~\s*){3,})\s*$/.test(block.text)) return <SceneDivider />;
      return <p className={styles.paragraph} style={{ textAlign: block.alignment }}>{inlineContent(block)}</p>;
    case 'heading': {
      const Heading = block.level === 2 ? 'h2' : 'h3';
      return <Heading className={styles.heading} style={{ textAlign: block.alignment }}>{inlineContent(block)}</Heading>;
    }
    case 'divider': return <SceneDivider />;
    case 'quote': return <blockquote className={styles.quote} style={{ textAlign: block.alignment }}><p>{inlineContent(block)}</p>{block.attribution && <footer>{block.attribution}</footer>}</blockquote>;
    case 'aside': return <aside className={styles.aside} style={{ textAlign: block.alignment }}>{inlineContent(block)}</aside>;
    case 'image': return <figure className={styles.figure} data-alignment={block.alignment}>
      {isSafeReaderImage(block.src) && <img src={block.src} alt={block.alt} loading="lazy" decoding="async" />}
      {block.caption && <figcaption>{block.caption}</figcaption>}
    </figure>;
    case 'external-link': return <p>{isSafeReaderLink(block.href) ? <a href={block.href} target="_blank" rel="noopener noreferrer">{block.label}</a> : block.label}</p>;
    case 'chat': return <>{block.introduction && renderBlock(block.introduction, context)}<ChatBlock block={block} /></>;
    case 'tweet': return <TweetBlock block={block} />;
    case 'email': return <EmailBlock block={block} />;
    case 'document': return <DocumentBlock block={block} />;
    case 'notice': return <NoticeBlock block={block} />;
    case 'excerpt': return <ExcerptBlock block={block} />;
    default: { const exhaustive: never = block; return exhaustive; }
  }
}
export default function ChapterBody({ blocks, context = 'narrative', signatureIds = [] }: ChapterBodyProps) {
  return <div className={styles.body} data-context={context}>{blocks.map(block => <div className={styles.block} key={block.id} data-source-id={block.id}>{renderBlock(block, context, signatureIds.includes(block.id))}</div>)}</div>;
}
