# Morte à Linguagem — importação dos 14 capítulos

O PDF fornecido pela usuária foi distribuído em `cap-01.json` até `cap-14.json`,
em `src/content/chapters/morte-a-linguagem/`. Os capítulos estão disponíveis no
índice e pelo botão **Começar a ler**. Não foi necessário acessar o AO3 nem
instalar dependências no projeto.

## Fonte e método

- Fonte local: `sources/Morte à Linguagem.pdf`, 284 páginas, ignorada pelo Git.
- SHA-256: `325ad639cd2b686ce6570cfa4b1359e991d8613b7a14616ff97881875dfa834e`.
- Índice do próprio PDF usado para separar capítulos e conferir os 14 títulos.
- Narrativa e notas nas páginas 3–283. As duas primeiras páginas são metadados
  e sinopse, já cadastrados. A página 284 é uma mensagem automática do AO3.
- Marcadores editoriais do AO3 foram retirados da narrativa; notas da autora
  foram colocadas integralmente em before/after, nas posições correspondentes.
- Extração por pdfplumber (posição, fontes e links), confrontada com pypdf
  (texto independente). **484.545 caracteres não brancos em ordem**, sem perda
  ou duplicação detectada, nos 14 capítulos.
- Preservados 36.180 glifos em itálico, 2.838 em negrito, 59 marcadores #####,
  alinhamentos recuperáveis e as três figurinhas originais, extraídas como PNG
  sem perda ou redimensionamento. Alt descreve o texto de cada figurinha.
- Recuperados os dois links de referências literárias e o link mailto existente
  na história. Os destinos são os do PDF; não foram buscados ou substituídos.
- Mensagens de chat mantêm o texto, a sequência, os nomes e o alinhamento do
  material original. Não foram inferidas falas, remetentes ou horários novos.

O relatório legível por máquina está em `IMPORTACAO-MORTE-A-LINGUAGEM.json`:
intervalos, contagens, hashes dos textos/arquivos/imagens, correções de
indicadores de notas e decisões em 264 transições de página. Foram recompostas
54 continuações de parágrafo, incluindo quatro decisões explícitas para
parágrafos centrados e notas com margem diferente.

## Distribuição

As contagens abaixo são de blocos estruturados, incluindo títulos, parágrafos,
separadores e imagens na coluna de narrativa; não equivalem a palavras.

| Arquivo | Páginas do PDF | Narrativa | Notas iniciais | Notas finais | Imagens |
| --- | --- | ---: | ---: | ---: | ---: |
| cap-01.json | 3–10 | 103 | 0 | 0 | 0 |
| cap-02.json | 11–28 | 237 | 0 | 0 | 0 |
| cap-03.json | 29–49 | 335 | 1 | 2 | 0 |
| cap-04.json | 50–70 | 283 | 0 | 1 | 0 |
| cap-05.json | 71–99 | 467 | 3 | 5 | 2 |
| cap-06.json | 100–119 | 260 | 3 | 3 | 0 |
| cap-07.json | 120–137 | 303 | 1 | 1 | 0 |
| cap-08.json | 138–151 | 205 | 1 | 0 | 0 |
| cap-09.json | 152–162 | 162 | 0 | 0 | 1 |
| cap-10.json | 163–178 | 228 | 0 | 1 | 0 |
| cap-11.json | 179–201 | 358 | 2 | 5 | 0 |
| cap-12.json | 202–214 | 179 | 12 | 1 | 0 |
| cap-13.json | 215–232 | 208 | 6 | 3 | 0 |
| cap-14.json | 233–283 | 764 | 6 | 1 | 0 |

Somente `notes.hasBefore` dos capítulos 4 e 10 mudou de true para false no
catálogo, pois esses capítulos têm apenas notas finais. Os demais campos,
sinopse, títulos, estatísticas oficiais, autoria, ícones e URLs foram preservados.
O aviso do capítulo 14 permanece no catálogo e a nota integral da autora está
antes do texto. Não foram acrescentados spoilers ou novos avisos.

## Conferência e limites

O PDF não contém tags de parágrafo ou o HTML original. A disposição de espaços,
quebras e parágrafos foi reconstituída pela geometria. Quebras de paginação
foram removidas sem corrigir ortografia, gramática ou pontuação; hífens foram
preservados e palavras partidas como sentia-se foram reunidas sem inserir espaço.
Quebras identificáveis em subtítulos foram mantidas.

A comparação integral garante equivalência dos caracteres extraídos, da ordem
e dos glifos com fontes recuperáveis; não comprova a disposição original de todos
os espaços/parágrafos no HTML. Por isso, a revisão editorial humana desses
detalhes permanece pendente e `editorial.contentReady` continua false. Os
arquivos válidos já estão habilitados no leitor, conforme a arquitetura existente.

A extração emitiu um aviso sobre FontBBox ausente de uma fonte do PDF. Os três
marcadores 📍 foram recuperados em Unicode e incluídos nas duas comparações;
não foram detectados caracteres de substituição U+FFFD no texto.

## Validações executadas

- `npm run check:catalog`: aprovado, 14 arquivos de capítulo válidos.
- `npm test`: 27 testes aprovados, incluindo hashes, formatação, imagens e notas.
- `npm run typecheck`: aprovado.
- `npm run build`: aprovado, com 14 chunks de capítulo independentes; sem PDF
  no build e sem textos integrais dentro do JSON do catálogo.
- Reextração do PDF sem cache (`--check --fresh`): 14 arquivos conferidos.
- Chrome headless: 7 verificações aprovadas com os dados reais, cobrindo índice,
  início da leitura, navegação, texto integral renderizado dos 14 capítulos,
  notas, aviso, imagens, links e mobile a 320px com fonte máxima e tema escuro.
- A Home e os detalhes não solicitaram arquivos de capítulo; abrir capítulo 1
  solicitou apenas seu JSON. Inspeção visual de desktop e mobile realizada.

Os testes anteriores em `VALIDACAO-FASE2.md` são um registro histórico do período
sem a fonte. Não substituem esta validação com os capítulos reais.

## Reprodução

No ambiente de extração com pdfplumber, pypdf e Pillow disponíveis:

```powershell
python scripts/import-morte-pdf.py --check --fresh
```

`--check` não escreve arquivos. Sem esse argumento, o script gera os capítulos,
imagens e relatório. A fonte é limitada pelo hash ao exemplar conferido; uma
versão diferente requer revisar as decisões de paginação antes de converter.
As bibliotecas Python são ferramentas locais de extração, não dependências do
aplicativo ou do build. A pasta sources/ e seus caches não são publicados.

Para conferir a leitura, executar `npm run dev` e abrir
`/obra/morte-a-linguagem`, ou diretamente
`/obra/morte-a-linguagem/capitulo/1`. As notas e o aviso específico podem ser
conferidos em `/obra/morte-a-linguagem/capitulo/14`.

## Arquivos envolvidos

- Criados: 14 JSONs em `src/content/chapters/morte-a-linguagem/`, três PNGs em
  `public/images/chapters/morte-a-linguagem/`, importador Python, teste de
  integridade e estes relatórios Markdown/JSON.
- Ajustados: indicadores de notas em works.json; modelo, renderizador e validador
  para alinhamento/marcadores originais; links seguros para o mailto da fonte.
- Atualizados: AGENTS.md, arquitetura, roadmap e README dos capítulos.
- Preservados: Home, catálogo visual, WorkCover e serviço de URLs externas de
  Bones/Custode. Nenhum arquivo desses projetos externos foi alterado.

Sem commit, push ou deploy. A pasta continua sem repositório Git reconhecido;
não foi possível criar uma branch de feature.
