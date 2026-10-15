import { createTeam, FORMATION_NAMES, type FormationName } from "../../tactics/formations";
import type { Team } from "../../tactics/engine";
import styles from "./FormationPicker.module.css";

interface Props {
  team: Team;
  label: string;
  value: FormationName;
  onChange: (value: FormationName) => void;
}

const W = 56;
const H = 36;

/** Escolha de formação com um mini-campo mostrando onde cada jogador fica. */
export function FormationPicker({ team, label, value, onChange }: Props) {
  return (
    <div className={styles.picker} role="radiogroup" aria-label={label}>
      <span className={styles.label}>
        <span className={team === "A" ? styles.swatchA : styles.swatchB} />
        {label}
      </span>
      <div className={styles.options}>
        {FORMATION_NAMES.map((name) => {
          const dots = createTeam(team, name);
          const active = name === value;
          return (
            <button
              key={name}
              type="button"
              role="radio"
              aria-checked={active}
              className={`${styles.option} ${active ? styles.optionActive : ""}`}
              onClick={() => onChange(name)}
            >
              <svg viewBox={`0 0 ${W} ${H}`} className={styles.mini} aria-hidden="true">
                <rect x="0.5" y="0.5" width={W - 1} height={H - 1} className={styles.mp} />
                <line x1={W / 2} y1="0.5" x2={W / 2} y2={H - 0.5} className={styles.mpLine} />
                {dots.map((p) => (
                  <circle
                    key={p.id}
                    cx={p.x * W}
                    cy={p.y * H}
                    r="2.1"
                    className={team === "A" ? styles.dotA : styles.dotB}
                  />
                ))}
              </svg>
              <span>{name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
