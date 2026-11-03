# Fase 2.1 — Refinamento editorial e experiência de leitura

## Retomada e preservação

Na retomada foram revisados os componentes, serviços, hooks, tipos, scripts,
catálogo, capítulos e relatórios já existentes. A implementação do leitor e da
importação foi aproveitada. Os componentes editoriais e manifestos estavam em
andamento; faltavam a correção final das capas, integração da validação, testes
de interação e documentação. Nenhum conteúdo foi descartado ou reimportado.

O catálogo `src/content/works.json`, os 14 JSONs de capítulos, as três imagens
originais, `src/services/catalog.ts`, `package.json` e `package-lock.json`
mantêm exatamente os hashes da revisão inicial desta fase: 21 arquivos
conferidos, nenhuma divergência. Os testes também verificam os hashes da
importação registrados em `IMPORTACAO-MORTE-A-LINGUAGEM.json`.

Os novos manifestos em `src/content/presentation/morte-a-linguagem/` agrupam
blocos por IDs sem reescrever a fonte: 12 arquivos, 63 agrupamentos. Capítulos
11 e 12 não precisam de manifesto. `check:catalog` valida os intervalos,
reconstrói os blocos e exige igualdade profunda com a fonte. O navegador também
confere que cada ID original aparece exatamente uma vez e que seu texto é
idêntico, incluindo notas, pontuação, segmentos e alinhamentos centralizados.
Separadores mantêm o marcador nos dados, mas mostram somente o ornamento.

## Referências consultadas, somente para leitura

- `../bones-project/src/pages/Reader/`: organização superior, seletor, título,
  notas, navegação inferior e marcação manual.
- `../bones-project/src/components/ReadingControls/`: grupos compactos,
  limites e estados dos ajustes.
- `../bones-project/src/components/ChapterCard/`: link em toda a linha,
  número, título, seta e estado de leitura.
- `../bones-project/src/components/ScrollProgress/`: indicador discreto;
  na Alexandria o cálculo foi adaptado à área do artigo.
- `../linha-tenue-archive/src/components/organisms/chat/` e
  `molecules/chat-message/`: React, props, constantes e SCSS; cabeçalho de
  conversa, identificação, balões, agrupamento e alinhamento.

Nenhum arquivo desses projetos foi alterado, copiado como dependência ou
importado pelo aplicativo. A Alexandria conserva marfim, vinho, terracota,
tipografia editorial e cores dos temas existentes. Não foram criados avatares,
horários ou mensagens para preencher componentes.

## Implementação e inventário

Cada pasta de componente contém `index.tsx`, `props.ts` e `styles.module.scss`;
`constants.ts` foi acrescentado somente quando necessário.

| Criados | Finalidade |
| --- | --- |
| `components/ChatBlock/` | Balões, remetentes e participantes opcionais; imagens, horário, data e sistema quando fornecidos. |
| `components/EmailBlock/` | E-mail com campos, assinatura e anexos opcionais; preservação do corpo. |
| `components/DocumentBlock/` | Ementas, cartas, documentos, relatórios, reportagens, formulários, contratos e rascunhos. |
| `components/NoticeBlock/` | Comunicado/notificação narrativa, separado dos avisos sensíveis. |
| `components/ExcerptBlock/` | Fragmentos literários com atribuição opcional. |
| `components/SceneDivider/` | Separador ornamental em CSS, sem hashes visíveis. |
| `components/ReadingProgress/` | Barra semântica sobre o artigo, ResizeObserver e requestAnimationFrame. |
| `components/ChapterCompletion/` | Marcação manual e reversível; alternativa em memória se storage falhar. |
| `components/ChapterRow/` | Link semântico em toda a linha, sem controles aninhados; foco, hover e estados. |
| `components/ReaderSettingsPanel/` | Ajustes em seção desktop ou diálogo mobile. |
| `hooks/useChapterCompletion.ts` | Estado compartilhado local de leitura concluída. |
| `services/reader-completion.ts`, `services/reading-progress.ts` | Persistência por obra/capítulo e cálculo puro de progresso. |
| `types/chapter-presentation.ts`, `services/chapter-presentation.ts` | Agrupamentos tipados por intervalos de IDs, sem mutação da fonte. |
| `services/special-content-validation.ts` | Validação recursiva dos novos blocos. |
| `content/presentation/morte-a-linguagem/*.json` | 12 manifestos de apresentação. |
| `scripts/build-morte-presentation.mjs` | Geração reproduzível dos manifestos, condicionada aos hashes da importação. |
| `scripts/editorial-content.test.mjs`, `scripts/reader-completion.test.mjs` | Integridade, serviço, modelos especiais, progresso e marcações. |

Arquivos modificados (caminhos relativos a `src/`, salvo indicação):

- `types/fanfic.ts`: união discriminada ampliada e alinhamento explícito.
- `services/chapter-content.ts`, `chapter-data.ts`, `chapters.ts`: validação e
  carregamento lazy da apresentação junto ao capítulo.
- `services/reader-preferences.ts`: família de fonte e migração das preferências.
- `components/ReaderToolbar/{index.tsx,props.ts,styles.module.scss}`:
  índice, capítulo atual, seletor e ajustes responsivos.
- `components/ReaderSettings/{index.tsx,styles.module.scss}`: grupos de tema,
  família, tamanho, entrelinha e largura, com indicadores e limites.
- `components/ChapterBody/{index.tsx,props.ts,styles.module.scss}`:
  delegação a renderizadores e justificação somente na narrativa.
- `components/ChapterNotes/{index.tsx,styles.module.scss}`: abertura e notas
  finais editoriais, sem seções vazias.
- `components/ChapterIndex/{index.tsx,styles.module.scss}` e
  `ChapterList/{index.tsx,styles.module.scss}`: busca e linhas completas.
- `components/ChapterNavigation/{index.tsx,styles.module.scss}`: navegação
  editorial somente entre vizinhos disponíveis.
- `components/ReaderPanel/styles.module.scss`: botão de fechar sem quebra.
- `components/WorkCover/{index.tsx,styles.module.scss}` e
  `WorkCard/styles.module.scss`: composição proporcional e acesso abaixo da capa.
- `pages/ChapterReader/{index.tsx,styles.module.scss}`: integração, cabeçalho,
  temas, artigo, progresso, ajustes e conclusão manual.
- `scripts/validate-catalog.mjs`: validação das apresentações e fidelidade.
- `scripts/reader-preferences.test.mjs`: persistência e migração da fonte.
- `AGENTS.md`, `docs/ARQUITETURA.md`, `docs/ROADMAP.md` e este documento.

Não houve mudança de rotas, dependências, URLs ou metadados da obra. Bones e
Custode continuam externos, com Fingerprint e Clover; Morte à Linguagem mantém
Feather. Sem Git inicializado, branch, commit, push ou deploy.

## Capas e responsividade

O defeito em 320px vinha de medidas fixas do ornamento, título, legenda e margens,
com cabeçalhos/rodapés absolutos dentro de capas de aproximadamente 118px.
Os elementos colidiam e eram recortados por overflow. Não era uma imagem com
object-fit incorreto: as capas são tipográficas, geradas por CSS.

WorkCover mantém proporção 3:4, usa unidades do próprio contêiner e compõe as
faixas superior, central e inferior no fluxo. WorkCard reserva espaço para o ícone
de acesso, que antes cobria a legenda inferior. Grid, paleta e símbolos aprovados
foram preservados.

Home, detalhes de Morte à Linguagem e leitor do capítulo 5 foram verificados em
320, 360, 375, 390, 414, 768, 1024 e 1440px, com altura de 900px. Ajustes e fonte
máxima também foram exercitados em cada largura. Não houve overflow horizontal;
as três capas mantiveram a proporção e seus elementos ficaram dentro dos limites.
Também foi exercitado o painel mobile em 320×812px.
As páginas de detalhes de Bones e Custode também passaram pelas oito larguras
no build de produção. A coluna numérica do índice usa largura proporcional à fonte
e impede quebra dos números de dois dígitos.

## Validações

| Comando | Resultado |
| --- | --- |
| `npm run check:catalog` | Passou: 3 obras, 14 capítulos e 12 apresentações válidas. |
| `npm test` | Passou: 35 testes, nenhuma falha. |
| `npm run typecheck` | Passou, sem erros de TypeScript. |
| `npm run build` | Passou; capítulos e apresentações permanecem em chunks lazy separados. |

No Node 22.15 aparece o aviso esperado de type stripping experimental. O build
também emite uma informação de tempo dos plugins, sem erro de compilação.

| Casos | Evidência no Chrome |
| --- | --- |
| CT01–04 | Barra desktop/mobile, seletor, limites de vizinhança, painéis e Escape com foco restaurado. |
| CT05–08 | Três temas, família, limites 16/30px, reset, entrelinha, coluna de 50rem e persistência após reload. |
| CT09–11 | Justificação e pt-BR; centralizações conferidas nos 14 capítulos; sem hashes isolados visíveis. |
| CT12–14 | Chats, mensagens, figurinhas originais, e-mail, documentos, notificação e notas antes/depois. |
| CT15–18 | Progresso 0/50/100%, reset ao navegar, nenhuma conclusão automática, marcação/desmarcação e persistência no índice. |
| CT19–20 | Clique na margem da linha navega, sem links/botões aninhados; hover e focus-visible verificados. |
| CT21–22 | Oito larguras, capa 3:4, elementos contidos e sem overflow, inclusive com fonte máxima. |
| CT23–24 | Sites externos e três ícones preservados; busca do acervo e de capítulos; tema restrito ao leitor. |
| CT25 | 4.150 IDs originais conferidos no DOM; texto exato, notas e alinhamentos preservados; hashes e reconstrução validados. |

Storage bloqueado foi exercitado em contexto próprio: leitura e marcação em
memória continuam disponíveis. A suíte terminou sem erros JavaScript de página.
O build também foi aberto com `vite preview`: a Home não solicitou chunks de
capítulo; a abertura direta do capítulo 5 solicitou somente os dois chunks dele
(conteúdo e apresentação), sem carregar os outros 13 capítulos.

As evidências locais de navegador ficam em
`node_modules/.tmp/phase21/` (ignoradas): screenshots e `browser-report.json`.
Foi usado Playwright já disponível no ambiente com Chrome headless, sem instalar
dependências. As capturas determinísticas bloqueiam Google Fonts e usam as fontes
alternativas existentes. A inspeção complementar do build permitiu fontes remotas,
mas não atesta todas as faces/pesos em todos os dispositivos; não substitui
homologação visual em dispositivos físicos.

## Conferência visual manual

1. Execute `npm run dev` e abra a URL indicada no terminal.
2. Confira o acervo e `/obra/morte-a-linguagem` nas oito larguras acima. Verifique
   símbolos, título e legendas das capas e o ícone de acesso abaixo de cada uma.
3. Abra `/obra/morte-a-linguagem/capitulo/1`: cabeçalho, notas, ementa centralizada,
   narrativa justificada e separadores. Abra ajustes e alterne os três temas,
   famílias, tamanhos, entrelinha e larguras; recarregue para conferir persistência.
4. Confira chats nos capítulos 3, 5, 7, 9 e 14; e-mails nos capítulos 2, 5 e 13;
   reportagens no 2 e 6; fragmentos no 10 e 14; notificação no 14. As figurinhas
   originais estão no 5 e 9. Nenhum horário ou avatar deve aparecer sem fonte.
5. Navegue pelo seletor e pelas setas inferiores. O primeiro capítulo não tem
   anterior; o último não tem próximo. No índice, busque número/título, use Tab,
   Enter, hover e clique nas margens de uma linha.
6. Role até o final: o progresso deve chegar a 100%, mas a marcação deve continuar
   manual. Marque como lido, recarregue, confira “Lido” no índice e desfaça.
7. Em mobile, abra os painéis, navegue por teclado e feche com Escape. Confira
   restauração do foco e ausência de sobreposição ou rolagem horizontal.
8. Confira os sites externos apenas pelos destinos reais configurados. URL ausente
   continua sem destino inventado e não cria capítulos internos.

## Pendências e limites

- Revisão humana da disposição de parágrafos e espaços reconstruídos do PDF sem
  tags, já registrada na importação. `editorial.contentReady` continua false.
- Homologação em Safari/iPhone, Android e dispositivos físicos, incluindo fontes
  remotas e hifenização dependente do navegador.
- URLs externas que ainda não tenham sido fornecidas permanecem desconhecidas.
- Somente preferências e marcação manual usam armazenamento novo permitido.
  Não há retomada automática da posição, favoritos, offline, PWA, Service Worker,
  IndexedDB, conta, backend ou sincronização. A Fase 3 não foi iniciada.
