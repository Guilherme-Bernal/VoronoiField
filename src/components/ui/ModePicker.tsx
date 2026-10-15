import { useTacticalStore } from "../../state/tacticalStore";
import { Collapsible } from "./Collapsible";
import styles from "./ModePicker.module.css";

interface Props {
  variant?: "overlay" | "inline";
  group?: string;
}

/** Escolha do tamanho do jogo: 4x4 (limpo, bom no celular) ou 11x11 (campo completo). */
export function ModePicker({ variant = "inline", group }: Props) {
  const full = useTacticalStore((s) => s.players.length > 8);
  const resetFormation = useTacticalStore((s) => s.resetFormation);
  const loadMatch = useTacticalStore((s) => s.loadMatch);

  return (
    <Collapsible title={`Modo: ${full ? "11 x 11" : "4 x 4"}`} variant={variant} group={group}>
      <div className={styles.row} role="group" aria-label="Modo de jogo">
        <button
          type="button"
          className={`${styles.option} ${!full ? styles.active : ""}`}
          aria-pressed={!full}
          onClick={() => resetFormation()}
        >
          <strong>4 x 4</strong>
          <span>Poucos jogadores, leitura fácil</span>
        </button>
        <button
          type="button"
          className={`${styles.option} ${full ? styles.active : ""}`}
          aria-pressed={full}
          onClick={() => loadMatch("4-4-2", "4-3-3")}
        >
          <strong>11 x 11</strong>
          <span>Campo completo, 4-4-2 contra 4-3-3</span>
        </button>
      </div>
    </Collapsible>
  );
}
