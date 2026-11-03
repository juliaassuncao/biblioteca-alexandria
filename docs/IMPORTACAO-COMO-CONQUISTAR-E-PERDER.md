# Como conquistar (e perder) uma mulher em 30 dias — importação local

Autoria: **Okada**, username AO3 **medvegoals**. A identificação como Okada aparece na apresentação do capítulo 25. Link autorizado: https://x.com/medvegoals. O PDF credita a obra a medvegoals; a colaboração e revisão de Marydebones nos capítulos 24/25 permanecem nas notas originais, sem atribuir coautoria global não informada.

## Fonte e metadados

PDF local `sources/Como_conquistar_e_perder.pdf` (ignorado pelo Git), 465 páginas. Origem informada no documento: https://archiveofourown.org/works/85840201. Não houve scraping.

- Explicit; No Archive Warnings Apply; F/F; Três Graças (TV); Português brasileiro.
- Publicação: 2026-05-31. Atualização: 2026-08-27.
- 99.521 palavras **informadas pelo PDF**, sem substituir a estatística por contagem aproximada.
- 30 capítulos publicados, total planejado desconhecido (`null`), em andamento.
- Sinopse, notas da obra, relacionamentos, nove personagens e dez tags extraídos do PDF.

## Integridade e organização

30 arquivos individuais em `src/content/chapters/como-conquistar-e-perder/`, carregados pelo glob universal. O índice permanece em `src/content/works.json`. O importador `scripts/import-conquistar-pdf.py` reutiliza as funções de geometria, segmentos e formatação do piloto; confere ordem e caracteres não brancos com pdfplumber e pypdf, além das contagens de glifos em negrito/itálico. O relatório JSON adjacente registra hash da fonte, intervalos de páginas, hashes de cada arquivo/texto, notas e transições de página.

Notas sob os marcadores AO3 Chapter Notes e Chapter Summary foram preservadas antes da narrativa; Chapter End Notes, depois. Os limites não marcados de narrativa estão documentados em BODY_START no importador. A última página é o rodapé automático do AO3, não narrativa. Não foram detectadas imagens no PDF. Nenhum capítulo vazio foi habilitado.

Manifestos em `src/content/presentation/como-conquistar-e-perder/` agrupam o artigo do capítulo 3, contrato do capítulo 6, mensagens/posts com identificação explícita e epígrafes de Dante. O validador reconstrói os blocos originais, inclusive IDs e ordem; os JSONs importados não são modificados para apresentação.

Capa tipográfica universal: paleta cobre, ícone FileSignature (folha, linhas e assinatura), título integral em caixa alta via CSS existente. Não é capa oficial. A inclusão ao final do catálogo segue a convenção existente: exibição reversa, primeira posição e Hero dinâmica com “NOVA HISTÓRIA NA BIBLIOTECA”.

Downloads da obra e capítulo reutilizam DownloadActions e os geradores universais PDF/EPUB. Não há upload ou conversão remota. A autorização segue a regra existente para obras internas enviadas pelas autoras.

## Reprodução

Em ambiente com pdfplumber, pypdf e Pillow disponíveis:

```powershell
$env:PYTHONPATH = (Resolve-Path sources/extraction-tools).Path
python scripts/import-conquistar-pdf.py --check
```

As ferramentas Python são locais, ignoradas pelo Git, sem dependências adicionais no aplicativo. `--check` não escreve os capítulos. Não modificar obras anteriores ao reproduzir a importação.

## Limitações

O PDF não contém estrutura semântica de parágrafos; espaços, quebras e junções foram reconstituídos por geometria, sem corrigir a escrita. A comparação automatizada não substitui revisão editorial humana: `contentReady` permanece false. Os 30 capítulos terminam antes dos próximos títulos ou do rodapé do AO3; não foi encontrado marcador de capítulo truncado. O total planejado permanece desconhecido.

Validações automatizadas de catálogo, hashes, navegação e exportação são complementares à homologação em dispositivos físicos e leitores EPUB externos, que permanece pendente. `npm run check` não existe; o comando do projeto é `npm run check:catalog`.

Sem commit, push ou deploy.

## Verificações executadas

- Catálogo: cinco obras, 76 capítulos válidos e 44 manifestos de apresentação.
- Typecheck e build aprovados; PDF-fonte ausente do build.
- Nova importação: 485.373 caracteres não brancos, 134 blocos de notas iniciais e cinco finais; hashes das duas extrações coincidentes.
- Navegador: página de detalhes, 30 capítulos e link de Okada; Hero e primeira posição; capa em caixa alta e títulos contidos nas capas a 320 px; contrato e navegação 5/6/7 sem overflow. Abertura dos capítulos iniciais de Morte à Linguagem e No verde dos seus olhos conferida.
- Geração e inspeção automatizada dos quatro arquivos da nova obra: PDF completo de 693 páginas, EPUB com 30 capítulos e PDF/EPUB individuais do capítulo 9. Texto, notas, estrutura e recursos conferidos pelos testes universais existentes.
- Revisão editorial humana, leitores EPUB externos e dispositivos físicos não foram homologados nesta entrega.
- Suíte final estável: `npm test`, 47 testes aprovados, zero falhas; inclui PDF/EPUB completos e individuais das três obras internas e preservação dos dados de origem.
