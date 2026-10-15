import { useTacticalStore } from "../../state/tacticalStore";
import { useState } from "react";
import { copyText } from "../../lib/clipboard";
import { buildShareUrl } from "../../tactics/share";
import { Scoreboard } from "./Scoreboard";
import styles from "./HUD.module.css";

export function HUD() {
  const showZones = useTacticalStore((s) => s.showZones);
  const showPasses = useTacticalStore((s) => s.showPasses);
  const showOffside = useTacticalStore((s) => s.showOffside);
  const playing = useTacticalStore((s) => s.playing);
  const targetFound = useTacticalStore((s) => s.targetFound);
  const toggleZones = useTacticalStore((s) => s.toggleZones);
  const togglePasses = useTacticalStore((s) => s.togglePasses);
  const toggleOffside = useTacticalStore((s) => s.toggleOffside);
  const startPlay = useTacticalStore((s) => s.startPlay);
  const playSteps = useTacticalStore((s) => s.playSteps);
  const hasSteps = useTacticalStore((s) => s.steps.length >= 2);
  const stopPlay = useTacticalStore((s) => s.stopPlay);
  const resetFormation = useTacticalStore((s) => s.resetFormation);
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const { players, ballCarrierId, steps } = useTacticalStore.getState();
    const ok = await copyText(buildShareUrl("/ar", players, ballCarrierId, steps));
    setCopied(ok);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Scoreboard />
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
          <button
            type="button"
            className={`${styles.toggle} ${showOffside ? styles.toggleActive : ""}`}
            onClick={toggleOffside}
          >
            Impedimento
          </button>
          <button
            type="button"
            className={`${styles.toggle} ${playing ? styles.toggleActive : ""}`}
            onClick={playing ? stopPlay : hasSteps ? playSteps : startPlay}
          >
            {playing ? "Parar" : "Jogar"}
          </button>
          <button type="button" className={styles.reset} onClick={share}>
            {copied ? "Link copiado" : "Link"}
          </button>
          <button type="button" className={styles.reset} onClick={resetFormation}>
            Reiniciar
          </button>
        </div>
      </div>
    </>
  );
}
