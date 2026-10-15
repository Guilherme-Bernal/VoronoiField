import { Link } from "react-router-dom";
import styles from "./NotFound.module.css";

export function NotFound() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Página não encontrada</h1>
      <p className={styles.text}>O endereço não existe. Volte e escolha uma das telas abaixo.</p>
      <div className={styles.actions}>
        <Link to="/" className={styles.primary}>
          Ir para o início
        </Link>
        <Link to="/sim" className={styles.link}>
          Abrir simulador
        </Link>
      </div>
    </main>
  );
}
