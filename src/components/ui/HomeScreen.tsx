import { Link } from "react-router-dom";
import styles from "./HomeScreen.module.css";

export function HomeScreen() {
  return (
    <main className={styles.home}>
      <div className={styles.pitch} aria-hidden="true">
        <svg viewBox="0 0 200 200" className={styles.circle}>
          <circle cx="100" cy="100" r="72" />
          <line x1="100" y1="4" x2="100" y2="196" />
        </svg>
      </div>

      <div className={styles.content}>
        <p className={styles.kicker}>Analise tatica em realidade aumentada</p>
        <h1 className={styles.title}>VoronoiField</h1>
        <p className={styles.lead}>
          Aponte a camera para um campo impresso e veja a formacao, as
          zonas de pressao e as linhas de passe se atualizarem ao vivo,
          exatamente como no replay da transmissao.
        </p>

        <Link to="/ar" className={styles.cta}>
          Iniciar leitura do campo
        </Link>

        <p className={styles.note}>
          Funciona direto no navegador do celular, sem instalar nada.
          Precisa de um marcador impresso — veja o guia no repositorio.
        </p>
      </div>
    </main>
  );
}
