import { Link } from "react-router-dom";
import styles from "./MarkerPage.module.css";

/** Mostra o marcador em tela cheia para apontar a câmera, ou para imprimir. */
export function MarkerPage() {
  return (
    <main className={styles.page}>
      <header className={styles.bar}>
        <Link to="/" className={styles.link}>
          ← Início
        </Link>
        <div className={styles.actions}>
          <button type="button" className={styles.print} onClick={() => window.print()}>
            Imprimir
          </button>
          <Link to="/ar" className={styles.link}>
            Abrir AR
          </Link>
        </div>
      </header>
      <div className={styles.sheet}>
        <img
          className={styles.marker}
          src="/markers/campo-marcador.png"
          alt="Marcador do campo para o modo de realidade aumentada"
        />
      </div>
      <p className={styles.help}>
        Deixe a imagem inteira visível, com brilho alto, e aponte a câmera do
        celular para ela. Se imprimir, use papel fosco e tamanho A4.
      </p>
    </main>
  );
}
