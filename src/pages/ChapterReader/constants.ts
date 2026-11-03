export const READER_MESSAGES = {
  loading: { title: "Abrindo capítulo…", description: "Preparando a leitura." },
  "invalid-number": {
    title: "Número de capítulo inválido",
    description: "Escolha um número inteiro positivo no índice da obra.",
  },
  "not-found": {
    title: "Capítulo não encontrado",
    description:
      "Este capítulo não está entre os capítulos publicados da obra.",
  },
  external: {
    title: "Esta história tem seu próprio site",
    description:
      "A leitura está disponível exclusivamente na experiência original da obra.",
  },
  unavailable: {
    title: "Leitura ainda indisponível",
    description:
      "O texto deste capítulo ainda não foi disponibilizado na biblioteca. Consulte os capítulos no índice da obra.",
  },
  error: {
    title: "Não foi possível carregar o capítulo",
    description: "Tente novamente ou volte ao índice da obra.",
  },
} as const;
