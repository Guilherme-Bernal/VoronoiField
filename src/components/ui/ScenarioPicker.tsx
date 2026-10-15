import { useState } from "react";
import { SCENARIOS } from "../../tactics/scenarios";
import { useTacticalStore } from "../../state/tacticalStore";
import { Collapsible } from "./Collapsible";
import styles from "./ScenarioPicker.module.css";

interface Props {
  variant?: "overlay" | "inline";
  defaultOpen?: boolean;
  group?: string;
}

/** Posições prontas para alterar: cada cenário responde a uma pergunta tática. */
export function ScenarioPicker({ variant = "inline", defaultOpen = false, group }: Props) {
  const applyScenario = useTacticalStore((s) => s.applyScenario);
  const [current, setCurrent] = useState<string | null>(null);
  const active = SCENARIOS.find((s) => s.id === current);

  return (
    <Collapsible
      title="Cenários prontos"
      variant={variant}
      defaultOpen={defaultOpen}
      group={group}
    >
      <ul className={styles.list}>
        {SCENARIOS.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              className={`${styles.item} ${s.id === current ? styles.active : ""}`}
              aria-pressed={s.id === current}
              onClick={() => {
                setCurrent(s.id);
                // O resultado compara o cenario com a posicao inicial padrao.
                applyScenario(s.build(), SCENARIOS[0].build());
              }}
            >
              <strong className={styles.name}>{s.name}</strong>
              <span className={styles.question}>{s.question}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className={styles.look} aria-live="polite">
        {active
          ? `O que observar: ${active.look}`
          : "Escolha um cenário e depois mova os jogadores para comparar com o ponto de partida."}
      </p>
    </Collapsible>
  );
}
