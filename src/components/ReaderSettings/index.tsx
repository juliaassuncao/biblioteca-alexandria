import { Coffee, Minus, Moon, Plus, Sun } from "lucide-react";
import { FONT_SIZE, LINE_HEIGHTS } from "../../services/reader-preferences";
import { LINE_OPTIONS, THEMES, WIDTH_OPTIONS } from "./constants";
import type { ReaderSettingsProps } from "./props";
import styles from "./styles.module.scss";

const themeIcons = { light: Sun, sepia: Coffee, dark: Moon };

export default function ReaderSettings({
  value,
  onChange,
}: ReaderSettingsProps) {
  const lineIndex = LINE_OPTIONS.findIndex(
    (option) => option.value === value.lineHeight,
  );
  return (
    <div className={styles.settings}>
      <fieldset>
        <legend>Tema</legend>
        <div className={styles.options}>
          {THEMES.map((option) => {
            const Icon = themeIcons[option.value];
            return (
              <button
                type="button"
                key={option.value}
                aria-label={`Tema ${option.label.toLowerCase()}`}
                aria-pressed={value.theme === option.value}
                onClick={() => onChange({ theme: option.value })}
              >
                <Icon size={16} aria-hidden="true" />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>
      <fieldset>
        <legend>Fonte</legend>
        <div className={styles.options}>
          <button
            type="button"
            className={styles.serif}
            aria-pressed={value.font === "serif"}
            onClick={() => onChange({ font: "serif" })}
            aria-label="Fonte serifada"
          >
            Aa
          </button>
          <button
            type="button"
            aria-pressed={value.font === "sans"}
            onClick={() => onChange({ font: "sans" })}
            aria-label="Fonte sem serifa"
          >
            Aa
          </button>
        </div>
      </fieldset>
      <fieldset>
        <legend>Tamanho</legend>
        <div className={styles.stepper}>
          <button
            type="button"
            aria-label="Diminuir fonte"
            disabled={value.fontSize <= FONT_SIZE.min}
            onClick={() =>
              onChange({ fontSize: value.fontSize - FONT_SIZE.step })
            }
          >
            <Minus size={16} aria-hidden="true" />
          </button>
          <output aria-live="polite" aria-label="Tamanho atual da fonte">
            {value.fontSize} <small>px</small>
          </output>
          <button
            type="button"
            aria-label="Aumentar fonte"
            disabled={value.fontSize >= FONT_SIZE.max}
            onClick={() =>
              onChange({ fontSize: value.fontSize + FONT_SIZE.step })
            }
          >
            <Plus size={16} aria-hidden="true" />
          </button>
        </div>
        <button
          className={styles.reset}
          type="button"
          onClick={() => onChange({ fontSize: FONT_SIZE.default })}
        >
          Restaurar tamanho padrão
        </button>
      </fieldset>
      <fieldset>
        <legend>Entrelinha</legend>
        <div className={styles.stepper}>
          <button
            type="button"
            aria-label="Diminuir entrelinha"
            disabled={lineIndex === 0}
            onClick={() =>
              onChange({
                lineHeight: LINE_OPTIONS[lineIndex - 1]?.value ?? "compact",
              })
            }
          >
            <Minus size={16} aria-hidden="true" />
          </button>
          <output aria-live="polite" aria-label="Entrelinha atual">
            {LINE_HEIGHTS[value.lineHeight]}
            <small>{LINE_OPTIONS[lineIndex]?.label}</small>
          </output>
          <button
            type="button"
            aria-label="Aumentar entrelinha"
            disabled={lineIndex === LINE_OPTIONS.length - 1}
            onClick={() =>
              onChange({
                lineHeight: LINE_OPTIONS[lineIndex + 1]?.value ?? "spacious",
              })
            }
          >
            <Plus size={16} aria-hidden="true" />
          </button>
        </div>
      </fieldset>
      <fieldset>
        <legend>Largura</legend>
        <div className={styles.options}>
          {WIDTH_OPTIONS.map((option) => (
            <button
              type="button"
              key={option.value}
              aria-pressed={value.width === option.value}
              onClick={() => onChange({ width: option.value })}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
