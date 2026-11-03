# Fase 2.2 — Exportação e downloads

## Entrega

PDF e EPUB locais da obra completa ou somente do capítulo aberto. O piloto
exporta os **14 capítulos publicados**, sem os três planejados. Conteúdo autoral,
JSONs importados, manifestos e hashes originais permanecem intactos. Não houve
commit, push, deploy, backend ou início da Fase 3.

## Arquitetura e bibliotecas

- DownloadActions é o único componente de controles, integrado às duas páginas.
- Uma camada semântica transforma os ChapterBlocks reais, incluindo notas,
  formatação, alinhamentos, chats legados/atuais, e-mails, documentos, avisos,
  citações, fragmentos, imagens e links. Separadores técnicos viram ornamentos.
- O carregador habitual aplica os manifestos. Obra completa valida todos os
  publicados; capítulo individual valida apenas o solicitado e reutiliza a memória.
- `@react-pdf/renderer` 4.9 produz PDF A5 pesquisável e selecionável, com fontes
  locais incorporadas, capa editorial tipográfica, metadados, sumário navegável,
  bookmarks e paginação. [Compatibilidade oficial com React 19](https://react-pdf.org/docs/v4/compatibility).
- JSZip 3.10.2 empacota EPUB 3 independente de PDF, com XHTML/CSS próprios,
  navegação, manifest/spine e imagens locais. O primeiro arquivo é mimetype,
  armazenado sem compressão e sem campos extras.
- `buffer` 6 fornece o global exigido por png-js no gerador PDF do worker.
- PDF.js 4.10 e xmldom 0.9 são dependências **de teste**, para extrair e verificar
  PDF e analisar XML. Não entram na interface ou nos EPUBs.
- Fontes Noto Serif e Noto Emoji são distribuídas localmente com licença SIL OFL.
  O símbolo 📍 também permanece como texto no PDF.
- Bibliotecas e capítulos são carregados sob demanda num Web Worker ESM. Nenhum
  conteúdo é enviado a servidor ou serviço de conversão. Os únicos fetches da
  geração são para arquivos estáticos da própria aplicação.

## Arquivos

Criados:

- [DownloadActions/index.tsx](../src/components/DownloadActions/index.tsx),
  [props.ts](../src/components/DownloadActions/props.ts) e
  [styles.module.scss](../src/components/DownloadActions/styles.module.scss).
- [export/index.ts](../src/services/export/index.ts),
  [export.worker.ts](../src/services/export/export.worker.ts),
  [export-types.ts](../src/services/export/export-types.ts),
  [export-content.ts](../src/services/export/export-content.ts),
  [export-assets.ts](../src/services/export/export-assets.ts) e
  [export-filename.ts](../src/services/export/export-filename.ts).
- [pdf/index.ts](../src/services/export/pdf/index.ts) e
  [pdf/styles.ts](../src/services/export/pdf/styles.ts).
- [epub/index.ts](../src/services/export/epub/index.ts),
  [xhtml-renderer.ts](../src/services/export/epub/xhtml-renderer.ts) e
  [epub/styles.ts](../src/services/export/epub/styles.ts).
- [Fontes e licenças](../public/fonts/export/): quatro variantes Noto Serif,
  NotoEmoji.ttf, OFL.txt e OFL-Emoji.txt.
- [export.test.mjs](../scripts/export.test.mjs) e este relatório.

Modificados:

- [fanfic.ts](../src/types/fanfic.ts): configuração opcional downloads.enabled.
- [works.json](../src/content/works.json): apenas a autorização de download da obra interna.
- [validate-catalog.mjs](../scripts/validate-catalog.mjs): valida a configuração e
  impede sua habilitação em obras externas.
- [WorkDetails/index.tsx](../src/pages/WorkDetails/index.tsx) e
  [ChapterReader/index.tsx](../src/pages/ChapterReader/index.tsx): integração dos controles.
- [package.json](../package.json), [package-lock.json](../package-lock.json) e
  [vite.config.ts](../vite.config.ts): dependências e worker ESM com chunks dinâmicos.
- [AGENTS.md](../AGENTS.md), [ARQUITETURA.md](./ARQUITETURA.md) e
  [ROADMAP.md](./ROADMAP.md): regras, funcionamento, extensão e pendências.

## Validações automatizadas

`npm run check:catalog`, `npm test`, `npm run typecheck` e `npm run build`
concluídos. **38 testes aprovados** (35 anteriores + 3 suítes de exportação).

O teste de arquivos reais gerou PDF e EPUB completos e do capítulo 9. Conferiu:

- 14 capítulos em ordem; individual com apenas o capítulo 9; sem placeholders.
- PDF com assinatura válida, título e autora, 14 bookmarks no completo e um no
  individual, links e imagens. Extração compara todos os trechos autorais em ordem,
  incluindo notas e conteúdo aninhado. A comparação usa normalização Unicode NFKC,
  desconsidera espaços de paginação, hífens discricionários e rodapés; os testes
  de hashes verificam os originais sem normalização.
- Resultado do PDF A5 completo: **618 páginas**, 1.561.859 bytes. A paginação difere
  do PDF-fonte; não é uma cópia da composição original. Individual do capítulo 9:
  26 páginas.
- EPUB completo: 336.468 bytes; CRC do ZIP, mimetype, container, OPF, metadados,
  manifest/spine, IDs únicos, XML bem formado, navegação e links/recursos internos.
- Três imagens incorporadas ao EPUB, comparadas byte a byte com os arquivos reais;
  imagens presentes no PDF. Ausência de scripts e dependências remotas de leitura.
- Fixtures isoladas cobrem todos os tipos, negrito/itálico/links, remetentes,
  participantes, datas, horários, assinatura, anexos e notas antes/depois.
- Testes negativos cobrem autorização, obra externa, capítulo ausente, tipo
  desconhecido e recurso inválido. JSONs não são alterados pela geração.

## Verificações no navegador

Executadas por automação no navegador integrado sobre o build de produção:

- Controles na obra e no leitor; ausência em Bones e Custode.
- Sem overflow nos controles em 320, 360, 375, 390, 414, 532 e 1280px;
  botões com área de toque de pelo menos 44px.
- Estado de geração e bloqueio de cliques duplicados. O modal de índice continua
  utilizável enquanto o PDF é preparado no worker.
- Geração EPUB integral e individual e PDF integral e individual; mensagens de início.
- O Blob PDF do capítulo 9, produzido pelo worker real do navegador, foi analisado
  com PDF.js: 26 páginas, autoria Vique e uma imagem incorporada.
- O Blob PDF completo do mesmo fluxo foi analisado: 618 páginas, 14 capítulos no
  sumário navegável, autoria Vique e as três imagens incorporadas.
- Falha de rede simulada para uma imagem: mensagem em português identifica o
  recurso; controles voltam a permitir tentativa e a narrativa permanece visível.
- Uma página narrativa do PDF completo foi renderizada e inspecionada visualmente.

O navegador integrado não entregou o evento Playwright `download` para URLs Blob;
os testes usam o próprio Blob destinado ao download e a mensagem da interface.
Não se declara confirmação do diálogo de salvamento do sistema operacional.

## Correção — disponibilidade universal

A causa era a regra `downloads.enabled === true` em `canExport`, compartilhada
pelos controles e pelo serviço: a obra da Nat tinha o campo false e obras futuras
sem a configuração também ficavam bloqueadas. Não havia IDs ou slugs fixos nos
componentes, no worker nem nos geradores.

Por autorização da usuária, obras internas com `editorial.submittedByAuthor: true`
têm downloads habilitados por padrão. A configuração continua opcional:
`downloads.enabled: false` desativa explicitamente e `true` mantém a disponibilidade.
O cadastro de No verde dos seus olhos foi habilitado. Obras externas permanecem
bloqueadas em todas as camadas, mesmo com uma configuração true indevida.

O único DownloadActions já recebia obra/capítulo dinamicamente e estava nas duas
páginas; não foi necessário modificar componentes, navegação ou o leitor.
O teste de arquivos reais agora percorre todas as obras internas do catálogo,
verificando autoria e contagem dinamicamente. Outro teste verifica uma obra
com ID novo e sem configuração de downloads, a desativação explícita e a ausência
de autorização de envio.

A comparação integral entre exportações sequenciais detectou contaminação de
cache de glifos da biblioteca PDF: dois apóstrofos eram extraídos como “K” na
segunda obra gerada na mesma sessão. O gerador agora registra fontes novas a
cada documento, preservando o fallback padrão exigido pelo layout. O teste
mantém a comparação integral, sem normalizar ou aceitar essa substituição.

A validação no Chrome local usa o build de produção e o fluxo real dos botões:
Web Worker, Blob, clique do link e salvamento no disco pelo navegador. Os oito
arquivos em `sources/browser-export-validation-final/` ficam fora do build e do Git.
O PDF é aberto com PDF.js e todo texto autoral é comparado em ordem. EPUBs são
abertos como ZIP com CRC conferido; capítulos XHTML são comparados com as saídas
dos testes e os XMLs analisados. O capítulo individual usado é o 9 em ambas as obras.

| Obra | PDF completo | EPUB completo | PDF do capítulo 9 | EPUB do capítulo 9 |
| --- | --- | --- | --- | --- |
| Morte à Linguagem | 618 páginas; 14 capítulos | 14 capítulos | 26 páginas; 1 capítulo | 1 capítulo |
| No verde dos seus olhos | 1.287 páginas; 32 capítulos | 32 capítulos | 20 páginas; 1 capítulo | 1 capítulo |

Os controles foram conferidos em 1280px e 375px nas duas páginas das duas obras,
com área de toque mínima de 44px. Bones e Custode continuam sem controles.
Um favicon vazio explícito evita a requisição automática a favicon.ico inexistente,
que gerava um 404 no console, sem introduzir arte nem alterar a identidade visual.

Resultado final da correção: `npm run check:catalog`, `npm test` (44 testes),
`npm run typecheck` e `npm run build` aprovados. Os oito downloads concluíram
no Chrome, com conteúdo inspecionado e sem erros de console. A comparação integral
também passou ao gerar as duas obras sequencialmente no mesmo processo de teste.

## Limites e homologação pendente

- EPUBCheck não estava instalado. Foram realizadas validações estruturais locais,
  não certificação EPUBCheck nem homologação Calibre/Kindle/Apple Books ou aparelhos
  físicos. A conferência nesses leitores continua necessária.
- A revisão editorial humana da importação continua pendente; contentReady não mudou.
- Imagens precisam ser PNG/JPEG locais válidos. Imagens externas ou sem suporte
  interrompem a exportação; não são omitidas. Anexos externos continuam como links,
  sem copiar arquivos remotos. O modelo atual não possui um tipo de lista.
- PDF não é PDF/UA ou PDF/A certificado. A capa é uma composição tipográfica,
  sem alegação de ser capa oficial. Glifos não suportados impedem o PDF.
- Geração integral exige memória e pode levar dezenas de segundos ou minutos,
  especialmente em celulares. O worker permite continuar lendo e é encerrado ao
  concluir, falhar ou sair da página. URLs Blob são liberadas após 60 segundos.

## Como testar

1. Executar `npm run dev` e abrir `/obra/morte-a-linguagem`.
2. Em “Baixar obra”, selecionar PDF ou EPUB e aguardar a mensagem de início.
3. Abrir um capítulo; usar “Baixar capítulo” acima de seu cabeçalho.
4. Abrir os arquivos num leitor local: conferir sumário, capítulos, notas e imagens.
5. Para repetir os testes de serviço, executar `npm test`. Opcionalmente definir
   `EXPORT_TEST_OUTPUT` como uma pasta temporária para salvar as quatro saídas.

Cadastro de novas obras autorizadas e extensão dos renderizadores estão descritos
em [ARQUITETURA.md](./ARQUITETURA.md#exportação-local--fase-22).
