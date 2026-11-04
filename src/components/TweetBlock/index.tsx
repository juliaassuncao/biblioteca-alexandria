import { BarChart2, Heart, MessageCircle, Repeat2 } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { TweetPublication } from "../../types/fanfic";
import { initials } from "../../utils/initials";
import ChapterBody from "../ChapterBody";
import type { TweetBlockProps } from "./props";
import styles from "./styles.module.scss";

function Publication({ post }: { post: TweetPublication }) {
  const { author } = post;
  const interactions = [
    ["replies", "Respostas", MessageCircle],
    ["reposts", "Reposts", Repeat2],
    ["likes", "Curtidas", Heart],
    ["views", "Visualizações", BarChart2],
  ] as const;
  return (
    <article
      className={styles.post}
      data-tweet-id={post.id}
      aria-label={`Publicação de ${author.name ?? author.username}`}
    >
      <header className={styles.header}>
        <span className={styles.avatar} data-tweet-avatar aria-hidden="true">
          {author.initials ?? initials(author.name ?? author.username ?? "")}
        </span>
        <div className={styles.identity}>
          {author.name && <strong>{author.name}</strong>}
          {author.username && (
            <span className={!author.name ? styles.handleOnly : undefined}>
              {author.username.startsWith("@")
                ? author.username
                : `@${author.username}`}
            </span>
          )}
          {post.date && <span>{post.date}</span>}
        </div>
      </header>
      {post.replyTo && (
        <p className={styles.reply}>Respondendo a {post.replyTo}</p>
      )}
      <div className={styles.content}>
        <ChapterBody blocks={post.body} context="message" />
      </div>
      {post.quoted && <Publication post={post.quoted} />}
      {interactions.some(([key]) => post.metrics?.[key] !== undefined) && (
        <footer className={styles.interactions}>
          {interactions.map(
            ([key, label, Icon]) =>
              post.metrics?.[key] !== undefined && (
                <span key={key} aria-label={`${label}: ${post.metrics[key]}`}>
                  <Icon size={16} aria-hidden="true" />
                  {post.metrics[key]}
                </span>
              ),
          )}
        </footer>
      )}
    </article>
  );
}

export default function TweetBlock({ block }: TweetBlockProps) {
  const threadRef = useRef<HTMLElement>(null);
  const [connectors, setConnectors] = useState<{ id: string; path: string }[]>(
    [],
  );
  useLayoutEffect(() => {
    const thread = threadRef.current;
    if (!thread) return;
    const cards = new Map(
      [...thread.querySelectorAll<HTMLElement>("[data-tweet-id]")].map(
        (card) => [card.dataset.tweetId, card],
      ),
    );
    const measure = () => {
      const origin = thread.getBoundingClientRect();
      const paths: { id: string; path: string }[] = [];
      for (const post of block.posts) {
        if (!post.replyToId) continue;
        const parent = cards.get(post.replyToId);
        const child = cards.get(post.id);
        if (!parent || !child) continue;
        const parentBox = parent.getBoundingClientRect();
        const childBox = child.getBoundingClientRect();
        const padding = parseFloat(getComputedStyle(parent).paddingLeft);
        const endX = childBox.left - origin.left;
        const rail = Math.min(
          parentBox.left - origin.left + Math.max(6, padding * 0.35) + 10,
          endX - 4,
        );
        const y = parentBox.bottom - origin.top;
        const endY = childBox.top + childBox.height / 2 - origin.top;
        const radius = Math.min(6, (endX - rail) / 2);
        // One rounded L, entirely in the gap and ending at the reply's border.
        paths.push({
          id: post.id,
          path: `M ${rail} ${y} V ${endY - radius} Q ${rail} ${endY} ${rail + radius} ${endY} H ${endX}`,
        });
      }
      setConnectors((previous) =>
        JSON.stringify(previous) === JSON.stringify(paths) ? previous : paths,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(thread);
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [block.posts]);
  const replies = new Map<string, TweetPublication[]>();
  const roots: TweetPublication[] = [];
  const preceding = new Set<string>();
  for (const post of block.posts) {
    if (post.replyToId && preceding.has(post.replyToId)) {
      const siblings = replies.get(post.replyToId) ?? [];
      siblings.push(post);
      replies.set(post.replyToId, siblings);
    } else roots.push(post);
    preceding.add(post.id);
  }
  const renderThread = (post: TweetPublication, depth = 0): ReactNode => (
    <div className={styles.branch} data-depth={depth} key={post.id}>
      <Publication post={post} />
      {replies.has(post.id) && (
        <div className={styles.replies}>
          {replies.get(post.id)!.map((reply) => renderThread(reply, depth + 1))}
        </div>
      )}
    </div>
  );
  return (
    <section ref={threadRef} className={styles.thread} aria-label="Publicações">
      <svg className={styles.connectors} aria-hidden="true" focusable="false">
        {connectors.map((connector) => (
          <path key={connector.id} d={connector.path} />
        ))}
      </svg>
      {roots.map((post) => renderThread(post))}
    </section>
  );
}
