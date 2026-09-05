import { useTacticalStore } from "../../state/tacticalStore";
import styles from "./HUD.module.css";

export function HUD() {
  const showZones = useTacticalStore((s) => s.showZones);
  const showPasses = useTacticalStore((s) => s.showPasses);
  const targetFound = useTacticalStore((s) => s.targetFound);
  const toggleZones = useTacticalStore((s) => s.toggleZones);
  const togglePasses = useTacticalStore((s) => s.togglePasses);
  const resetFormation = useTacticalStore((s) => s.resetFormation);

  return (
    <div className={styles.hud}>
      <div className={styles.status}>
        <span className={`${styles.dot} ${targetFound ? styles.dotLive : ""}`} />
        <span>{targetFound ? "Campo detectado" : "Procurando campo"}</span>
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={`${styles.toggle} ${showZones ? styles.toggleActive : ""}`}
          onClick={toggleZones}
        >
          Zonas
        </button>
        <button
          type="button"
          className={`${styles.toggle} ${showPasses ? styles.toggleActive : ""}`}
          onClick={togglePasses}
        >
          Passes
        </button>
        <button type="button" className={styles.reset} onClick={resetFormation}>
          Reiniciar
        </button>
      </div>
    </div>
  );
}
