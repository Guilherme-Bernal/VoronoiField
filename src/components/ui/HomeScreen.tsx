import { Link } from "react-router-dom";
import { Suspense, lazy } from "react";
import styles from "./HomeScreen.module.css";

const HeroScene = lazy(() => import("../three/HeroScene"));

export function HomeScreen() {
  return (
    <main className={styles.home}>
      <div className={styles.stage} aria-hidden="true">
        <Suspense fallback={null}>
          <HeroScene />
        </Suspense>
      </div>
      <div className={styles.shade} aria-hidden="true" />

      <div className={styles.content}>
        <h1 className={styles.title}>VoronoiField</h1>
        <p className={styles.lead}>
          Veja o jogo como um analista: quem controla cada pedaço do campo,
          quais passes estão livres e onde começa o impedimento. No simulador
          ou em realidade aumentada, sobre um campo impresso.
        </p>

        <div className={styles.actions}>
          <Link to="/sim" className={styles.cta}>
            Abrir simulador
          </Link>
          <Link to="/ar" className={styles.ctaGhost}>
            Ver em realidade aumentada
          </Link>
        </div>

        <ol className={styles.steps}>
          <li>
            <span>
              <Link to="/marcador">Abra o marcador</Link> numa tela ou imprima
            </span>
          </li>
          <li>
            <span>Aponte a câmera do celular para ele</span>
          </li>
          <li>
            <span>Toque num jogador para dar a bola, arraste para mover</span>
          </li>
        </ol>
      </div>
    </main>
  );
}
