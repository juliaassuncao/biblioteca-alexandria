# estudo de caso — importação local

Obra de **nonielb**, enviada pela autoria e autorizada para leitura interna e downloads completos e individuais em PDF/EPUB. Perfil: https://x.com/noniel_b. Publicação original: https://archiveofourown.org/works/81846846. Não houve scraping ou conversão remota.

## Fonte e metadados

O ZIP indicado pela usuária continha somente `estudo_de_caso.pdf`. O PDF permanece em `sources/`, pasta local ignorada pelo Git, fora de `public/` e do build. Não havia cadastro, capítulos ou manifestos da obra no repositório antes desta implementação.

- PDF: 499 páginas; SHA-256 `06da5c4120e669c494cbc11949ffdb389dd9dbb806aa554c4dc0d7229a9593c0`.
- **17 de 17 capítulos**, concluída em **30/09/2026**; narrativa e notas nas páginas 3–498.
- Idioma identificado no PDF: **Português brasileiro**, armazenado como `pt-BR`.
- Títulos originais: **Chapter 1** a **Chapter 17**, sem subtítulos. Não foram traduzidos ou inventados títulos.
- Autoria, sinopse, fandom, relacionamento, tags, classificação Mature (M), avisos e links seguem os dados fornecidos pela usuária.
- O PDF também informa 162.836 palavras, publicação em 25/03/2026, categoria F/F, personagens e o aviso de arquivo **Graphic Depictions Of Violence**. Esses dados foram preservados sem recalcular a estatística de palavras.
- As duas notas gerais do prefácio permanecem em `workNotes`. O aviso específico do resumo do capítulo 6 permanece integral nas notas iniciais, com indicação adicional no catálogo do capítulo.

## Integridade e apresentação

O [importador](../scripts/import-estudo-pdf.py) reutiliza as funções de extração, segmentos e estilos do piloto. O [relatório JSON](./IMPORTACAO-ESTUDO-DE-CASO.json) registra páginas, hashes, notas, links, separadores vetoriais, decisões de junção entre páginas e contagens por capítulo.

- 17 arquivos individuais em [chapters/estudo-de-caso/](../src/content/chapters/estudo-de-caso/), carregados dinamicamente pelo leitor existente.
- **774.840 caracteres não brancos**, na mesma sequência em pdfplumber, pypdf e nos capítulos importados.
- **3.540 blocos narrativos**, **22 blocos de notas iniciais** e **39 blocos de notas finais**.
- Negrito, itálico e links conferidos por caractere e estilo durante a importação; `segments` preserva exatamente `text`.
- **110 separadores vetoriais** recuperados da geometria, além dos separadores textuais `*****`, preservados nos dados.
- Não há imagens embutidas no PDF. Referências textuais a fotos, imagens e roupas foram preservadas, incluindo os links realmente presentes; nenhuma imagem foi inventada.
- Foram excluídos apenas os cabeçalhos estruturais AO3 de capítulo/notas e a mensagem automática da página 499. Os títulos pertencem ao índice; nenhum texto autoral foi excluído.

Seis [manifestos de apresentação](../src/content/presentation/estudo-de-caso/) contêm **10 agrupamentos**: carta, dois excertos poéticos, duas conversas, três reportagens, bilhete e comunicado. O [gerador](../scripts/build-estudo-presentation.mjs) confere os hashes dos capítulos antes de escrever os manifestos e a reconstrução integral dos blocos depois da transformação.

As conversas dos capítulos 2 e 16 mantêm, respectivamente, **19 e 13 mensagens**, na ordem da fonte. O capítulo 2 conserva os lados indicados pelo alinhamento original; o capítulo 16 usa apenas os nomes explícitos no texto. Não foram inferidos horários, avatares, URLs ou nomes de remetentes ausentes. Não foram encontrados tweets ou e-mails apresentados como conteúdo independente; menções narrativas a esses meios permanecem na prosa.

## Integração

A obra foi acrescentada ao fim de [works.json](../src/content/works.json), conforme a convenção de exibição reversa de [content/index.ts](../src/content/index.ts), ficando em primeiro lugar no acervo. Os registros e arquivos das outras histórias não foram modificados.

A página `/obra/estudo-de-caso` utiliza os detalhes universais, autoria clicável, link AO3, índice pesquisável e downloads. As rotas `/obra/estudo-de-caso/capitulo/1` a `/obra/estudo-de-caso/capitulo/17` reutilizam navegação, busca, ajustes, progresso de rolagem e marcação manual local existentes. Os downloads completos e individuais são habilitados explicitamente e usam o mesmo carregador/manifestos em Web Worker, com fontes e recursos locais.

A capa usa a composição tipográfica universal, com uma nova paleta roxa `violet` e ornamento vetorial `stars`; mantém moldura, proporção 3:4, tipografia, dimensões responsivas e o título completo **ESTUDO DE CASO** em maiúsculas. É uma capa criada para a Alexandria, sem identificação como capa oficial. A hero destaca a obra com o CTA **Conhecer a obra**, apontando para seus detalhes.

## Limitações e verificações desta etapa

O PDF não contém tags semânticas de parágrafo: espaços, quebras e junções de página foram reconstituídos pela geometria, sem corrigir a escrita. A revisão editorial humana da disposição dos parágrafos permanece pendente; `editorial.contentReady` está **false**, sem impedir a leitura dos arquivos válidos.

Na página 426, uma mensagem imprime um glifo `.notdef` como quadrado vazio entre `♥` e `😍`. A inspeção visual do PDF confirmou a ausência do desenho original. O texto preserva a representação visível **□**, sem adivinhar o emoji perdido; a limitação está registrada no relatório.

Executado somente o validador de catálogo/conteúdo existente: **9 obras, 156 capítulos e 95 manifestos válidos**. A importação e a geração dos manifestos também conferiram os caracteres, estilos, hashes, ordem e quantidade de mensagens como parte da conversão.

Por solicitação da usuária, **não foram executados lint, testes, typecheck ou build**. A geração efetiva dos downloads e a homologação visual em navegador/dispositivos não foram verificadas nesta etapa. Não houve instalação de dependências, criação de branch, commit, push ou deploy.

## Reprodução

Com Python, pdfplumber/pypdf e Node já disponíveis, a partir da raiz do projeto:

```sh
PYTHONPATH=sources/python-tools python3 scripts/import-estudo-pdf.py
node --experimental-strip-types scripts/build-estudo-presentation.mjs
```

O importador limita a operação ao hash do exemplar conferido e recusa sobrescrever cadastro ou capítulos divergentes. Os caches permanecem em `sources/`; não são dependências do aplicativo.

## Arquivos desta entrega

**6 arquivos existentes modificados:**

- [works.json](../src/content/works.json): metadados, índice, notas gerais e autorização de downloads.
- [content/index.ts](../src/content/index.ts): seleção da obra em destaque.
- [Home/index.tsx](../src/pages/Home/index.tsx): destaque da nova história e CTA.
- [WorkCover/index.tsx](../src/components/WorkCover/index.tsx): ornamento de estrelas.
- [WorkCover/styles.module.scss](../src/components/WorkCover/styles.module.scss): paleta roxa.
- [fanfic.ts](../src/types/fanfic.ts): opções tipadas da nova capa.

**27 arquivos novos:**

- 17 JSONs de capítulos em [chapters/estudo-de-caso/](../src/content/chapters/estudo-de-caso/).
- 6 manifestos em [presentation/estudo-de-caso/](../src/content/presentation/estudo-de-caso/): capítulos 2, 7, 9, 11, 16 e 17.
- [import-estudo-pdf.py](../scripts/import-estudo-pdf.py) e [build-estudo-presentation.mjs](../scripts/build-estudo-presentation.mjs).
- Este documento e o [relatório de integridade JSON](./IMPORTACAO-ESTUDO-DE-CASO.json).

Total: **33 arquivos versionáveis**. O PDF, os caches e os materiais locais de conferência em `sources/` não fazem parte dessa contagem.
