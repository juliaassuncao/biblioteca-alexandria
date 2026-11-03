# Orientações para agentes de código / Codex

Contexto: projeto independente **Biblioteca de Alexandria — Loquinha**. Etapa corrente: **Fase 2.2 — Exportação local em PDF e EPUB; revisão editorial humana da importação pendente**.

## Restrições obrigatórias

1. Não transformar Bones ou Custode em páginas de leitura internas. Permanecem **sites próprios**, acessados por URL pública real.
2. Não inventar metadados, nomes de autoras, capas oficiais ou URLs. Use `null` para dados ainda desconhecidos.
3. Não alterar sinopse, títulos de capítulos ou notas da Vique. Qualquer conversão futura requer preservação rigorosa da obra.
4. Cadastro somente de fics enviadas pelas autoras. O app não faz scraping do AO3.
5. A source of truth é `src/content/works.json`; alterações em fanfics passam pelo validador.
6. Componentes isolados em pastas com `index.tsx`, `styles.module.scss`, `props.ts` e `constants.ts` quando necessário. Não substituir SCSS Modules por styled-components sem orientação.
7. Criar branches de feature; commits manuais conforme `type(subject): context message`. Não executar commit automaticamente.
8. Evitar dependência externa desnecessária, não introduzir backend nas Fases 1 e 2.
9. Respeitar o padrão de URLs reais em `.env.local`, não versionar esse arquivo.
10. Testar `npm run check:catalog`, `npm test`, `npm run typecheck`, `npm run build` após instalar dependências.
11. Manter textos em `src/content/chapters/<work.id>/<chapter.id>.json`, com carregamento dinâmico. `works.json` continua sendo a fonte do índice e dos metadados.
12. Nunca habilitar capítulos vazios ou dados sintéticos. Validar arquivos importados; `segments` deve preservar exatamente `text`. Não usar `dangerouslySetInnerHTML`.
13. Preservar notas antes/depois e avisos. O aviso de homofobia familiar do capítulo 14 permanece no catálogo e no leitor.
14. `sources/` é material local ignorado pelo Git: não copiar PDF para `public/` nem para o build. O PDF fornecido pela usuária foi distribuído em 14 capítulos. Relatório e hashes em `docs/IMPORTACAO-MORTE-A-LINGUAGEM.json`; procedimento em `docs/IMPORTACAO-MORTE-A-LINGUAGEM.md`.
15. Preferências via localStorage afetam somente o leitor. Por solicitação explícita da Fase 2.1, há progresso de rolagem e marcação manual, reversível e local de capítulos lidos. Não marcar automaticamente. Favoritos, retomada da posição, PWA, IndexedDB e sincronização ficam para a Fase 3.
16. Preservar o design do catálogo e os ícones Fingerprint (Bones), Clover (Custode) e Feather (Morte à Linguagem).
17. Refinamentos do piloto usam manifestos em `src/content/presentation/`, com intervalos de IDs. Não reescrever os JSONs importados nem seus hashes para aplicar apresentação visual. O validador deve reconstruir os blocos originais sem perda ou mudança de ordem.
18. Nesta entrega, por instrução da usuária, não inicializar Git, criar branch, fazer commit, push ou deploy. Não iniciar a Fase 3.
19. Por autorização da usuária, downloads são habilitados por padrão em obras com `reading.mode: internal` e `editorial.submittedByAuthor: true`, mesmo sem configuração `downloads`. Preservar `downloads.enabled: false` como desativação explícita. Morte à Linguagem e No verde dos seus olhos estão autorizadas. Nunca exportar obras externas.
20. PDF e EPUB usam `services/export/` e o mesmo carregador/manifestos do leitor. Não usar DOM, screenshots ou o PDF original como fonte. Falhas em capítulos publicados, recursos ou tipos de blocos devem impedir a exportação, sem omissões silenciosas.
21. Geradores são importados sob demanda em Web Worker; conteúdo, fontes e imagens permanecem locais. Não enviar a serviços de conversão. Ao ampliar ChapterBlock, atualizar transformação, renderizadores e testes de exportação.

## Próximos passos

Prioridade: revisão editorial humana da disposição dos parágrafos dos 14 capítulos, sem alterar a obra; obter links reais externos e homologar leitura em dispositivos físicos. O conteúdo já está disponível, com glifos e formatação recuperável conferidos automaticamente. `contentReady` permanece false até a revisão editorial; não apagar ou substituir os capítulos. Contrato em `docs/ARQUITETURA.md`; andamento em `docs/ROADMAP.md`.
