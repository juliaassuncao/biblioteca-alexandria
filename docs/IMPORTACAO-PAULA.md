# Obras de Paula — importação para o leitor universal

Autora na Alexandria: Paula, com perfil confirmado em https://x.com/folkshoni.
Pseudônimo AO3: wildshoni. Os títulos oficiais e as capas aprovadas foram preservados.

## Fontes locais e organização

- `sources/Encontrei_o_sol_nos_seus.pdf`: 439 páginas, 33 capítulos.
- `sources/close_call.pdf`: 1.004 páginas, 27 capítulos publicados.

Os PDFs e os caches de extração permanecem em `sources/`, ignorado pelo Git e
fora do build. As publicações AO3 são as obras 76167671 e 85459436,
respectivamente. Não houve scraping ou cópia de conteúdo dos sites independentes.

Cada obra possui sua própria pasta em `src/content/chapters/`, com um JSON por
capítulo. `src/content/works.json` mantém metadados, índice, flags de notas e
`reading.mode: internal`. A identificação da obra separa o progresso local e os
downloads. Os endereços dos sites independentes continuam em
`reading.externalUrl`, incluindo os fragmentos `#inicio` e `#homemade`.
BRAT, Bones e Custode continuam externas.

## Preservação durante a importação

O importador reutiliza as funções de segmentos, estilos e leitura de geometria
do piloto. Compara todos os caracteres não brancos, pontuação e ordem com uma
extração independente feita por pypdf. Confere também a contagem de glifos em
negrito/itálico e a igualdade entre texto e segmentos. Notas iniciais/finais são
separadas da narrativa; as notas gerais dos PDFs ficam em `workNotes`.

Títulos de capítulos são extraídos do índice do próprio PDF, preservando inclusive
“Chapter 32” em Encontrei e “Capitulo 18”/“Capitulo 24” em close call.
Cabeçalhos automáticos do AO3 e seu convite final para comentar são excluídos
da narrativa; notas autorais e separadores são mantidos.

As quatro figurinhas de close call, nas páginas 392–394 (capítulo 15), foram
extraídas como JPEGs originais, sem recompressão, em
`public/images/chapters/close-call/`, com textos alternativos e posição preservada.
Não foram encontradas imagens de conteúdo no outro PDF.

## Limitações do exemplar

O PDF de close call já apresenta 18 símbolos como quadradinhos sem mapeamento
Unicode. A importação mantém `□`, conforme a aparência conferida no próprio
documento, sem inferir emojis. Há também um espaço sem mapeamento na página 953.
As ocorrências e suas posições estão em `sourceGlyphLimitations` no relatório.
As duas extrações são comparadas depois dessas representações documentadas.

Os PDFs não possuem tags semânticas de parágrafo. Espaços e quebras são
reconstituídos pela geometria; decisões de continuação entre páginas constam
nos relatórios. A revisão editorial humana permanece pendente:
`editorial.contentReady` fica `false`, sem bloquear os capítulos já importados.

## Reprodução

Com os dois PDFs em `sources/` e os extratores locais disponíveis:

```powershell
$env:PYTHONPATH = (Resolve-Path sources/extraction-tools).Path
python scripts/import-paula-pdfs.py encontrei-o-sol-nos-seus-olhos
python scripts/import-paula-pdfs.py close-call
```

O importador verifica o hash de cada fonte e recusa sobrescrever capítulos ou
imagens existentes com conteúdo divergente. Os relatórios JSON adjacentes
registram hashes, intervalos de páginas, notas, formatação e imagens.

Não foram executados lint, testes, typecheck ou build nesta etapa. A geração e
a inspeção manual de PDF/EPUB e a homologação em dispositivos físicos continuam
pendentes; os downloads reutilizam a autorização padrão de obras internas.
