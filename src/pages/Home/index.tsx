import AuthorLink from '../../components/AuthorLink';
import {
  ArrowRight,
  BookOpenText,
  LibraryBig,
  Search,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router";
import { featuredWork, works } from "../../content";
import WorkCard from "../../components/WorkCard";
import WorkCover from "../../components/WorkCover";
import {
  useCatalogFilter,
  type CatalogFilter,
} from "../../hooks/useCatalogFilter";
import styles from "./styles.module.scss";

const filters: { value: CatalogFilter; label: string }[] = [
  { value: "all", label: "Todas as histórias" },
  { value: "internal", label: "No acervo" },
  { value: "external", label: "Sites próprios" },
];

export default function Home() {
  const featuredChapter = featuredWork?.chapters.at(-1);
  const { query, setQuery, filter, setFilter, filtered } =
    useCatalogFilter(works);
  return (
    <>
      <section className={styles.intro}>
        <div className={`container ${styles.hero}`}>
          <div className={styles.copy}>
            <span className="eyebrow">
              <Sparkles size={13} /> UM LUGAR PARA TODAS AS HISTÓRIAS
            </span>
            <h1>
              Histórias para
              <br /> <em>guardar</em> no coração<span>.</span>
            </h1>
            <p>
              Encontre sua próxima leitura, revisite uma favorita e descubra
              mundos criados pelas autoras do nosso fandom.
            </p>
            <a href="#acervo" className={styles.heroAction}>
              Explorar o acervo <ArrowRight size={17} />
            </a>
            <span className={styles.signature}>
              Com carinho, de Loquinha para Loquinha ♡
            </span>
          </div>
          {featuredWork && featuredChapter && (
            <div className={styles.spotlight}>
              <span className={styles.labelTop}>NOVO CAPÍTULO DISPONÍVEL</span>
              <div className={styles.spotlightCover}>
                <WorkCover work={featuredWork} featured />
              </div>
              <span className={styles.heroChapterNumber}>
                Capítulo {featuredChapter.number}
              </span>
              <span className={styles.heroChapterTitle}>
                {featuredChapter.title}
              </span>
              <span className={styles.heroBookAuthor}>
                por <AuthorLink author={featuredWork.author} />
              </span>
              <Link
                className={styles.featureLink}
                to={`/obra/${featuredWork.slug}/capitulo/${featuredChapter.number}`}
              >
                Ler novo capítulo <ArrowRight size={15} />
              </Link>
            </div>
          )}
        </div>
        <div className={styles.heroFooter}>
          <span>EST. 2026</span>
          <span>UMA BIBLIOTECA COMUNITÁRIA, UM UNIVERSO DE HISTÓRIAS</span>
          <BookOpenText size={16} />
        </div>
      </section>

      <section
        className={`container ${styles.catalog}`}
        id="acervo"
        aria-labelledby="catalog-heading"
      >
        <div className={styles.heading}>
          <div>
            <span className="eyebrow">PARA LER, AMAR E RELER</span>
            <h2 id="catalog-heading">
              O nosso acervo <span>✦</span>
            </h2>
            <p>Um cantinho para encontrar as histórias que nos atravessam.</p>
          </div>
          <div className={styles.count}>
            <LibraryBig size={16} />
            {works.length} histórias no catálogo
          </div>
        </div>
        <div className={styles.tools}>
          <label className={styles.search}>
            <Search size={19} aria-hidden="true" />
            <span className="sr-only">Buscar por título, autora ou tag</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar história, autora ou tag..."
            />
          </label>
          <div
            className={styles.filters}
            role="group"
            aria-label="Filtrar por tipo de leitura"
          >
            {filters.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={filter === item.value}
                className={filter === item.value ? styles.selected : ""}
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        {filtered.length > 0 ? (
          <div className={styles.cards}>
            {filtered.map((work) => (
              <WorkCard key={work.id} work={work} />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <BookOpenText size={30} strokeWidth={1.2} />
            <h3>Nenhuma história encontrada</h3>
            <p>Tente buscar por outro título, nome da autora ou tag.</p>
            <button
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
              type="button"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </section>

      <section className={`container ${styles.bottomNote}`}>
        <span className={styles.icon}>
          <BookOpenText size={26} strokeWidth={1.4} />
        </span>
        <div>
          <h2>Cada história tem alguém por trás.</h2>
          <p>
            O acervo é construído com obras enviadas pelas próprias autoras.
            Aqui, cada palavra tem dona, e cada escritora tem seu espaço.
          </p>
        </div>
      </section>
    </>
  );
}
