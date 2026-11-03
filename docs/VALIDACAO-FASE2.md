# Validação da Fase 2 — 30/10/2026

**Registro histórico anterior ao recebimento do PDF.** A importação posterior
dos 14 capítulos e os resultados atuais estão em `IMPORTACAO-MORTE-A-LINGUAGEM.md`.

## Situação do conteúdo

**0 capítulos importados de 14 cadastrados.** Não foi encontrado
`sources/Morte à Linguagem.pdf` nem outro PDF no projeto. Não houve extração,
alteração de conteúdo autoral, acesso ao AO3 ou publicação de conteúdo sintético.
A fidelidade da importação integral só poderá ser avaliada com a fonte.

`works.json` foi preservado integralmente, incluindo títulos, sinopse, notas
sinalizadas, avisos e os ícones Feather, Fingerprint e Clover. O serviço de
URLs externas, WorkCover, Home, estilos globais e SCSS de WorkDetails também
foram comparados por hash e permanecem idênticos.

## Verificações automatizadas

- `npm run check:catalog`: 3 obras válidas, 14 capítulos cadastrados e 0 arquivos
  de conteúdo importados.
- `npm test`: 21 testes aprovados (catálogo, serviço de capítulos, blocos,
  arquivos importados, links, notas e preferências).
- `npm run typecheck`: sem erros.
- `npm run build`: aprovado; leitor emitido em chunk JS/CSS separado do catálogo.

Sem instalação de dependências. O Node 22.15 emite um aviso experimental ao
remover os tipos TypeScript nos testes; os comandos terminam com sucesso.

## Navegador

Executadas 11 verificações de integração em Chrome headless usando o Playwright
já disponível no ambiente, sem adicioná-lo às dependências do projeto.
As rotas reais foram verificadas com o conteúdo atual. Para testar leitura
completa, uma obra sintética e seus textos foram injetados somente nas respostas
HTTP de um contexto de navegador isolado: nenhum JSON do catálogo foi editado
e nenhum capítulo demonstrativo foi criado em src/content.

| Casos | Resultado e alcance |
| --- | --- |
| CT01–CT04 | Índice, URL direta, próximo e anterior aprovados na obra de teste; navegação preserva o documento, volta ao topo e foca o título. |
| CT05–CT07 | Três temas, fonte, limites, restauração, espaçamento, largura e persistência aprovados. Catálogo não recebe as preferências. |
| CT08–CT09 | Notas antes/narrativa/depois, blocos e inline aprovados com dados de teste. Aviso real do capítulo 14 preservado. |
| CT10 | Número inválido, capítulo não publicado e obra inexistente apresentam estados claros. |
| CT11 | Rota interna de Bones e Custode bloqueada; serviço de URLs externas e ícones preservados. Não foram inventados endereços. |
| CT12 | Sem overflow horizontal nas larguras 320, 375, 768 e 1440px nos três temas; conteúdo sintético a 30px também verificado em 320px. |
| CT13 | Controles por teclado, Escape inclusive dentro da busca, circulação de foco no modal e restauração ao fechar aprovados. |
| CT14 | Importação e integridade contra o PDF pendentes por ausência da fonte. O teste de arquivos valida todos os JSONs presentes; atualmente são zero. |
| CT15 | Serviço não executa loaders ao listar disponibilidade e só carrega o solicitado; glob lazy e rota em chunk separado. Nenhum texto integral está no catálogo. |

Também verificados: falha de carregamento com nova tentativa bem-sucedida,
storage corrompido ou bloqueado, ausência de narrativa falsa em capítulos
indisponíveis e ausência de erros JavaScript durante os cenários testados.

Foi feita inspeção visual das capturas mobile do leitor real indisponível e da
obra sintética com blocos, notas e fonte ampliada. Testes em dispositivos físicos,
Android, iPhone/Safari e com leitores de tela continuam pendentes; o teste local
em Chrome não equivale a homologação nesses ambientes.

## Como conferir no navegador

1. Execute `npm run dev` e abra o endereço local informado pelo Vite.
2. Acesse `/obra/morte-a-linguagem`: o índice conserva os 14 títulos, sem links
   de leitura e sem “Começar a ler” enquanto não houver texto importado.
3. Abra `/obra/morte-a-linguagem/capitulo/1` para conferir o estado indisponível,
   o painel de índice, a busca e os ajustes. Altere as preferências e recarregue.
4. Abra `/obra/morte-a-linguagem/capitulo/14` para conferir o aviso da autora.
5. Teste `/obra/morte-a-linguagem/capitulo/17`, `/capitulo/0` no mesmo prefixo,
   `/obra/nao-existe/capitulo/1` e `/obra/bones/capitulo/1`.
6. Após receber, importar e revisar o PDF conforme `ARQUITETURA.md`, os links
   serão habilitados pela presença dos arquivos válidos. Repetir a homologação
   com os textos e notas reais.

## Arquivos da implementação

Criados:

- `src/pages/ChapterReader/`: index.tsx, props.ts, constants.ts e styles.module.scss.
- `src/components/ChapterBody/`, `ChapterNotes/`, `ChapterWarning/`,
  `ChapterNavigation/`, `ChapterIndex/`, `ReaderToolbar/`, `ReaderSettings/`
  e `ReaderPanel/`: index.tsx, props.ts e styles.module.scss em cada pasta;
  ChapterBody também possui inline.tsx, ReaderSettings possui constants.ts
  e ReaderPanel possui focus.ts.
- `src/hooks/useChapter.ts` e `useReaderPreferences.ts`.
- `src/services/chapters.ts`, `chapter-data.ts`, `chapter-content.ts` e
  `reader-preferences.ts`.
- `src/utils/reader-links.ts`.
- `src/content/chapters/morte-a-linguagem/README.md` (pendência, sem JSON fictício).
- `scripts/chapters.test.mjs`, `reader-preferences.test.mjs` e `reader-fixtures.mjs`.
- `docs/VALIDACAO-FASE2.md`.

Alterados:

- `src/types/fanfic.ts` e `src/routes/AppRouter/index.tsx`.
- `src/components/ChapterList/index.tsx`, `props.ts` e `styles.module.scss`.
- `src/pages/WorkDetails/index.tsx`.
- `scripts/validate-catalog.mjs`, `package.json` e `.gitignore`.
- `AGENTS.md`, `docs/ARQUITETURA.md` e `docs/ROADMAP.md`.

Os artefatos de build e da verificação de navegador ficam em diretórios já
ignorados (`dist/` e `node_modules/.tmp/`); não integram os dados do aplicativo.

Sem commit, push ou deploy. Não foi possível criar branch de feature porque a
pasta do workspace não é reconhecida como repositório Git.
