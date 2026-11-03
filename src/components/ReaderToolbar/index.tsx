import { ArrowLeft, BookOpen, SlidersHorizontal } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { chapterHref, hasChapterContent } from "../../services/chapters";
import type { ReaderToolbarProps } from "./props";
import styles from "./styles.module.scss";

export default function ReaderToolbar({
  work,
  chapter,
  indexOpen,
  settingsOpen,
  onIndex,
  onSettings,
}: ReaderToolbarProps) {
  const navigate = useNavigate();
  return (
    <nav className={styles.toolbar} aria-label="Ferramentas de leitura">
      <Link className={styles.back} to={`/obra/${work.slug}#chapters-heading`}>
        <ArrowLeft size={15} aria-hidden="true" /> Índice de capítulos
      </Link>
      <div className={styles.picker}>
        <label htmlFor="reader-chapter-select">
          Capítulo {chapter?.number ?? "—"}{" "}
          <span>de {work.chapters.length}</span>
        </label>
        <div className={styles.selectRow}>
          <select
            id="reader-chapter-select"
            aria-label="Selecionar capítulo"
            value={chapter?.number ?? ""}
            onChange={(event) => {
              const selected = work.chapters.find(
                (item) => item.number === Number(event.target.value),
              );
              if (selected && hasChapterContent(work, selected))
                navigate(chapterHref(work, selected));
            }}
          >
            {!chapter && (
              <option value="" disabled>
                Escolha um capítulo
              </option>
            )}
            {work.chapters.map((item) => (
              <option
                key={item.id}
                value={item.number}
                disabled={!hasChapterContent(work, item)}
              >
                {item.number}. {item.title}
                {hasChapterContent(work, item) ? "" : " · indisponível"}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={styles.search}
            aria-label="Pesquisar no índice de capítulos"
            aria-expanded={indexOpen}
            aria-controls="reader-index-panel"
            onClick={onIndex}
          >
            <BookOpen size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
      <button
        className={styles.settings}
        type="button"
        aria-expanded={settingsOpen}
        aria-controls="reader-settings-panel"
        onClick={onSettings}
      >
        <SlidersHorizontal size={17} aria-hidden="true" /> Ajustes de leitura
      </button>
    </nav>
  );
}
