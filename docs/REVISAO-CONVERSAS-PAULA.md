# Revisão das conversas das obras de Paula

Data: 03/11/2026. Escopo: conversas de todos os 27 capítulos de **close call**
e todos os 33 capítulos de **Encontrei o sol nos seus olhos**.

## Fontes e método

- `sources/close_call.pdf`, SHA-256
  `5aed8bce7139aa324ecc592de2712ea3cf5ace46baebcca487cb8d0d6a6ebe0f`.
- `sources/Encontrei_o_sol_nos_seus.pdf`, SHA-256
  `3144fcb5a386efe214191b1319ff3a2d1b6a28eedaef9ef35feaac60f6f55860`.

Os dois PDFs foram lidos diretamente com o extrator local pypdf, sem acesso ao
AO3. Cada capítulo foi comparado integralmente com o texto importado, incluindo
notas, excluindo apenas os cabeçalhos editoriais automáticos já documentados na
importação. Os 60 capítulos coincidem na sequência completa de caracteres não
brancos. Não foram encontradas mensagens ausentes ou duplicadas nessa comparação.

A normalização dessa comparação desconsidera espaços e quebras tipográficas;
os PDFs não possuem marcação semântica de parágrafos. Ela não equivale a afirmar
que cada quebra visual de linha do PDF deve ser uma quebra de parágrafo no site.
Os JSONs originais e seus segmentos, pontuação e acentuação foram preservados.

Foram inventariados remetentes, mensagens em itálico sem remetente em negrito,
mensagens com imagens, trechos misturados à narrativa e continuações próximas
às mudanças de página. Artigos, rankings, bilhetes em papel, pensamentos,
canções e diálogos literários não foram classificados como chats.

## Resultado por obra

| Obra | Capítulos percorridos | Trechos de conversa | Mensagens |
| --- | ---: | ---: | ---: |
| close call | 27 | 219 | 1.427 |
| Encontrei o sol nos seus olhos | 33 | 88 | 564 |
| Total | 60 | 307 | 1.991 |

As quantidades incluem mensagens com figurinhas. Em close call, dois remetentes
estão em itálico sem negrito no próprio texto importado; foram conferidos como
mensagens, sem alterar a formatação original. Os quatro JPEGs de figurinhas
continuam no conteúdo das respectivas mensagens.

## Correções

1. **close call, capítulo 25**, bloco `cap-25-0192`, mensagem na página 845:
   a narração e `Lorena: Sim, podia!` estavam no mesmo bloco de origem.
   A narração permanece como parágrafo; a mensagem passa a integrar o chat
   com as respostas seguintes, na ordem original.
2. **close call, capítulo 27**, bloco `cap-27-0505`, mensagem na página 1002:
   a narração e `Eduarda: Como assim?` estavam no mesmo bloco de origem.
   A narração permanece fora do chat; a pergunta aparece no mesmo componente
   que a resposta de Lorena, `Uma pausa nos nossos encontros.`.

Os manifestos registram o ponto exato de separação desses dois blocos. A
transformação recorta também os segmentos de formatação e conserva os blocos
originais para reconstrução. O renderizador apresenta a narração antes do
componente, sem colocá-la em um balão. A exportação mantém essa mesma ordem,
incluindo a narração uma única vez.

Nenhum JSON de capítulo, metadado, capa, tweet ou estilo visual foi alterado
nesta revisão. Os demais chats mantêm sua apresentação anterior.

## Conferência no navegador

Todos os capítulos foram abertos no leitor. Foram conferidos o texto efetivamente
renderizado, a ordem, os remetentes, a ausência de balões vazios e de avatares
laterais, a consistência dos lados e o transbordamento dos componentes.
Essa conferência cobriu as larguras reais de 1280 px e 390 px, sem transbordamento
horizontal dos chats nem erros de console. A sequência renderizada das 1.991
mensagens coincide com a origem; não houve balões vazios ou trocas de lado para
um mesmo remetente dentro de uma conversa.

As capturas e os registros detalhados ficam apenas em
`sources/conversation-review/`, fora do Git e do build. A comparação independente
com os PDFs está em `sources/paula-conversation-audit.json`.

Não foram executados lint, suíte de testes, typecheck ou build. A leitura dos
PDFs e a inspeção do navegador foram realizadas especificamente para a auditoria
solicitada. Não houve commit, push ou deploy.
