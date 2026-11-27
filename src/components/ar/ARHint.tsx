import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import styles from "./ARHint.module.css";

const KEY = "voronoifield.arHintSeen";

function alreadySeen(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/** Instruções curtas na primeira vez que o AR abre. */
export function ARHint() {
  const [params] = useSearchParams();
  // Quem chega pelo guia (?tour=1) já recebe as instruções lá.
  const [open, setOpen] = useState(() => !alreadySeen() && params.get("tour") !== "1");
  if (!open) return null;

  const close = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* sem armazenamento: o aviso volta na próxima visita */
    }
    setOpen(false);
  };

  return (
    <div className={styles.card} role="dialog" aria-label="Como usar o AR">
      <h2 className={styles.title}>Como usar</h2>
      <ol className={styles.list}>
        <li>
          Abra o <Link to="/marcador">marcador</Link> em outra tela ou imprima.
        </li>
        <li>Aponte a câmera até o campo ser detectado.</li>
        <li>Toque num jogador para dar a bola. Arraste para mover.</li>
      </ol>
      <button type="button" className={styles.button} onClick={close}>
        Entendi
      </button>
    </div>
  );
}
