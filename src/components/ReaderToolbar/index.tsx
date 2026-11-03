import { ArrowLeft, ChevronDown, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router";
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
  return (
    <nav className={styles.toolbar} aria-label="Ferramentas de leitura">
      <Link className={styles.back} to="/">
        <ArrowLeft size={15} aria-hidden="true" /> Voltar ao acervo
      </Link>
      <button
        type="button"
        className={styles.picker}
        aria-label={`Abrir índice de capítulos${chapter ? ` — Capítulo ${chapter.number}: ${chapter.title}` : ''}`}
        aria-expanded={indexOpen}
        aria-haspopup="dialog"
        aria-controls="reader-index-panel"
        onClick={onIndex}
      >
        <span className={styles.current}>
          <span className={styles.number}>Capítulo {chapter?.number ?? "—"} de {work.chapters.length}</span>
          <span className={styles.title}>{chapter?.title ?? "Escolher capítulo"}</span>
        </span>
        <ChevronDown size={17} aria-hidden="true" />
      </button>
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
