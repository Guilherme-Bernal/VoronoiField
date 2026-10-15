import { Legend } from "./Legend";
import { ResultPanel } from "./ResultPanel";
import { ScenarioPicker } from "./ScenarioPicker";
import styles from "./ARPanels.module.css";

/** Pilha de painéis do AR: cenários, resultado e legenda (abre um de cada vez). */
export function ARPanels() {
  return (
    <div className={styles.stack}>
      <ScenarioPicker variant="overlay" group="ar-panel" />
      <ResultPanel variant="overlay" group="ar-panel" />
      <Legend variant="overlay" group="ar-panel" />
    </div>
  );
}
