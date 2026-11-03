import { useEffect, useState } from "react";
import ReaderPanel from "../ReaderPanel";
import ReaderSettings from "../ReaderSettings";
import type { ReaderSettingsPanelProps } from "./props";
import styles from "./styles.module.scss";

export default function ReaderSettingsPanel({
  open,
  onClose,
  value,
  onChange,
}: ReaderSettingsPanelProps) {
  const [wide, setWide] = useState(
    () => window.matchMedia("(min-width: 900px)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(min-width: 900px)");
    const update = () => setWide(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  if (!wide)
    return (
      <ReaderPanel
        id="reader-settings-panel"
        title="Ajustes de leitura"
        open={open}
        onClose={onClose}
      >
        <ReaderSettings value={value} onChange={onChange} />
      </ReaderPanel>
    );
  return (
    <section
      id="reader-settings-panel"
      className={styles.panel}
      hidden={!open}
      aria-label="Ajustes de leitura"
    >
      <ReaderSettings value={value} onChange={onChange} />
    </section>
  );
}
