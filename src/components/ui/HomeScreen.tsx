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

        <div className={styles.actions}>
          <Link to="/sim" className={styles.cta}>
            Abrir simulador
          </Link>
          <Link to="/ar" className={styles.ctaGhost}>
            Iniciar leitura do campo (AR)
          </Link>
        </div>

        <p className={styles.note}>
          O simulador funciona em qualquer navegador, sem camera. O modo AR
          roda no celular e precisa de um marcador impresso.
        </p>
      </div>
    </main>
  );
}
