let started = false;

/**
 * Baixa em segundo plano o codigo do AR (MindAR + TensorFlow, ~260 kB comprimido).
 * Chamado quando o usuario demonstra interesse (passa o mouse, toca, ou espera na
 * tela), assim a rota /ar abre sem esperar o download.
 */
export function prefetchAR() {
  if (started) return;
  started = true;
  const conn = (navigator as Navigator & {
    connection?: { saveData?: boolean };
  }).connection;
  if (conn?.saveData) {
    started = false;
    return;
  }
  void import("../components/ar/ARExperience").catch(() => {
    started = false;
  });
  void import("../vendor/mind-ar/mindar-image-three.prod.js").catch(() => {
    started = false;
  });
}
