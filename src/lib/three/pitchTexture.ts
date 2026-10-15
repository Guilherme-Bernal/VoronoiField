import * as THREE from "three";

const PITCH_W = 105;
const PITCH_H = 68;

/**
 * Gramado listrado com as marcacoes de um campo de 105 x 68 m.
 * Com `square`, o desenho cabe num quadrado (campo do marcador de AR): as
 * medidas continuam proporcionais, mas circulos e arcos ficam redondos.
 * Com `night`, o verde e escuro e neutro: as cores dos times aparecem puras.
 */
export function makePitchTexture(
  scale = 20,
  square = false,
  night = false
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = PITCH_W * scale;
  canvas.height = (square ? PITCH_W : PITCH_H) * scale;
  const ctx = canvas.getContext("2d")!;
  const W = canvas.width;
  const H = canvas.height;

  const stripes = 15;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = night
      ? i % 2 === 0
        ? "#15302a"
        : "#112a24"
      : i % 2 === 0
        ? "#1f6a42"
        : "#1a5c39";
    ctx.fillRect((i * W) / stripes, 0, W / stripes + 1, H);
  }

  const mx = (v: number) => (v / PITCH_W) * W;
  const my = (v: number) => (v / PITCH_H) * H;
  const mr = (v: number) => (v / PITCH_H) * H; // raio sempre redondo
  ctx.strokeStyle = "rgba(244, 247, 243, 0.92)";
  ctx.fillStyle = "rgba(244, 247, 243, 0.92)";
  ctx.lineWidth = 0.18 * scale * 1.6;
  ctx.lineCap = "round";

  const line = (x1: number, y1: number, x2: number, y2: number) => {
    ctx.beginPath();
    ctx.moveTo(mx(x1), my(y1));
    ctx.lineTo(mx(x2), my(y2));
    ctx.stroke();
  };
  const rect = (x: number, y: number, w: number, h: number) =>
    ctx.strokeRect(mx(x), my(y), mx(w), my(h));
  const arc = (x: number, y: number, r: number, a0 = 0, a1 = Math.PI * 2) => {
    ctx.beginPath();
    ctx.arc(mx(x), my(y), mr(r), a0, a1);
    ctx.stroke();
  };
  const spot = (x: number, y: number) => {
    ctx.beginPath();
    ctx.arc(mx(x), my(y), mr(0.35), 0, Math.PI * 2);
    ctx.fill();
  };

  rect(0.3, 0.3, PITCH_W - 0.6, PITCH_H - 0.6);
  line(PITCH_W / 2, 0.3, PITCH_W / 2, PITCH_H - 0.3);
  arc(PITCH_W / 2, PITCH_H / 2, 9.15);
  spot(PITCH_W / 2, PITCH_H / 2);

  const boxY = (PITCH_H - 40.32) / 2;
  const goalY = (PITCH_H - 18.32) / 2;
  rect(0.3, boxY, 16.5, 40.32);
  rect(PITCH_W - 16.8, boxY, 16.5, 40.32);
  rect(0.3, goalY, 5.5, 18.32);
  rect(PITCH_W - 5.8, goalY, 5.5, 18.32);
  spot(11, PITCH_H / 2);
  spot(PITCH_W - 11, PITCH_H / 2);

  const a = Math.acos(5.5 / 9.15);
  arc(11, PITCH_H / 2, 9.15, -a, a);
  arc(PITCH_W - 11, PITCH_H / 2, 9.15, Math.PI - a, Math.PI + a);
  arc(0.3, 0.3, 1, 0, Math.PI / 2);
  arc(PITCH_W - 0.3, 0.3, 1, Math.PI / 2, Math.PI);
  arc(0.3, PITCH_H - 0.3, 1, -Math.PI / 2, 0);
  arc(PITCH_W - 0.3, PITCH_H - 0.3, 1, Math.PI, Math.PI * 1.5);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}
