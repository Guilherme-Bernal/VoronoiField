import QRCode from "qrcode";

export const CARD_W = 1080;
export const CARD_H = 1500;

export interface CardOptions {
  name: string;
  team: string;
  arUrl: string;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("imagem do marcador indisponível"));
    img.src = src;
  });
}

export function qrDataUrl(url: string, size = 240): Promise<string> {
  return QRCode.toDataURL(url, { width: size, margin: 1, errorCorrectionLevel: "M" });
}

/** Desenha o cartão (PNG) com o marcador intacto sobre fundo branco. */
export async function renderCard(opts: CardOptions): Promise<Blob> {
  const [marker, qr] = await Promise.all([
    loadImage("/markers/campo-marcador.png"),
    qrDataUrl(opts.arUrl, 300).then(loadImage),
  ]);
  const c = document.createElement("canvas");
  c.width = CARD_W;
  c.height = CARD_H;
  const g = c.getContext("2d");
  if (!g) throw new Error("canvas indisponível");

  g.fillStyle = "#081912";
  g.fillRect(0, 0, CARD_W, CARD_H);

  g.fillStyle = "#f4f7f3";
  g.textBaseline = "alphabetic";
  g.font = '700 84px "Big Shoulders Display", Impact, sans-serif';
  g.fillText("VORONOIFIELD", 60, 130);
  g.font = '400 30px "IBM Plex Sans", Arial, sans-serif';
  g.fillStyle = "rgba(244,247,243,0.7)";
  g.fillText("Cartão do campo · realidade aumentada", 60, 178);

  // painel branco com o marcador (sem alterar a imagem)
  const px = 60;
  const py = 220;
  const pw = CARD_W - 120;
  const ph = 760;
  g.fillStyle = "#ffffff";
  g.fillRect(px, py, pw, ph);
  const pad = 30;
  const scale = Math.min((pw - 2 * pad) / marker.width, (ph - 2 * pad) / marker.height);
  const mw = marker.width * scale;
  const mh = marker.height * scale;
  g.drawImage(marker, px + (pw - mw) / 2, py + (ph - mh) / 2, mw, mh);

  // QR + instruções
  const qy = py + ph + 50;
  g.fillStyle = "#ffffff";
  g.fillRect(60, qy, 300, 300);
  g.drawImage(qr, 60, qy, 300, 300);
  g.fillStyle = "#f2b705";
  g.font = '700 40px "IBM Plex Sans", Arial, sans-serif';
  g.fillText("Escaneie e aponte para o campo", 400, qy + 60);
  g.fillStyle = "rgba(244,247,243,0.85)";
  g.font = '400 30px "IBM Plex Sans", Arial, sans-serif';
  const lines = [
    "1. Abra o QR code no celular.",
    "2. Deixe o campo inteiro visível.",
    "3. Aponte a câmera e mova os jogadores.",
    "Papel fosco A4 ou tela com brilho alto.",
  ];
  lines.forEach((l, i) => g.fillText(l, 400, qy + 115 + i * 48));

  const name = opts.name.trim();
  const team = opts.team.trim();
  if (name || team) {
    g.fillStyle = "#f4f7f3";
    g.font = '700 56px "Big Shoulders Display", Impact, sans-serif';
    g.fillText(name.toUpperCase().slice(0, 28), 60, CARD_H - 70);
    g.font = '400 30px "IBM Plex Sans", Arial, sans-serif';
    g.fillStyle = "rgba(244,247,243,0.7)";
    g.fillText(team.slice(0, 40), 60, CARD_H - 28);
  }

  return new Promise((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new Error("falha ao gerar PNG"))), "image/png")
  );
}