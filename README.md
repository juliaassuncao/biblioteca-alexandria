# Biblioteca de Alexandria — Loquinha 📚

Biblioteca comunitária de fanfics, criada em **React + TypeScript + Vite + SCSS Modules**.

> **Fase atual: 1 — Fundação.** Este ZIP inclui catálogo funcional, navegação, página de detalhes, índice real da fic piloto, buscas e filtros. O leitor de capítulos, salvamento local e modo offline ainda **não** estão implementados.

## 1. Como rodar

Requisitos: **Node.js 22.12+** e npm.

```bash
npm install
npm run check:catalog
npm test
npm run dev
```

Abra a URL local informada pelo Vite (geralmente `http://localhost:5173`).

Para checar o build:

```bash
npm run build
npm run preview
```

> Não incluí `node_modules` nem `package-lock.json` porque a instalação depende do ambiente de quem executar. Execute `npm install` uma vez e versione o lockfile criado.

## 2. Como ativar os links de Bones e Custode

Estes projetos **continuam independentes**. Seus URLs públicos não foram informados, então **não inventamos endereços**.

1. Copie `.env.example` para `.env.local`.
2. Insira a URL do **site próprio** de cada obra, por exemplo `VITE_BONES_URL=https://SEU_SITE_REAL`.
3. Reinicie `npm run dev`.

Quando a URL real estiver configurada, clicar no card leva **diretamente ao site da obra, em outra aba**. Sem URL, o card abre uma página de detalhes com o aviso de configuração pendente; nunca aparece um link quebrado.

Em produção na Vercel, cadastre as mesmas variáveis de ambiente e faça novo deploy.

## 3. O que foi cadastrado

- **Morte à Linguagem** (Vique / PerfectImmaculateBitch): sinopse original; 14 de 17 capítulos; títulos exatos; metadados e avisos; notas sinalizadas por capítulo. **Texto integral não incluído no ZIP da Fase 1**.
- **Bones** e **Custode**: registros `external`, sem copiar código ou capítulos; URLs próprios a configurar.
- As capas são **tipográficas e provisórias**. O PDF não contém uma capa oficial incorporada.

A referência de metadados foi o PDF enviado **Morte à Linguagem.pdf**, atualizado em 24/10/2026; detalhes em [docs/FONTES.md](docs/FONTES.md).

## 4. Estrutura

Veja [docs/ARQUITETURA.md](docs/ARQUITETURA.md), [docs/CADASTRO.md](docs/CADASTRO.md) e [docs/ROADMAP.md](docs/ROADMAP.md).

## 5. Padrões adotados

- Componentes com `index.tsx`, `styles.module.scss`, `props.ts` (quando necessário) e `constants.ts` (quando necessário).
- Uma fonte de dados: `src/content/works.json`, validada em `scripts/validate-catalog.mjs`.
- Navegação interna pela `slug`; conteúdo externo pela propriedade discriminante `reading.mode`.
- HTML semântico, responsividade e `prefers-reduced-motion`.
- Sem backend, contas, armazenamento offline ou dependência do AO3 em tempo de execução na Fase 1.
- Sem conteúdo duplicado dos projetos Bones e Custode.

## 6. Próximos passos sugeridos

1. Revisar visual e conteúdo do catálogo.
2. Trocar capas provisórias por artes oficiais recebidas das autoras.
3. Configurar os URLs reais de Bones e Custode.
4. Iniciar Fase 2: importar e renderizar capítulos e notas de Morte à Linguagem (sem alterar texto nem formatação autoral relevante).
