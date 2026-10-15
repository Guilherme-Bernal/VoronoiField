import type { ReactNode } from "react";
import styles from "./Collapsible.module.css";

interface Props {
  title: string;
  /** "overlay" flutua sobre a câmera (AR); "inline" cabe num painel. */
  variant?: "overlay" | "inline";
  defaultOpen?: boolean;
  /** Painéis com o mesmo grupo abrem um de cada vez (navegadores recentes). */
  group?: string;
  children: ReactNode;
}

/** Painel recolhível acessível (details/summary) usado na legenda, no resultado e nos cenários. */
export function Collapsible({
  title,
  variant = "inline",
  defaultOpen = false,
  group,
  children,
}: Props) {
  return (
    <details
      className={`${styles.panel} ${variant === "overlay" ? styles.overlay : ""}`}
      open={defaultOpen}
      name={group}
    >
      <summary className={styles.summary}>{title}</summary>
      <div className={styles.body}>{children}</div>
    </details>
  );
}
