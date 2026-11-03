# Arquitetura — catálogo e leitor universal

React + TypeScript + Vite + React Router + SCSS Modules, sem backend. O catálogo
aprovado mantém sua identidade e seus componentes. A rota de leitura carrega sua
interface separadamente com React.lazy.

## Responsabilidades

- `content/works.json`: fonte da verdade dos metadados e índice.
- `content/chapters/<work.id>/<chapter.id>.json`: texto e notas por capítulo.
- `services/catalog.ts`: busca da obra e URLs externas existentes.
- `services/chapters.ts`: adaptador Vite com import.meta.glob lazy.
- `services/chapter-data.ts`: serviço testável com loaders injetados.
- `services/chapter-content.ts`: validação compartilhada entre Node e aplicativo.
- `services/reader-preferences.ts`: padrões, limites e armazenamento seguro.
- `hooks/useChapter.ts`: carregamento, descarte de resposta antiga e retry.
- `hooks/useReaderPreferences.ts`: preferências locais da leitura.
- `pages/ChapterReader/`: sessão da URL e composição editorial.
- `components/ChapterList/`: índice na página de detalhes.
- `components/ChapterBody/`: switch tipado e renderização inline.
- `components/ChapterNotes/`: notas antes/depois, sem containers vazios.
- `components/ChapterWarning/`: avisos específicos.
- `components/ChapterNavigation/`: vizinhos publicados e disponíveis.
- `components/ChapterIndex/`: painel pesquisável por número/título.
- `components/ReaderToolbar/`: detalhes, índice e ajustes.
- `components/ReaderSettings/`: controles de leitura.
- `components/ReaderPanel/`: dialog nativo com teclado e foco.

Componentes mantêm index.tsx, props.ts e styles.module.scss; constantes são
extraídas quando necessárias. O leitor não contém regras de uma história específica.

## Rotas e disponibilidade

`/obra/:slug` continua apresentando detalhes. `/obra/:slug/capitulo/:number`
resolve a obra pelo catálogo, valida um inteiro positivo e carrega somente o
JSON solicitado. Slugs desconhecidos usam NotFound. Número inválido, capítulo
não publicado, ausência de arquivo e falha de carregamento têm estados distintos.
Falhas permitem tentar novamente sem recarregar a aplicação.

O glob lazy apenas enumera os arquivos; não importa seus textos na Home. A
presença do JSON habilita o link no índice e, para o capítulo 1, “Começar a ler”.
**Todo arquivo presente deve passar por npm run check:catalog antes da entrega.**
O mesmo validador verifica o conteúdo novamente quando o leitor o carrega:
um JSON vazio, corrompido ou incoerente nunca é apresentado como narrativa pronta.

A navegação usa Link e só oferece vizinhos imediatos com conteúdo, sem pular
lacunas ou apontar para capítulos planejados. Trocar a URL remonta a sessão,
descarta respostas antigas, volta ao topo e foca o título.
O índice pesquisável ignora caixa e acentos. O diálogo nativo restringe o foco,
fecha com Escape e restaura o foco ao controle que o abriu.

reading.mode = external impede carregar capítulos mesmo se um arquivo for
criado indevidamente. Bones e Custode mantêm o serviço de URL e os ícones
Fingerprint e Clover. URLs públicas continuam vindo do catálogo ou de
VITE_BONES_URL / VITE_CUSTODE_URL em .env.local. Nunca usar outro destino como
substituto de uma URL desconhecida.

## Contrato dos arquivos de capítulo

O catálogo mantém número, título, avisos e indicações de notas. Os arrays
legados vazios são preservados; o texto novo vai em arquivos individuais,
evitando duplicar os títulos/metadados.

Formato mínimo ilustrativo, **apenas para uma obra de teste**:

```json
{
  "id": "cap-01",
  "blocks": [{ "id": "p-1", "type": "paragraph", "text": "Texto de teste." }],
  "notes": { "before": [], "after": [] }
}
```

- id corresponde ao capítulo no catálogo e ao nome do arquivo.
- blocks exige narrativa não vazia; cada bloco tem ID único no capítulo,
  incluindo notas. Nunca adicionar arquivos vazios para simular disponibilidade.
- notes.before e notes.after contêm blocos da autora em suas posições.
  Sua presença deve corresponder a hasBefore e hasAfter do catálogo.
- contentWarnings opcional contém avisos adicionais verificados na fonte.
  O leitor combina esses avisos com os do catálogo, sem remover os existentes.
  O aviso de homofobia familiar do capítulo 14 permanece no catálogo.

ChapterBlock mantém paragraph, heading (nível 2 ou 3), divider, quote (com
attribution opcional), aside, image (src, alt, caption opcional), external-link
(href, label) e chat. Imagens exigem alt e URL HTTP(S) ou caminho local absoluto
em /. Links aceitam HTTP(S) e mailto seguro, recuperado da fonte, e abrem com
noopener noreferrer. Imagens continuam proibindo mailto e protocolos executáveis.

FormattedText aceita alignment opcional (left, center, right ou justify); imagens
aceitam left, center ou right,
preservando o alinhamento das ementas e mensagens do PDF. Separadores podem
trazer text e segments para manter o marcador original, como #####.

Parágrafos, títulos, citações, destaques e mensagens mantêm text: string.
O campo opcional segments acrescenta formatação retrocompatível:

```json
{
  "id": "p-1",
  "type": "paragraph",
  "text": "Um texto de teste.",
  "segments": [
    { "type": "text", "text": "Um " },
    { "type": "emphasis", "children": [{ "type": "text", "text": "texto" }] },
    { "type": "text", "text": " de teste." }
  ]
}
```

Segmentos são text, emphasis, strong ou link (href + children).
O texto concatenado deve ser idêntico a text, preservando espaços e pontuação.
Links aninhados são rejeitados. React escapa os dados; não há
dangerouslySetInnerHTML. Não inferir formatação não recuperável da fonte.

Chats preservam chatId e podem trazer messages, com id, sender, text,
segments e time opcional. Arquivos publicados exigem mensagens reais, não
apenas um identificador. Nenhum diálogo foi inventado para a fic piloto.

## Cadastro de capítulos de outra obra

1. Receber material autorizado pela autora; não fazer scraping.
2. Cadastrar metadados e índice em works.json, usando reading.mode: internal.
3. Criar src/content/chapters/<work.id>/<chapter.id>.json conforme o contrato.
4. Conferir texto, ordem, títulos, pontuação, separadores, notas, avisos,
   links, imagens e formatação contra a fonte. Não corrigir a escrita da autora.
5. Executar npm run check:catalog, npm test, npm run typecheck e npm run build.
6. Conferir a leitura na URL própria e revisar telas pequenas e teclado.

Não é necessário alterar o leitor ou registrar manualmente imports. Arquivos
órfãos, obras externas, IDs divergentes e conteúdo inválido são rejeitados.
editorial.contentReady só deve mudar após a revisão integral da obra.

## Preferências de leitura

Fonte de 16 a 30px (padrão 20px, passos de 2); altura de linha compacta,
confortável ou ampla; temas claro, sépia e escuro; colunas de 34, 42 ou 50rem,
sempre limitadas à largura disponível. Valores vivem em
services/reader-preferences.ts; tokens de cor ficam no SCSS do leitor.

CSS custom properties são aplicadas somente dentro do leitor. Catálogo,
cabeçalho e rodapé preservam a identidade aprovada. Preferências são guardadas
na chave versionada alexandria.reader.preferences.v1. Dados inválidos ou
armazenamento bloqueado usam padrões seguros, mantendo ajustes em memória.
Na Fase 2.1 foram acrescentadas família serifada/sem serifa e migração segura das
preferências antigas. O progresso de rolagem usa exclusivamente a área do artigo,
sem persistir posição. A marcação manual é uma exceção de escopo autorizada;
não há favoritos, sincronização, PWA ou IndexedDB.

## Apresentação editorial — Fase 2.1

`types/chapter-presentation.ts` e `services/chapter-presentation.ts` definem uma
camada opcional de agrupamento. `content/presentation/<work.id>/<chapter.id>.json`
guarda somente chapterId e groups com type, start, end e, quando necessário,
kind e senderIds. Os intervalos se referem a IDs existentes, em ordem, sem
sobreposição nem separadores absorvidos. Os arquivos também carregam via glob
lazy, apenas junto ao capítulo solicitado.

Os 14 JSONs importados do piloto, as notas e as imagens continuam intactos.
`scripts/build-morte-presentation.mjs` reproduz os 12 manifestos a partir de
intervalos revisados e marcadores recuperados da fonte. Confere os hashes do
relatório antes de gerar; não é um classificador executado pelo leitor. Mudanças
na fonte exigem nova revisão editorial dos intervalos. `check:catalog` verifica
todos os manifestos, valida os blocos resultantes e compara a reconstrução
com os blocos originais por igualdade profunda, incluindo IDs, ordem e segmentos.

Novos tipos de ChapterBlock e renderizadores:

| Tipo | Componente | Dados e comportamento |
| --- | --- | --- |
| chat | ChatBlock | entries de mensagem/data/sistema; participantes opcionais; remetente como TextBlock, corpo em blocos, lado, horário e avatar apenas quando conhecidos. messages legado continua aceito. |
| email | EmailBlock | body obrigatório; from/to/subject/date opcionais ou null; assinatura e anexos seguros opcionais. |
| document | DocumentBlock | body e kind: document, letter, syllabus, report, article, form, contract ou draft; cabeçalho opcional. |
| notice | NoticeBlock | body e kind: notice, notification ou alert; comunicado autoral sem semântica de alerta da aplicação. |
| excerpt | ExcerptBlock | body e atribuição opcional; fragmento literário com tratamento próprio. |

Campos ausentes não geram remetentes, datas, nomes ou avatares fictícios. No piloto,
ementas, cartas, mensagens e e-mails mantêm seus campos originais dentro dos
blocos preservados; não há extração destrutiva desses textos para metadados.
Validadores recursivos limitam profundidade, verificam IDs, remetentes, segmentos,
participantes e URLs. Não há HTML autoral executável.

`ChapterBody` delega aos renderizadores especializados e registra data-source-id
para conferência. A narrativa é justificada, com text-justify: inter-word,
hyphens: auto e lang do catálogo. Os contextos note/message/document/quote não
forçam justificação; alinhamento explícito da autora tem prioridade. SceneDivider
renderiza separadores em CSS, mantendo o marcador original somente nos dados.

ReaderToolbar reúne índice, seletor e ajustes; ReaderSettingsPanel usa uma seção
no desktop (a partir de 900px) e diálogo nativo abaixo disso. ChapterNavigation
oferece somente vizinhos imediatos disponíveis. ChapterIndex e ChapterList usam
ChapterRow: um Link por linha inteira, com busca, foco e estado de leitura.
ChapterNotes mantém abertura e encerramento em seções separadas.

ReadingProgress observa o artigo com ResizeObserver e rolagem passiva agrupada
por requestAnimationFrame. Notas, cabeçalhos e rodapé não ampliam a distância de
leitura. Troca de URL remonta a sessão e reinicia o progresso. ChapterCompletion
e useChapterCompletion compartilham a marcação manual na sessão. A chave
alexandria.reader.completed.v1 guarda pares workId/chapterId e permite desfazer;
storage bloqueado mantém funcionamento em memória com indicação ao usuário.

WorkCover conserva proporção 3:4 e a arte original. Container queries dimensionam
tipografia, ornamentos e margens pela largura da própria capa; a composição central
e as legendas superior/inferior ocupam o fluxo, evitando colisões em duas colunas
a 320px. WorkCard reserva espaço para o ícone de acesso abaixo da capa.

Inventário, inspeções de referência e verificações em `docs/FASE-2.1.md`.

## Estado da migração da fic piloto

O PDF fornecido pela usuária foi copiado para sources/Morte à Linguagem.pdf,
fora de public/ e do build, em pasta ignorada pelo Git. **14 de 14 capítulos
importados**, com três figurinhas originais em public/images/chapters/
morte-a-linguagem/, notas antes/depois, alinhamento, separadores, negrito,
itálico e links recuperáveis. A fonte tem 284 páginas; capítulos nas páginas
3–283. As páginas de metadados e a mensagem automática final do AO3 não são
narrativa. Não houve acesso ao AO3.

Somente hasBefore dos capítulos 4 e 10 foi corrigido no catálogo: o marcador
Chapter Notes desses capítulos apenas anuncia notas finais. Títulos, sinopse,
autoria, estatísticas, URLs e os demais campos foram preservados.

O importador local scripts/import-morte-pdf.py confere títulos/IDs, compara os
484.545 caracteres não brancos em ordem com duas extrações (pdfplumber e pypdf)
e preserva a formatação recuperada das fontes. O PDF não tem tags de parágrafo;
espaços e quebras foram reconstituídos pela geometria e por decisões registradas
nas junções de página. A revisão editorial humana desses detalhes ainda está
pendente; editorial.contentReady permanece false. Isso não bloqueia os arquivos
válidos já disponíveis no índice.

Método, contagens, limitações e reprodução em docs/IMPORTACAO-MORTE-A-LINGUAGEM.md;
hashes por capítulo e imagem em docs/IMPORTACAO-MORTE-A-LINGUAGEM.json. Os testes
de integridade verificam esses hashes sem exigir o PDF local.

## Validações

O Node reutiliza os validadores TypeScript com --experimental-strip-types,
disponível na versão Node 22 exigida pelo projeto. No Node 22.15 há um aviso
experimental esperado; não é falha de teste. As Fases 1–2.1 não acrescentaram
bibliotecas de geração; as dependências de exportação da Fase 2.2 estão descritas abaixo.

Testes Node cobrem carregamento sob demanda, navegação, validação de numeração,
erros/retry, bloqueio de obras externas, blocos, segmentos, notas e preferências.
Os dados sintéticos ficam exclusivamente em scripts/reader-fixtures.mjs e
nunca entram nos capítulos ou no build do aplicativo.

## Exportação local — Fase 2.2

`DownloadActions` oferece PDF e EPUB junto à leitura na página da obra e acima do
cabeçalho do capítulo. Obras internas com `editorial.submittedByAuthor: true`
têm downloads por padrão, inclusive sem a configuração `downloads`.
`downloads.enabled: false` desativa explicitamente; `true` mantém a disponibilidade.
Obras externas não recebem controles e também são recusadas pelo serviço.
Para cadastrar outra obra, obter autorização da autora, importar e validar todos
os capítulos publicados e executar os quatro comandos
de validação. Não alterar `editorial.contentReady` para habilitar downloads.

`services/export/export-content.ts` transforma o ChapterBlock atual em ExportNode.
Metadados, avisos, notas e ordem vêm dos mesmos dados estruturados do leitor.
Os manifestos de apresentação são aplicados pelo carregador de capítulos habitual.
Nenhum texto é extraído do DOM ou do PDF original. A exportação completa verifica
a contagem de publicados e carrega todos os capítulos do índice, sequencialmente;
um capítulo ausente/inválido interrompe a operação com sua identificação. A
exportação individual verifica apenas o capítulo solicitado e reutiliza o conteúdo
validado que o leitor já tem em memória. Os três capítulos planejados não entram.

`services/export/index.ts` inicia um Web Worker de módulo somente após o clique.
O worker carrega capítulos, imagens e o gerador escolhido sob demanda; a Home
não baixa textos nem bibliotecas de conversão. `vite.config.ts` preserva chunks
ESM no worker. Navegar para fora cancela a tarefa e termina o worker. Sucesso ou
erro também encerra o worker. O arquivo é um Blob baixado por URL temporária,
revogada após 60 segundos para permitir a captura pelo navegador. Não há upload,
telemetria, servidor de conversão, cache persistente ou novo estado de leitura.

### PDF

`@react-pdf/renderer` 4.9 é compatível com o React 19 instalado. Produz texto real
selecionável em páginas A5: capa tipográfica editorial (não oficial), ficha da obra,
sumário com links, bookmarks por capítulo, notas, avisos e paginação. O capítulo
individual contém apenas sua identificação, avisos, narrativa e notas. Negrito,
itálico, links e alinhamentos explícitos são preservados. Só parágrafos narrativos
sem alinhamento explícito são justificados; documentos, notas e mensagens mantêm
suas exceções. Não há hifenização inglesa automática.

As fontes abertas Noto Serif (regular, negrito, itálico e negrito itálico) e Noto
Emoji ficam em `public/fonts/export/`, com licenças SIL OFL. São incorporadas ao
PDF e incluem o glifo 📍 da obra. Uma verificação prévia impede glifos ausentes.
Manter a altura de linha nos textos, não na Page: a resolução repetida de lineHeight
herdado em rodapés fixos provoca crescimento da métrica entre páginas no renderer.
Figuras preservam proporção; legenda ou descrição alternativa acompanha a imagem.

### EPUB 3

JSZip cria `mimetype` primeiro, sem compressão/campos extras, seguido de container,
OPF, navegação EPUB 3, CSS independente, capa XHTML editorial quando é a obra
completa, um XHTML por capítulo e imagens incorporadas. Manifest e spine seguem
o catálogo; título, autoria conhecida, idioma, descrição, datas conhecidas e
identificador estável vêm dos dados. `dcterms:modified` é obrigatório no EPUB;
usa a atualização conhecida ou a data de geração quando ela é desconhecida.
Não há JavaScript dentro do livro. XML é escapado e caracteres inválidos recusados.
Os links da navegação resolvem arquivos internos; links autorais externos são
preservados como referências, sem necessidade de rede para ler a narrativa.

### Extensão, integridade e limites

Ao criar um tipo de bloco, atualizar o modelo/validador, `transformBlocks`, os
renderizadores PDF/EPUB e os testes. Switches desconhecidos lançam erro. Chats
incluem participantes conhecidos, remetentes, horários, datas e eventos de sistema;
e-mails incluem campos existentes, corpo, assinatura e links de anexos. Documentos,
avisos e fragmentos mantêm hierarquia e texto; marcadores técnicos de separação
são apresentados como ornamentos. Não há tipo de lista no modelo atual: um tipo
futuro precisa de suporte explícito, nunca conversão silenciosa em texto.

Recursos de imagem precisam ser arquivos locais PNG/JPEG válidos. Outros formatos
ou imagens remotas impedem o download com erro; incorporá-los exige suporte e
testes adicionais. Anexos externos são links de referência, não cópias dos arquivos.
Não existe imagem de capa oficial no modelo atual; a capa exportada é tipográfica.
Não são produzidos PDF/UA ou PDF/A certificados. O renderer e as fontes aumentam
o download inicial do primeiro PDF; a geração integral pode levar dezenas de
segundos (ou minutos, conforme o dispositivo) e usar memória considerável, mas
ocorre fora da thread da interface. O pacote `buffer` fornece Buffer apenas no
contexto do gerador: a dependência png-js do renderer precisa desse global no
Web Worker para incorporar as imagens, além da decodificação prévia dos recursos.

`scripts/export.test.mjs` gera PDF/EPUB reais de cada obra interna completa e de
um capítulo individual (capítulo 9, ou o último publicado se houver menos de nove),
extrai texto com PDF.js, confere metadados, sumário, imagens, texto em ordem e notas,
valida CRC do ZIP, XML, manifest/spine, recursos e links. Fixtures isoladas cobrem
todos os blocos e erros. `EXPORT_TEST_OUTPUT` permite salvar as quatro saídas por
obra, em subpastas por ID, numa pasta temporária para inspeção. EPUBCheck/Calibre e dispositivos físicos são
validações externas: sem executá-las, não afirmar homologação nesses leitores.

Para testar: `npm run dev`, abrir a obra e usar “Baixar obra” → PDF/EPUB; abrir
qualquer capítulo e usar “Baixar capítulo” → PDF/EPUB. Conferir o nome do arquivo,
o sumário, as notas e as imagens; repetir numa obra externa para confirmar ausência
dos controles. Repetir com um recurso indisponível para conferir a mensagem de erro.
