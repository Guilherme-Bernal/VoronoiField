import styles from "./Legend.module.css";
import { LEGEND_ITEMS } from "./legendItems";

interface Props {
  /** "overlay" flutua sobre a câmera (AR); "inline" cabe num painel. */
  variant?: "overlay" | "inline";
  defaultOpen?: boolean;
}

/** Explica o que cada cor e linha da análise tática significa. */
export function Legend({ variant = "inline", defaultOpen = false }: Props) {
  return (
    <details
      className={`${styles.legend} ${variant === "overlay" ? styles.overlay : ""}`}
      open={defaultOpen}
    >
      <summary className={styles.summary}>Como ler esta tela</summary>
      <ul className={styles.list}>
        {LEGEND_ITEMS.map((item) => (
          <li key={item.title} className={styles.item}>
            <span className={styles.swatches} aria-hidden="true">
              {item.swatch.map((s) => (
                <span key={s} className={`${styles.sw} ${styles[s]}`} />
              ))}
            </span>
            <span>
              <strong className={styles.title}>{item.title}</strong>
              <span className={styles.text}>{item.text}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className={styles.note}>
        O modelo usa só as posições dos jogadores: não considera velocidade, direção do
        corpo nem habilidade. O botão Jogar move todos numa sequência automática simples
        e recalcula tudo a cada passo.
      </p>
    </details>
  );
}
