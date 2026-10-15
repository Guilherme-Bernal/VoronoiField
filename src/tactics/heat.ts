import type { Team } from "./engine";

export type TrailPoint = [number, number];
export type Trails = Record<string, TrailPoint[]>;

export const HEAT_COLS = 28;
export const HEAT_ROWS = 18;

export interface Heatmap {
  cols: number;
  rows: number;
  /** Valores 0..1 por celula (linha a linha), um mapa por time. */
  A: number[];
  B: number[];
}

const teamOf = (id: string): Team => (id.startsWith("B") ? "B" : "A");

/**
 * Acumula onde cada time passou. Cada ponto do rastro espalha calor nas
 * celulas vizinhas (suavizado); no fim, cada mapa e normalizado para 0..1.
 */
export function buildHeatmap(
  trails: Trails,
  cols: number = HEAT_COLS,
  rows: number = HEAT_ROWS
): Heatmap {
  const maps: Record<Team, number[]> = {
    A: new Array(cols * rows).fill(0),
    B: new Array(cols * rows).fill(0),
  };

  for (const [id, points] of Object.entries(trails)) {
    const grid = maps[teamOf(id)];
    for (const [x, y] of points) {
      const cx = x * cols - 0.5;
      const cy = y * rows - 0.5;
      const x0 = Math.floor(cx);
      const y0 = Math.floor(cy);
      for (let dy = -1; dy <= 2; dy++) {
        for (let dx = -1; dx <= 2; dx++) {
          const gx = x0 + dx;
          const gy = y0 + dy;
          if (gx < 0 || gy < 0 || gx >= cols || gy >= rows) continue;
          const d2 = (gx - cx) ** 2 + (gy - cy) ** 2;
          grid[gy * cols + gx] += Math.exp(-d2 / 1.4);
        }
      }
    }
  }

  (["A", "B"] as const).forEach((team) => {
    const grid = maps[team];
    const max = Math.max(...grid, 0);
    if (max > 0) for (let i = 0; i < grid.length; i++) grid[i] /= max;
  });

  return { cols, rows, A: maps.A, B: maps.B };
}

export const TEAM_RGB: Record<Team, [number, number, number]> = {
  A: [47, 111, 237],
  B: [224, 72, 62],
};

/** Pinta o mapa de calor num canvas (usado como textura no 3D). */
export function drawHeatmap(canvas: HTMLCanvasElement, heat: Heatmap) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { cols, rows } = heat;
  const small = document.createElement("canvas");
  small.width = cols;
  small.height = rows;
  const sctx = small.getContext("2d");
  if (!sctx) return;
  const image = sctx.createImageData(cols, rows);
  for (let i = 0; i < cols * rows; i++) {
    const a = heat.A[i];
    const b = heat.B[i];
    const total = a + b;
    const o = i * 4;
    if (total < 0.02) {
      image.data[o + 3] = 0;
      continue;
    }
    const [ar, ag, ab] = TEAM_RGB.A;
    const [br, bg, bb] = TEAM_RGB.B;
    image.data[o] = (ar * a + br * b) / total;
    image.data[o + 1] = (ag * a + bg * b) / total;
    image.data[o + 2] = (ab * a + bb * b) / total;
    image.data[o + 3] = Math.min(1, Math.max(a, b) * 0.85) * 255;
  }
  sctx.putImageData(image, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(small, 0, 0, canvas.width, canvas.height);
}
