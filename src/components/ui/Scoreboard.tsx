import { useMemo } from "react";
import { analyzeTactic } from "../../tactics/analysis";
import { useTacticalStore } from "../../state/tacticalStore";
import styles from "./Scoreboard.module.css";

/** Placar tatico do AR: dominio do campo, melhor passe e impedimento. */
export function Scoreboard() {
  const players = useTacticalStore((s) => s.players);
  const carrier = useTacticalStore((s) => s.ballCarrierId);
  const showOffside = useTacticalStore((s) => s.showOffside);

  const { control, bestPass, offside } = useMemo(
    () => analyzeTactic(players, carrier, showOffside),
    [players, carrier, showOffside]
  );

  const percentA = Math.round(control.A * 100);
  const percentB = 100 - percentA;
  const offsideIds = showOffside ? (offside?.offsideIds ?? []) : [];

  return (
    <aside className={styles.board} aria-label="Placar tático">
      <div
        className={styles.meter}
        role="img"
        aria-label={`Time azul ${percentA} por cento, time vermelho ${percentB} por cento`}
      >
        <div className={styles.meterA} style={{ width: `${percentA}%` }}>
          {percentA}%
        </div>
        <div className={styles.meterB} style={{ width: `${percentB}%` }}>
          {percentB}%
        </div>
      </div>
      <p className={styles.line}>
        <span className={styles.label}>Bola</span> {carrier ?? "-"}
      </p>
      <p className={styles.line}>
        <span className={styles.label}>Melhor passe</span>{" "}
        {bestPass ? `${bestPass.from} → ${bestPass.to}` : "nenhum livre"}
      </p>
      {showOffside && (
        <p className={styles.line}>
          <span className={styles.label}>Impedimento</span>{" "}
          {offsideIds.length ? offsideIds.join(", ") : "ninguém"}
        </p>
      )}
    </aside>
  );
}
