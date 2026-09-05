import styles from "./ScanFrame.module.css";

interface ScanFrameProps {
  visible: boolean;
}

export function ScanFrame({ visible }: ScanFrameProps) {
  if (!visible) return null;

  return (
    <div className={styles.frame} role="status" aria-live="polite">
      <span className={`${styles.corner} ${styles.cornerTl}`} />
      <span className={`${styles.corner} ${styles.cornerTr}`} />
      <span className={`${styles.corner} ${styles.cornerBl}`} />
      <span className={`${styles.corner} ${styles.cornerBr}`} />
      <span className={styles.sweep} />
      <p className={styles.label}>Aponte para o campo</p>
    </div>
  );
}
