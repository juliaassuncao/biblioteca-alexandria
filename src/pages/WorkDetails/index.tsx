import AuthorLink from '../../components/AuthorLink';
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpenText,
  CalendarDays,
  ExternalLink,
  FileText,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { useEffect, type CSSProperties } from "react";
import { Link, useLocation, useParams } from "react-router";
import ChapterList from "../../components/ChapterList";
import ChapterBody from "../../components/ChapterBody";
import DownloadActions from "../../components/DownloadActions";
import WorkCover from "../../components/WorkCover";
import { getReadingUrl, getWorkBySlug } from "../../services/catalog";
import { chapterHref, hasChapterContent } from "../../services/chapters";
import { formatDate, formatNumber } from "../../utils/format";
import NotFound from "../NotFound";
import styles from "./styles.module.scss";

export default function WorkDetails() {
  const { slug } = useParams<{ slug: string }>();
  const { hash } = useLocation();
  const work = slug ? getWorkBySlug(slug) : undefined;
  useEffect(() => {
    if (hash !== '#chapters-heading') return;
    const index = document.getElementById('chapters-heading');
    index?.focus({ preventScroll: true });
    index?.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, [hash, slug]);
  if (!work) return <NotFound />;

  const external = work.reading.mode === "external";
  const readingUrl = getReadingUrl(work);
  const firstChapter = work.chapters.find(chapter => chapter.number === 1);
  const date = formatDate(work.stats.updatedAt);
  const words = formatNumber(work.stats.words);
  const titleScale = Math.max(0.6, Math.sqrt(24 / Math.max(24, work.title.length)));
  return (
    <div className={`container ${styles.page}`}>
      <Link to="/" className={styles.back}>
        <ArrowLeft size={15} /> Voltar ao acervo
      </Link>
      <section className={styles.top}>
        <div className={styles.coverArea}>
          <WorkCover work={work} />
        </div>
        <div className={styles.information}>
          <span className="eyebrow">
            {external ? "EXPERIÊNCIA INDEPENDENTE" : "ACERVO ALEXANDRIA"}
          </span>
          <h1
            className={titleScale < 1 ? styles.longTitle : undefined}
            style={{ '--title-scale': titleScale } as CSSProperties}
          >{work.title}</h1>
          {work.author.displayName && (
            <p className={styles.author}>
              <UserRound size={15} /> por{" "}
              <strong><AuthorLink author={work.author} /></strong>{" "}
              {work.author.ao3Name && <span>({work.author.ao3Name})</span>}
            </p>
          )}
          <p className={styles.author}>{work.fandom && <>{work.fandom} · </>}{work.language === 'pt-BR' ? 'Português brasileiro' : work.language}</p>
          {work.status === "ongoing" && (
            <span className={styles.status}>● Em andamento</span>
          )}
          {work.status === "completed" && (
            <span className={styles.status}>● Concluída</span>
          )}
          <div className={styles.summary}>
            <span className="eyebrow">SINOPSE</span>
            <p>{work.synopsis}</p>
          </div>
          <div className={styles.metrics}>
            {work.stats.publishedChapters !== null && (
              <span>
                <BookOpenText size={16} />
                {work.stats.publishedChapters} de{" "}
                {work.stats.plannedChapters ?? "?"} capítulos
              </span>
            )}
            {words && (
              <span>
                <FileText size={16} />
                {words} palavras
              </span>
            )}
            {date && (
              <span>
                <CalendarDays size={16} />
                {work.status === 'completed' ? 'Concluída em' : 'Atualizada em'} {date}
              </span>
            )}
          </div>
          {external ? (
            readingUrl ? (
              <a
                className={styles.button}
                href={readingUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Acessar projeto <ExternalLink size={17} />
              </a>
            ) : (
              <div className={styles.pendingLink}>
                O endereço do site próprio ainda não foi configurado. Adicione a
                URL real no arquivo <code>.env.local</code> para ativar o
                redirecionamento.
              </div>
            )
          ) : firstChapter && hasChapterContent(work, firstChapter) ? (
            <Link className={styles.button} to={chapterHref(work, firstChapter)}>
              Começar a ler <BookOpenText size={17} />
            </Link>
          ) : (
            <div className={styles.pendingLink}>
              <BookOpenText size={17} /> Os capítulos aguardam a disponibilização
              do texto e das notas da autora para leitura na biblioteca.
            </div>
          )}
          {!external && <DownloadActions key={work.id} work={work} />}
          {work.links.original && (
            <a
              className={styles.original}
              href={work.links.original}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver publicação original no AO3 <ArrowUpRight size={15} />
            </a>
          )}
          {!external && work.reading.externalUrl && (
            <section className={styles.ownSite} aria-labelledby="own-site-heading">
              <h2 id="own-site-heading">Conheça também o site da obra</h2>
              <p>Esta história também possui uma experiência própria, criada especialmente para sua leitura.</p>
              <a href={work.reading.externalUrl} target="_blank" rel="noopener noreferrer">
                Visitar site da obra <ArrowUpRight size={15} aria-hidden="true" />
              </a>
            </section>
          )}
        </div>
      </section>
      {(work.classification || work.contentAdvisories.length > 0) && (
        <section
          className={styles.contentInfo}
          aria-labelledby="content-heading"
        >
          <h2 id="content-heading">
            <ShieldAlert size={18} /> Informações e avisos da obra
          </h2>
          <div className={styles.labels}>
            {work.classification && <span>{work.classification.rating}</span>}
            {work.category && <span>{work.category}</span>}
            {work.classification?.archiveWarning && <span>{work.classification.archiveWarning}</span>}
          </div>
          {work.contentAdvisories.length > 0 && (
            <p>
              <strong>Temas sensíveis:</strong>{" "}
              {work.contentAdvisories.join(" · ")}
            </p>
          )}
          {work.relationships?.length ? <p><strong>Relacionamentos:</strong> {work.relationships.join(' · ')}</p> : null}
          {work.characters?.length ? <p><strong>Personagens:</strong> {work.characters.join(' · ')}</p> : null}
          {work.tags.length > 0 && (
            <div className={styles.tags}>
              {work.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          )}
        </section>
      )}
      {!external && work.chapters.length > 0 && <ChapterList work={work} />}
      {work.workNotes && work.workNotes.length > 0 && (
        <section className={styles.contentInfo} aria-label="Notas da obra">
          <h2>Notas da obra</h2>
          <ChapterBody blocks={work.workNotes} context="note" />
        </section>
      )}
      {external && (
        <div className={styles.externalFootnote}>
          <BookOpenText size={19} />
          <p>
            Esta história mantém seu próprio site e sua própria identidade
            visual. A Biblioteca de Alexandria apenas conecta você à experiência
            original.
          </p>
        </div>
      )}
    </div>
  );
}
