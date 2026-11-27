import { describe, expect, it } from "vitest";
import { detectPlayers, type RawImage } from "../detectPlayers";
import { buildLineup, guessFormation, toField } from "../lineup";

type Dot = [number, number, [number, number, number]];

/** Foto sintetica: gramado listrado, linhas brancas finas, bolinhas e "nomes" finos. */
function fakePhoto(w: number, h: number, dots: Dot[], rad: number): RawImage {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const stripe = Math.floor(y / 30) % 2 ? 0 : 14;
      data[i] = 30;
      data[i + 1] = 120 + stripe;
      data[i + 2] = 50;
      data[i + 3] = 255;
    }
  }
  const set = (x: number, y: number, c: [number, number, number]) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = (y * w + x) * 4;
    data[i] = c[0];
    data[i + 1] = c[1];
    data[i + 2] = c[2];
  };
  for (let x = 0; x < w; x++) {
    set(x, Math.floor(h / 2), [255, 255, 255]);
    set(x, Math.floor(h / 2) + 1, [255, 255, 255]);
  }
  for (const [cx, cy, c] of dots) {
    const px = Math.round(cx * w);
    const py = Math.round(cy * h);
    for (let y = -rad; y <= rad; y++)
      for (let x = -rad; x <= rad; x++)
        if (x * x + y * y <= rad * rad) set(px + x, py + y, c);
    for (let x = -rad; x <= rad; x++) set(px + x, py + rad + 6, [255, 255, 255]); // nome (fino)
  }
  return { data, width: w, height: h };
}

// 4-3-3 em pe: goleiro embaixo (y grande), ataque para cima
const BLUE: [number, number, number] = [40, 80, 230];
const portrait: Dot[] = [
  [0.5, 0.9, BLUE],
  ...[0.2, 0.4, 0.6, 0.8].map((x): Dot => [x, 0.72, BLUE]),
  ...[0.3, 0.5, 0.7].map((x): Dot => [x, 0.5, BLUE]),
  ...[0.25, 0.5, 0.75].map((x): Dot => [x, 0.25, BLUE]),
];

describe("detectPlayers", () => {
  it("acha 11 jogadores e ignora linhas e nomes finos", () => {
    const d = detectPlayers(fakePhoto(360, 540, portrait, 11))!;
    expect(d.points).toHaveLength(11);
  });

  it("devolve null sem gramado", () => {
    const data = new Uint8ClampedArray(100 * 100 * 4).fill(40);
    expect(detectPlayers({ data, width: 100, height: 100 })).toBeNull();
  });
});

describe("lineup da foto", () => {
  it("reconhece o 4-3-3 e posiciona o goleiro como A1", () => {
    const d = detectPlayers(fakePhoto(360, 540, portrait, 11))!;
    const field = toField(d.points, { vertical: d.pitch.h > d.pitch.w, flip: false });
    expect(guessFormation("A", field)).toBe("4-3-3");
    const res = buildLineup(field, { side: "A", opponent: "4-4-2", snap: false });
    const gk = res.players.find((p) => p.id === "A1")!;
    expect(gk.x).toBeLessThan(0.1);
    expect(res.players.filter((p) => p.team === "A")).toHaveLength(11);
    expect(res.players.filter((p) => p.team === "B")).toHaveLength(11);
    expect(res.kind).toBe("um");
    // time unico fica na propria metade
    expect(Math.max(...res.players.filter((p) => p.team === "A").map((p) => p.x))).toBeLessThanOrEqual(0.5);
  });

  it("side B espelha o time para a direita", () => {
    const d = detectPlayers(fakePhoto(360, 540, portrait, 11))!;
    const field = toField(d.points, { vertical: true, flip: false });
    const res = buildLineup(field, { side: "B", opponent: "4-4-2", snap: false });
    expect(res.players.find((p) => p.id === "B1")!.x).toBeGreaterThan(0.9);
  });

  it("foto com dois times separa pela metade do campo", () => {
    const red: [number, number, number] = [230, 50, 40];
    const dots: Dot[] = [
      ...portrait.map(([x, y]): Dot => [x, y / 2 + 0.5, BLUE]),
      ...portrait.map(([x, y]): Dot => [x, 0.5 - y / 2, red]),
    ].filter(([, y]) => Math.abs(y - 0.5) > 0.03);
    const d = detectPlayers(fakePhoto(420, 900, dots, 10))!;
    const field = toField(d.points, { vertical: true, flip: false });
    const res = buildLineup(field, { side: "A", opponent: "4-4-2", snap: true });
    expect(res.kind).toBe("dois");
    expect(res.counts.A + res.counts.B).toBe(field.length);
  });

  it("snap arruma na formacao detectada", () => {
    const d = detectPlayers(fakePhoto(360, 540, portrait, 11))!;
    const field = toField(d.points, { vertical: true, flip: false });
    const res = buildLineup(field, { side: "A", opponent: "4-4-2", snap: true });
    expect(res.players.find((p) => p.id === "A1")!.x).toBeCloseTo(0.05, 5);
  });
});