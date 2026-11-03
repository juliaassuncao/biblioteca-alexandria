import type { ReaderPreferences } from "../../services/reader-preferences";

export const THEMES: { value: ReaderPreferences["theme"]; label: string }[] = [
  { value: "light", label: "Claro" },
  { value: "sepia", label: "Sépia" },
  { value: "dark", label: "Escuro" },
];
export const LINE_OPTIONS: {
  value: ReaderPreferences["lineHeight"];
  label: string;
}[] = [
  { value: "compact", label: "Compacto" },
  { value: "comfortable", label: "Confortável" },
  { value: "spacious", label: "Amplo" },
];
export const WIDTH_OPTIONS: {
  value: ReaderPreferences["width"];
  label: string;
}[] = [
  { value: "narrow", label: "Estreita" },
  { value: "standard", label: "Padrão" },
  { value: "wide", label: "Ampla" },
];
