# Roadmap técnico

## Fase 1 — Fundação

- [x] React + TS + Vite + SCSS Modules, sem backend.
- [x] Catálogo, busca, filtros, cards e página de detalhes.
- [x] Modelo universal e índice dos 14 capítulos de Morte à Linguagem.
- [x] Bones e Custode como sites externos, ícones Fingerprint e Clover.
- [x] Validação de catálogo, testes, typecheck e build no ambiente local.
- [ ] Obter/configurar URLs reais dos sites externos quando fornecidas.
- [ ] Substituir artes provisórias somente com material autorizado.

## Fase 2 — Leitor universal

- [x] Rota própria por capítulo e navegação sem recarregamento.
- [x] Início da leitura condicionado à disponibilidade real do primeiro capítulo.
- [x] Índice pesquisável por número/título, com notas, avisos e indisponibilidade.
- [x] Carregamento lazy de JSON individual, sem textos integrais na Home.
- [x] ChapterBody tipado para todos os blocos, inline estruturado e chat extensível.
- [x] Notas antes/depois e avisos separados da narrativa.
- [x] Fonte, espaçamento, largura e três temas limitados ao leitor.
- [x] Preferências persistidas com dados inválidos e storage bloqueado tratados.
- [x] Estados de carregamento, conteúdo ausente, erro/retry e URL inválida.
- [x] Bloqueio de leitura interna de obras externas.
- [x] Layout adaptável, áreas de toque, foco, diálogos nativos e teclado.
- [x] Validação compartilhada e testes de serviço, blocos e preferências.
- [x] Importar os 14 capítulos do PDF fornecido, incluindo notas, três imagens,
  separadores e links recuperáveis, em arquivos individuais.
- [x] Comparar caracteres e ordem com duas extrações independentes; conferir
  glifos com itálico/negrito, imagens, notas e destinos dos links recuperados.
- [x] Testar no navegador os 14 capítulos reais, navegação e carregamento lazy.
- [ ] Revisão editorial humana da disposição dos parágrafos, espaços e quebras
  reconstituídos a partir do PDF sem tags. `contentReady` permanece false.
- [ ] Homologar em Android, iPhone/Safari e dispositivos físicos; verificações
  automatizadas locais não substituem essa homologação.

## Fase 2.1 — Refinamento editorial e experiência de leitura

- [x] Consultar Bones (navegação, ajustes, notas, índice e marcação) e Linha Tênue
  (conversas e balões), sem alterar projetos externos ou criar dependências.
- [x] Navegação superior com seletor, ajustes agrupados e navegação inferior editorial.
- [x] Cabeçalhos proporcionais, narrativa justificada e alinhamentos autorais preservados.
- [x] SceneDivider ornamental, notas editoriais e índice com toda a linha clicável.
- [x] ChatBlock, EmailBlock, DocumentBlock, NoticeBlock e ExcerptBlock tipados.
- [x] Manifestos por IDs para apresentar o piloto sem modificar JSONs de importação.
- [x] Progresso de rolagem e marcação manual/reversível local de capítulos lidos,
  como exceção autorizada de escopo; sem iniciar a Fase 3.
- [x] Capas proporcionais ao próprio contêiner, sem cortes em 320px.
- [x] Catálogo, 35 testes, TypeScript e build aprovados; interações e integridade
  verificadas no Chrome, em oito larguras, com detalhes em FASE-2.1.md.
- [ ] Revisão editorial humana dos parágrafos extraídos do PDF e homologação em
  dispositivos físicos (pendências da importação; sem alterar contentReady).

## Fase 2.2 — Exportação e downloads locais

- [x] Downloads por padrão em obras internas enviadas pelas autoras, com desativação
  explícita opcional; sites externos continuam independentes.
- [x] DownloadActions reutilizável na obra e no capítulo, com estados acessíveis.
- [x] Transformação semântica comum baseada nos mesmos JSONs e manifestos do leitor.
- [x] PDF A5 com texto selecionável, fontes locais, notas, imagens e sumário navegável.
- [x] EPUB 3 com capítulos XHTML, manifest/spine, navegação e recursos incorporados.
- [x] Geração sob demanda em Web Worker, sem upload e sem bloquear a leitura.
- [x] Validação de todos os publicados antes de exportar a obra; individual isolado.
- [x] Testes que geram e inspecionam arquivos reais, incluindo integridade do conteúdo.
- [ ] Homologação editorial dos arquivos e conferência no Calibre, Apple Books,
  fluxo de envio Kindle e leitores móveis; não declarar compatibilidade universal.

## Ampliação do acervo — No verde dos seus olhos

- [x] Cadastrar Nat/perrysbian, coautoria no AO3 e metadados fornecidos.
- [x] Importar os 32 capítulos do PDF local, com notas e formatação conferidas
  por duas extrações; reutilizar carregamento e manifestos do leitor universal.
- [x] Capa tipográfica com pincel e destaque da última obra interna incluída.
- [x] Conferir as 32 telas no navegador; catálogo, 42 testes, typecheck e build.
- [ ] Revisão editorial humana dos parágrafos e homologação em dispositivos
  físicos. `contentReady` permanece false; downloads da nova obra autorizados.

Procedimento e hashes em [IMPORTACAO-NO-VERDE-DOS-SEUS-OLHOS.md](./IMPORTACAO-NO-VERDE-DOS-SEUS-OLHOS.md).

## Fase 3 — Biblioteca pessoal / offline (não iniciada)

- [ ] Favoritos, último capítulo e posição de leitura com IndexedDB.
- [ ] PWA, cache de app e pacotes de capítulos.
- [ ] Indicador de disponibilidade offline e armazenamento.
- [ ] Exportar/importar progresso quando possível.
- [ ] Avaliar sincronização somente com escopo e arquitetura próprios.

## Fase 4 — Ampliação

- [ ] Procedimento de recebimento e validação por autora.
- [ ] Importador assistido de EPUB/HTML/PDF com revisão humana.
- [ ] Melhorias de indexação, filtros e governança editorial.

## Ampliação do acervo — Como conquistar (e perder) uma mulher em 30 dias

- [x] Cadastro de Okada/medvegoals e metadados do PDF local.
- [x] 30 capítulos individuais, notas, dupla extração e relatório de integridade.
- [x] Manifestos universais para contrato, artigo, mensagens/posts e epígrafes.
- [x] Capa cobre com assinatura, primeira posição e Hero pela convenção de inclusão.
- [x] Downloads universais autorizados para obra e capítulo.
- [ ] Revisão editorial humana e homologação em dispositivos físicos; contentReady permanece false.

Procedimento em [IMPORTACAO-COMO-CONQUISTAR-E-PERDER.md](./IMPORTACAO-COMO-CONQUISTAR-E-PERDER.md).
