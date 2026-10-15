import { useMemo } from "react";
import { compareTactics } from "../../tactics/result";
import { useTacticalStore } from "../../state/tacticalStore";
import { Collapsible } from "./Collapsible";
import styles from "./ResultPanel.module.css";

interface Props {
  variant?: "overlay" | "inline";
  defaultOpen?: boolean;
  group?: string;
}

/** Compara o ponto de partida com a situação atual e escreve a conclusão. */
export function ResultPanel({ variant = "inline", defaultOpen = false, group }: Props) {
  const players = useTacticalStore((s) => s.players);
  const ball = useTacticalStore((s) => s.ballCarrierId);
  const baseline = useTacticalStore((s) => s.baseline);
  const showOffside = useTacticalStore((s) => s.showOffside);
  const markBaseline = useTacticalStore((s) => s.markBaseline);

  const result = useMemo(
    () =>
      baseline ? compareTactics(baseline, { players, ball }, showOffside) : null,
    [baseline, players, ball, showOffside]
  );

  if (!result) return null;

  const tone =
    result.delta > 0 ? styles.up : result.delta < 0 ? styles.down : styles.flat;

  return (
    <Collapsible
      title="Resultado da jogada"
      variant={variant}
      defaultOpen={defaultOpen}
      group={group}
    >
      <div className={styles.top}>
        <span className={`${styles.delta} ${tone}`} aria-hidden="true">
          {result.delta > 0 ? "+" : result.delta < 0 ? "−" : ""}
          {Math.abs(result.delta)}
        </span>
        <p className={styles.headline}>{result.headline}</p>
      </div>
      {result.changed && (
        <ul className={styles.lines}>
          {result.lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      <button
        type="button"
        className={styles.reset}
        onClick={markBaseline}
        disabled={!result.changed}
      >
        Usar posição atual como ponto de partida
      </button>
    </Collapsible>
  );
}
