# Como cadastrar fanfics

Somente obras enviadas pelas próprias autoras e com autorização para o uso proposto.

## Obra hospedada na Alexandria

1. Edite `src/content/works.json`, adicionando um objeto com `id`, `slug`, `title`, `author`, `synopsis`, metadados, `reading.mode = "internal"`, avisos e `chapters`.
2. Cada capítulo deve ter `id` único, `number` sequencial, `title`, `notes`, `contentWarnings` e `blocks`.
3. Mantenha `publishedChapters` igual ao tamanho de `chapters`.
4. Na Fase 1 `blocks`, `notes.before` e `notes.after` ficam vazios, ainda que os indicadores `hasBefore/hasAfter` registrem as notas presentes no PDF.
5. Nunca invente títulos, datas, contagens ou classificação; deixe `null` quando não houver confirmação.
6. Antes da publicação, valide com `npm run check:catalog` e `npm test`.

## Obra com site próprio

1. Use `reading.mode = "external"` e `chapters: []`.
2. Armazene apenas metadados e imagem liberados pela autora; não replique o leitor.
3. Para Bones e Custode, configure `.env.local` com as URLs reais. Para novos sites, cadastre `reading.externalUrl` no JSON e mantenha o resolver genérico. Não registre URL falsa.
4. No catálogo, o card abre diretamente o site independente em nova aba assim que a URL estiver configurada.

## Material visual

As capas iniciais são placeholders tipográficos gerados por CSS e **não são artes das autoras**. Troque por arquivos entregues/aprovados pelas autoras na próxima etapa.

## Checklist editorial

- [ ] A autora enviou a fic e autorizou o uso no catálogo/leitor.
- [ ] Nome e crédito corretos.
- [ ] Sinopse original preservada.
- [ ] Avisos e classificação reproduzidos corretamente.
- [ ] Notas de capítulo preservadas quando migrarmos para o leitor.
- [ ] Capa e imagens com permissão de utilização.
- [ ] Endereço do site próprio ou AO3 original conferido.
