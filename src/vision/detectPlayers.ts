/** Imagem crua (RGBA), como a devolvida por `ctx.getImageData`. */
export interface RawImage {
  data: ArrayLike<number>;
  width: number;
  height: number;
}

export interface PitchRect {
  x0: number;
  y0: number;
  w: number;
  h: number;
}

export interface DetectedPoint {
  /** Posicao normalizada (0..1) dentro do campo, no sentido da imagem. */
  x: number;
  y: number;
}

export interface Detection {
  pitch: PitchRect;
  points: DetectedPoint[];
}

function isGreen(r: number, g: number, b: number): boolean {
  return g > r + 12 && g > b + 12;
}

/** Retangulo que contem o gramado: linhas e colunas com bastante verde. */
export function findPitchRect(img: RawImage): PitchRect | null {
  const { data, width, height } = img;
  const rows = new Uint32Array(height);
  const cols = new Uint32Array(width);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (isGreen(data[i], data[i + 1], data[i + 2])) {
        rows[y]++;
        cols[x]++;
      }
    }
  }
  const span = (arr: Uint32Array): [number, number] | null => {
    const max = arr.reduce((m, v) => Math.max(m, v), 0);
    if (max === 0) return null;
    const t = max * 0.3;
    let a = 0;
    let b = arr.length - 1;
    while (a < arr.length && arr[a] < t) a++;
    while (b > a && arr[b] < t) b--;
    return b > a ? [a, b] : null;
  };
  const sy = span(rows);
  const sx = span(cols);
  if (!sx || !sy) return null;
  const w = sx[1] - sx[0] + 1;
  const h = sy[1] - sy[0] + 1;
  if (w < width * 0.25 || h < height * 0.25) return null;
  return { x0: sx[0], y0: sy[0], w, h };
}

/** Erosao quadrada (raio r) separavel: apaga linhas e textos finos. */
function erode(mask: Uint8Array, w: number, h: number, r: number): Uint8Array {
  const tmp = new Uint8Array(w * h);
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    let run = 0;
    for (let x = 0; x < w; x++) {
      run = mask[y * w + x] ? run + 1 : 0;
      // pixel (x - r) so fica se os 2r+1 pixels ate x forem todos ligados
      if (run >= 2 * r + 1) tmp[y * w + (x - r)] = 1;
    }
  }
  for (let x = 0; x < w; x++) {
    let run = 0;
    for (let y = 0; y < h; y++) {
      run = tmp[y * w + x] ? run + 1 : 0;
      if (run >= 2 * r + 1) out[(y - r) * w + x] = 1;
    }
  }
  return out;
}

interface Blob {
  cx: number;
  cy: number;
  area: number;
  bw: number;
  bh: number;
}

function label(mask: Uint8Array, w: number, h: number): Blob[] {
  const seen = new Uint8Array(w * h);
  const blobs: Blob[] = [];
  const stack: number[] = [];
  for (let start = 0; start < w * h; start++) {
    if (!mask[start] || seen[start]) continue;
    let sx = 0;
    let sy = 0;
    let n = 0;
    let minX = w;
    let maxX = 0;
    let minY = h;
    let maxY = 0;
    stack.push(start);
    seen[start] = 1;
    while (stack.length) {
      const p = stack.pop()!;
      const x = p % w;
      const y = (p - x) / w;
      sx += x;
      sy += y;
      n++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (x > 0 && mask[p - 1] && !seen[p - 1]) {
        seen[p - 1] = 1;
        stack.push(p - 1);
      }
      if (x < w - 1 && mask[p + 1] && !seen[p + 1]) {
        seen[p + 1] = 1;
        stack.push(p + 1);
      }
      if (y > 0 && mask[p - w] && !seen[p - w]) {
        seen[p - w] = 1;
        stack.push(p - w);
      }
      if (y < h - 1 && mask[p + w] && !seen[p + w]) {
        seen[p + w] = 1;
        stack.push(p + w);
      }
    }
    blobs.push({ cx: sx / n, cy: sy / n, area: n, bw: maxX - minX + 1, bh: maxY - minY + 1 });
  }
  return blobs;
}

/**
 * Acha as "bolinhas" dos jogadores numa foto ou print de escalacao: tudo que
 * nao e verde dentro do gramado, depois de apagar linhas e textos finos.
 */
export function detectPlayers(img: RawImage): Detection | null {
  const pitch = findPitchRect(img);
  if (!pitch) return null;
  const { x0, y0, w, h } = pitch;

  const mask = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = ((y + y0) * img.width + (x + x0)) * 4;
      if (!isGreen(img.data[i], img.data[i + 1], img.data[i + 2])) mask[y * w + x] = 1;
    }
  }

  const r = Math.max(1, Math.round(Math.min(w, h) / 120));
  const blobs = label(erode(mask, w, h, r), w, h).filter(
    (b) =>
      b.area >= 0.0001 * w * h &&
      b.area <= 0.012 * w * h &&
      b.bw / b.bh > 0.5 &&
      b.bw / b.bh < 2
  );
  if (blobs.length === 0) return { pitch, points: [] };

  const sorted = blobs.map((b) => b.area).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  let kept = blobs.filter((b) => b.area >= median * 0.35 && b.area <= median * 2.8);
  if (kept.length > 22) {
    kept = kept
      .sort((a, b) => Math.abs(a.area - median) - Math.abs(b.area - median))
      .slice(0, 22);
  }
  return {
    pitch,
    points: kept.map((b) => ({ x: b.cx / w, y: b.cy / h })),
  };
}