# No verde dos seus olhos — importação local

## Atualização do acervo em 10/11/2026 — capítulo 33

Importado integralmente **pleasure heaven - parte II**, do PDF avulso fornecido
`sources/nvdso 33 - pleasure heaven - parte II.pdf` (62 páginas, sem imagens
incorporadas ou notas da autora). Os 32 capítulos e manifestos anteriores foram
preservados. O índice agora tem 33 capítulos, até `/capitulo/33`, disponíveis
pelo carregador dinâmico, navegação, progresso local e exportações existentes.

O [relatório complementar](./IMPORTACAO-NO-VERDE-DOS-SEUS-OLHOS-CAP-33.json)
registra hashes, continuidade entre páginas e contagem: 155.973 caracteres não
brancos conferidos em ordem entre pdfplumber, pypdf e o JSON; 12.630 glifos em
itálico e 109 em negrito. São 502 blocos, com quatro separadores de cena e três
intervalos de conversa entre Buby P. e Gabriela Medvedovsky no manifesto
`src/content/presentation/no-verde-dos-seus-olhos/cap-33.json`. Diálogos e relatos
indiretos de mensagens permanecem narrativos; repetições foram preservadas.

A estatística continua em `stats.words`: às 242.334 palavras anteriormente
informadas pela fonte foram acrescentadas 32.890 do novo capítulo, totalizando
275.224. Como o PDF avulso não informa uma estatística oficial, o acréscimo local
conta tokens separados por espaço que contenham letras ou números, excluindo
separadores; não é uma nova contagem oficial atribuída à autora.
`stats.updatedAt` registra a atualização **do acervo** em 2026-11-10;
`editorial.sourceUpdatedAt` e `stats.publishedAt` permanecem inalterados. Não foi
atribuída data de publicação ao capítulo.

A hero destaca a atualização com “NOVO CAPÍTULO DISPONÍVEL”, o título da obra,
“Capítulo 33 — pleasure heaven - parte II”, Nat e o CTA “Ler novo capítulo”
apontando diretamente para o capítulo 33. A capa foi preservada.

O validador de catálogo aceitou os dados e a reconstrução sem perda dos
manifestos. Não foram executados lint, testes, typecheck ou build nesta atualização.
A revisão editorial humana da disposição dos parágrafos permanece pendente.

## Registro da importação original dos capítulos 1–32

Obra cadastrada em `src/content/works.json`, com os 32 capítulos publicados em
`src/content/chapters/no-verde-dos-seus-olhos/cap-01.json` até `cap-32.json`.
Reutiliza o catálogo, a página de detalhes, o leitor universal, o carregamento
dinâmico e a navegação existentes. Não há backend nem conversão remota.

## Fonte e integridade

- Fonte fornecida: `sources/No verde dos seus olhos.pdf`, 523 páginas, ignorada pelo Git.
- SHA-256: `3de22fdf05bb50811ba2d366fda6a3c20897f05a5ee41bbe2cb33c0019d3871c`.
- Metadados, sinopse, coautoria e nota da obra: páginas 1–2.
- Capítulos: páginas 3–522, separados pelo índice do próprio PDF.
- Página 523: mensagem automática do AO3, excluída da narrativa.
- 5.521 blocos de narrativa; 12 blocos de notas iniciais e cinco de notas finais.
- 1.177.374 caracteres não brancos comparados integralmente, em ordem, entre
  pdfplumber, pypdf e os arquivos gerados. Sem caracteres U+FFFD.
- 26.151 glifos em itálico e 2.006 em negrito conferidos contra as fontes do PDF.
- O exemplar não contém imagens incorporadas. Nenhuma imagem ou capa oficial foi inventada.

O relatório [JSON](./IMPORTACAO-NO-VERDE-DOS-SEUS-OLHOS.json) registra intervalos,
hashes de arquivo/texto, notas, formatação e decisões de continuidade entre páginas.
A sinopse e a nota geral também são comparadas com a página 2 pelo importador.
Os títulos mantêm a escrita do índice, incluindo grafias, pontuação e caixa.
O capítulo 30 não contém a linha “Chapter by” presente nos demais cabeçalhos;
a ausência é tratada sem consumir a primeira linha narrativa.

## Autoria e apresentação

Nat é o nome exibido; `perrysbian` é o usuário principal no AO3, e
`https://x.com/mdvguillenx` é o link externo usado pelo leitor existente.
Na página da obra, a coautoria no AO3 permanece `AlanisCaratella, perrysbian`.
A nota “só para as medveguillens” aparece nos detalhes, sem virar nota de capítulo.
Relacionamentos e personagens usam campos opcionais do mesmo modelo de obra.

A capa tipográfica usa o tom sage e o ícone Brush de lucide-react (pincel
artístico), pelo mesmo componente das capas anteriores. Todos os títulos dentro
das capas são exibidos em caixa alta por CSS, sem alterar os títulos nos dados
ou em outras partes da interface.
A legenda da capa fica vazia porque não foi fornecido um texto para ela.

Os 155 agrupamentos em 18 manifestos de apresentação reutilizam chat,
notificação, trecho e carta. Os intervalos preservam blocos, IDs, formatação e
ordem; o validador reconstrói a fonte integral. Remetentes/horários não são
inferidos. Não se reescrevem capítulos para alterar apresentação.

O destaque da home usa a última obra interna na ordem de inclusão do catálogo,
com a chamada “NOVA HISTÓRIA NA BIBLIOTECA”. Novas obras são acrescentadas ao
fim do JSON e exibidas em ordem inversa no acervo, da mais recente para a mais
antiga; a data de atualização no AO3 não determina a data de inclusão.

## Conferência e reprodução

Ferramentas Python locais: pdfplumber, pypdf e Pillow, como no piloto.
Não são dependências do aplicativo. Neste ambiente foram instaladas somente
em `sources/python-tools/`, também ignorado pelo Git.

```powershell
$env:PYTHONPATH = (Resolve-Path sources/python-tools).Path
python scripts/import-verde-pdf.py --check --fresh
node --experimental-strip-types scripts/build-verde-presentation.mjs
npm run check:catalog
npm test
npm run typecheck
npm run build
```

O importador reutiliza as funções de extração do piloto sem alterá-las. `--check`
não escreve arquivos. Sem essa opção, gera os capítulos e o relatório; o cadastro
da obra precisa existir no catálogo. O hash limita a conversão ao exemplar
conferido. Uma atualização do PDF exige nova revisão dos limites e notas.

Rotas: `/obra/no-verde-dos-seus-olhos` e
`/obra/no-verde-dos-seus-olhos/capitulo/1` até `/capitulo/32`.

Assim como no piloto, a revisão editorial humana da disposição dos parágrafos
permanece pendente: o PDF não contém a estrutura do HTML original. Espaços e
quebras foram reconstituídos pela geometria, sem corrigir a obra.
`editorial.contentReady` permanece false; os arquivos válidos estão disponíveis
no leitor. Na correção da Fase 2.2, a usuária autorizou downloads desta obra e
definiu a disponibilidade padrão para todas as obras internas enviadas pelas
autoras. O campo `downloads.enabled` desta obra passou a true.

## Validação desta entrega

- `npm run check:catalog`: quatro obras, 46 capítulos e 30 manifestos válidos.
- `npm test`: 42 testes aprovados, incluindo a exportação PDF/EPUB do piloto.
- `npm run typecheck` e `npm run build`: aprovados, com capítulos em chunks individuais.
- Importador com `--check --fresh`: 32 arquivos conferidos sem cache.
- Navegador: texto integral da narrativa em ordem, título, link de Nat e
  navegação dos 32 capítulos; notas dos sete capítulos que as contêm; detalhes,
  índice, hero, capitalização das quatro capas e regressão dos sites externos
  e do aviso de homofobia familiar no capítulo 14 de Morte à Linguagem.
- Home, detalhes e capítulo 31 sem overflow horizontal em viewport de 375px.
  No Chrome local, viewport de 320px com barra vertical clássica deixa 305px
  úteis; a largura mínima global preexistente de 320px causa 15px de overflow.
  O estilo global foi preservado nesta entrega.

Os dados anteriores do catálogo, os 14 capítulos e os manifestos de Morte à
Linguagem foram preservados. Bones e Custode continuam sites externos.
Nenhum PDF é copiado para public/ ou para o build. Sem commit, push ou deploy.
