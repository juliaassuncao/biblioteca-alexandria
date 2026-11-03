import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link, useParams } from "react-router";
import ChapterBody from "../../components/ChapterBody";
import DownloadActions from "../../components/DownloadActions";
import ChapterCompletion from "../../components/ChapterCompletion";
import ChapterIndex from "../../components/ChapterIndex";
import ChapterNavigation from "../../components/ChapterNavigation";
import ChapterNotes from "../../components/ChapterNotes";
import ChapterWarning from "../../components/ChapterWarning";
import ReaderPanel from "../../components/ReaderPanel";
import ReaderSettingsPanel from "../../components/ReaderSettingsPanel";
import ReaderToolbar from "../../components/ReaderToolbar";
import ReadingProgress from "../../components/ReadingProgress";
import SceneDivider from "../../components/SceneDivider";
import { useChapter } from "../../hooks/useChapter";
import { useReaderPreferences } from "../../hooks/useReaderPreferences";
import { getReadingUrl, getWorkBySlug } from "../../services/catalog";
import {
  getChapterNeighbors,
  parseChapterNumber,
} from "../../services/chapters";
import {
  LINE_HEIGHTS,
  READING_WIDTHS,
  READER_FONTS,
} from "../../services/reader-preferences";
import NotFound from "../NotFound";
import { READER_MESSAGES } from "./constants";
import type { ReaderSessionProps } from "./props";
import styles from "./styles.module.scss";

function ReaderSession({ work, number }: ReaderSessionProps) {
  const { preferences, updatePreferences } = useReaderPreferences();
  const { result, retry } = useChapter(work, number);
  const [panel, setPanel] = useState<"index" | "settings" | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const article = useRef<HTMLElement>(null);
  const parsedNumber = parseChapterNumber(number);
  const external = work.reading.mode === "external";
  const chapter = external
    ? undefined
    : work.chapters.find((item) => item.number === parsedNumber);
  const { previous, next } = getChapterNeighbors(work, parsedNumber ?? 0);
  const readingUrl = getReadingUrl(work);
  const content = result.status === "ready" ? result.content : undefined;
  const warnings = [
    ...new Set([
      ...(chapter?.contentWarnings ?? []),
      ...(content?.contentWarnings ?? []),
    ]),
  ];
  const variables = {
    "--reader-font-size": `${preferences.fontSize}px`,
    "--reader-line-height": LINE_HEIGHTS[preferences.lineHeight],
    "--reader-width": READING_WIDTHS[preferences.width],
    "--reader-font": READER_FONTS[preferences.font],
  } as CSSProperties;

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${chapter?.title ?? "Leitura"} · ${work.title} · Alexandria`;
    window.scrollTo({ top: 0, behavior: "instant" });
    heading.current?.focus({ preventScroll: true });
    return () => {
      document.title = previousTitle;
    };
  }, [chapter, work.title]);

  const openIndex = () => {
    // O botão do rodapé também abre o diálogo com foco restaurado ao fechá-lo.
    setPanel("index");
  };

  return (
    <div
      className={styles.reader}
      data-theme={preferences.theme}
      style={variables}
      lang={work.language}
    >
      <ReadingProgress target={article} enabled={result.status === "ready"} />
      <div className={styles.shell}>
        {!external && (
          <ReaderToolbar
            work={work}
            chapter={chapter}
            indexOpen={panel === "index"}
            settingsOpen={panel === "settings"}
            onIndex={openIndex}
            onSettings={() =>
              setPanel((current) =>
                current === "settings" ? null : "settings",
              )
            }
          />
        )}
        {!external && (
          <ReaderSettingsPanel
            open={panel === "settings"}
            onClose={() => setPanel(null)}
            value={preferences}
            onChange={updatePreferences}
          />
        )}
        <div className={styles.column}>
          {!external && chapter && result.status === "ready" && <DownloadActions work={work} chapter={chapter} content={result.content} />}
          <header className={styles.heading}>
            <Link to={`/obra/${work.slug}`} className={styles.workTitle}>
              {work.title}
            </Link>
            {chapter && (
              <p className={styles.number}>
                Capítulo {chapter.number} de {work.chapters.length}
              </p>
            )}
            <h1 ref={heading} tabIndex={-1}>
              {chapter?.title ??
                (external
                  ? "Uma experiência independente"
                  : "Leitura indisponível")}
            </h1>
            {work.author.displayName && (
              <p className={styles.author}>
                por{" "}
                <a href={work.author.authorLink} target="_blank" rel="noopener noreferrer">
                  {work.author.displayName}
                </a>
              </p>
            )}
            <SceneDivider label="Separador do cabeçalho" />
          </header>
          <ChapterWarning warnings={warnings} />
          {result.status === "ready" ? (
            <>
              <ChapterNotes
                blocks={result.content.notes.before}
                position="before"
              />
              <article
                ref={article}
                className={styles.narrative}
                aria-label={`Texto do capítulo ${result.chapter.number}`}
                lang={work.language}
              >
                <ChapterBody blocks={result.content.blocks} />
              </article>
              <ChapterNotes
                blocks={result.content.notes.after}
                position="after"
              />
              <ChapterCompletion
                workId={work.id}
                chapterId={result.chapter.id}
              />
            </>
          ) : (
            <section
              className={styles.state}
              role={result.status === "loading" ? "status" : "alert"}
              aria-busy={result.status === "loading"}
            >
              <h2>{READER_MESSAGES[result.status].title}</h2>
              <p>{READER_MESSAGES[result.status].description}</p>
              {result.status === "error" && (
                <button type="button" onClick={retry}>
                  Tentar novamente
                </button>
              )}
              {external && readingUrl && (
                <a href={readingUrl} target="_blank" rel="noopener noreferrer">
                  Abrir site da história ↗
                </a>
              )}
              {result.status !== "loading" && (
                <Link
                  to={`/obra/${work.slug}${external ? "" : "#chapters-heading"}`}
                >
                  {external
                    ? "Voltar aos detalhes da obra"
                    : "Voltar ao índice da obra"}
                </Link>
              )}
            </section>
          )}
          {!external && (
            <ChapterNavigation
              work={work}
              previous={previous}
              next={next}
              onIndex={openIndex}
            />
          )}
        </div>
      </div>
      {!external && (
        <>
          <ReaderPanel
            id="reader-index-panel"
            title="Índice de capítulos"
            open={panel === "index"}
            onClose={() => setPanel(null)}
            editorial
          >
            <ChapterIndex
              work={work}
              currentNumber={parsedNumber ?? undefined}
              onSelect={() => setPanel(null)}
              editorial
            />
          </ReaderPanel>
        </>
      )}
    </div>
  );
}

export default function ChapterReader() {
  const { slug, number } = useParams<{ slug: string; number: string }>();
  const work = slug ? getWorkBySlug(slug) : undefined;
  if (!work) return <NotFound />;
  // Remontar a sessão impede exibir conteúdo anterior durante troca de URL.
  return (
    <ReaderSession key={`${work.id}:${number}`} work={work} number={number} />
  );
}
