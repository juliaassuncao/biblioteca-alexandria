# OMG (i think i might love you) — importação local

Autoria: **nonielb**; perfil autorizado: https://x.com/noniel_b. Obra enviada pela autoria, com autorização expressa para leitura na Alexandria e downloads completos e individuais em PDF/EPUB. Não houve acesso ao AO3, scraping ou conversão remota.

## Fonte e metadados

O PDF fornecido, `OMG (i think i might love you).pdf`, foi copiado para `sources/omg-i-think-i-might-love-you.pdf`, pasta local ignorada pelo Git. O arquivo-fonte não foi colocado em `public/` nem no aplicativo. Não havia cadastro, capítulos, scripts ou manifestos parciais da obra no repositório.

- SHA-256 da fonte: `fca8cdccf30affa6035fdb003ab8a12387eb62c94ba8b0a3d18dbf412c5596c3`.
- 20 páginas: conteúdo nas páginas **1–19**; página **20 vazia**.
- **1 capítulo publicado**, em andamento, atualização informada em **31/10/2026**.
- Título original do capítulo: **Capítulo 1**. A frase em itálico “Por que você não vem pra São Paulo?” inicia a narrativa e se repete ao longo dela; foi preservada como texto, sem convertê-la em subtítulo inventado.
- Idioma `pt-BR`; classificação **Mature (M)**; fandom, relacionamento, quatro personagens, sinopse integral e onze tags conforme o formulário.
- O PDF não contém prefácio, sinopse, notas iniciais/finais, seção de avisos ou links. A identificação da obra, autoria e capítulo aparece no cabeçalho da primeira página.
- O link AO3, total previsto, quantidade oficial de palavras, data de publicação, categoria e aviso de arquivo permanecem **null**, pois não foram informados e não constam no PDF. O username AO3 não foi usado para inventar um endereço de obra.
- A interface informa **“Avisos de conteúdo não informados pela autoria.”**. Não foi cadastrada uma declaração de ausência de temas sensíveis nem foram inferidos avisos a partir da narrativa.

## Preservação e conferência

O [importador local](../scripts/import-omg-pdf.py) reutiliza a construção de segmentos e as funções de comparação do piloto. O [relatório JSON](./IMPORTACAO-OMG.json) registra hash da fonte e do capítulo, intervalo de páginas, caracteres, estilos, separadores e todas as decisões nas junções de página.

- **44.728 caracteres não brancos**, em ordem idêntica nas extrações independentes com pdfplumber e pypdf e no capítulo importado.
- **194 blocos**: 184 parágrafos e **10 separadores vetoriais** convertidos para o componente existente de mudança de cena.
- **454 caracteres não brancos em itálico** preservados. Este PDF usa a mesma fonte `Inter-Regular` para todos os textos: a ênfase é definida pela matriz de texto inclinada, com `c/a = 0.25`, e não pelo nome da fonte. O importador recupera essa informação sem inferir ênfases pelo conteúdo. Não foram encontrados trechos em negrito na narrativa.
- As **18 transições entre páginas** foram conferidas: dez continuações do mesmo parágrafo e oito inícios de parágrafo. As decisões são restritas ao hash deste exemplar.
- O capítulo termina em “A metade inferior de seu corpo fora de vista.”, como o PDF. Nenhuma continuação foi criada.
- Notas iniciais e finais permanecem vazias porque não existem no exemplar, sem substituir narrativa por notas nem criar notas sintéticas.
- Não foram encontradas imagens, tweets, e-mails ou conversas escritas como elementos independentes. Os diálogos falados permanecem parágrafos, sem transformá-los em chats. Não foi necessário criar manifesto de apresentação.
- Não foram encontrados glifos sem mapeamento ou caracteres substituídos. O validador confirmou que `segments` reconstrói exatamente `text`.

Somente os três cabeçalhos iniciais foram deslocados para os metadados/índice; a página final vazia não gerou conteúdo. Nenhum texto autoral foi excluído ou corrigido.

## Integração

Registro único em [works.json](../src/content/works.json), com leitura interna e downloads habilitados explicitamente. O [capítulo](../src/content/chapters/omg-i-think-i-might-love-you/cap-01.json) usa o carregamento dinâmico universal; não foram criadas rotas ou imports específicos.

- Página da obra: `/obra/omg-i-think-i-might-love-you`.
- Leitura: `/obra/omg-i-think-i-might-love-you/capitulo/1`.
- Índice, ajustes, progresso de rolagem e marcação manual local reutilizam o leitor existente. Com um único capítulo, não há vizinhos disponíveis nem links para capítulos futuros inexistentes.
- Downloads da obra e do capítulo reutilizam `DownloadActions` e os geradores locais PDF/EPUB em Web Worker, sem alteração nos serviços de exportação.
- Créditos e avisos de direitos já utilizados pela biblioteca e pelos exportadores permanecem aplicáveis à obra.
- O cadastro foi acrescentado ao fim do JSON, seguindo a exibição reversa existente, e aparece no topo do acervo. A seleção da hero usa o primeiro item dessa mesma lista, com o CTA existente **Conhecer a obra**.
- Título nas referências: **OMG (i think i might love you)**, já iniciado por maiúscula. Na capa: **OMG (I THINK I MIGHT LOVE YOU)**, pela transformação universal existente.
- Capa: paleta roxa `violet` já disponível e ícone `Ghost` do lucide-react já instalado. Moldura, tipografia, proporção 3:4 e regras responsivas do componente universal foram preservadas. Não se trata de capa oficial.

Os registros e os arquivos das outras obras não foram modificados. O esquema atual continua permitindo acrescentar novos capítulos reais ao índice e à pasta da obra quando a autoria enviar uma atualização.

## Limitações e validação desta etapa

O PDF não contém estrutura semântica de parágrafos; espaços e quebras foram reconstituídos por geometria. **A revisão editorial humana da disposição dos parágrafos permanece pendente**, com `editorial.contentReady: false`. Isso mantém a sinalização editorial sem impedir a leitura dos arquivos válidos.

Executado apenas o validador de catálogo/conteúdo: **10 obras, 157 capítulos e 95 manifestos válidos**. A conferência das duas extrações e dos estilos ocorreu como parte da importação.

Por solicitação da usuária, **não foram executados lint, testes, typecheck ou build**. A geração efetiva dos downloads e a homologação em navegador/dispositivos não foram verificadas nesta etapa. Não houve instalação de dependências, criação de branch, commit, push ou deploy.

## Reprodução

Com Python e os extratores locais já disponíveis, a partir da raiz do projeto:

```sh
PYTHONPATH=sources/python-tools python3 scripts/import-omg-pdf.py
```

O importador recusa outro hash de PDF e não sobrescreve cadastro ou capítulo existentes com dados divergentes. A reprodução não executa testes, typecheck ou build.

## Arquivos desta entrega

**Criados (4):**

- [cap-01.json](../src/content/chapters/omg-i-think-i-might-love-you/cap-01.json).
- [import-omg-pdf.py](../scripts/import-omg-pdf.py).
- [IMPORTACAO-OMG.json](./IMPORTACAO-OMG.json).
- Este documento.

**Modificados (4):**

- [works.json](../src/content/works.json): metadados, avisos desconhecidos, autorização de downloads e índice com um capítulo.
- [content/index.ts](../src/content/index.ts): destaque da história mais recentemente cadastrada, seguindo a ordem do acervo.
- [WorkCover/index.tsx](../src/components/WorkCover/index.tsx): opção de ornamento `ghost`.
- [fanfic.ts](../src/types/fanfic.ts): tipo do ornamento `ghost`.

Total: **8 arquivos versionáveis**. O PDF e os materiais de conferência em `sources/` permanecem locais e não integram essa contagem.
