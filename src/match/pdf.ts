import { computeVoronoiZones } from "../tactics/engine";
import {
  PITCH_LENGTH_M,
  PITCH_WIDTH_M,
  displayName,
  rolesFor,
  type MatchSheet,
  type TeamSheet,
} from "./lineup";
import { computeMatchStats, type TeamStat } from "./stats";

const BLUE: [number, number, number] = [47, 111, 237];
const RED: [number, number, number] = [224, 72, 62];
const INK: [number, number, number] = [13, 36, 25];
const GRASS: [number, number, number] = [22, 78, 50];

function fileSlug(match: MatchSheet): string {
  const s = `${match.home.name}-x-${match.away.name}`
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return s || "partida";
}

/** Gera o PDF da leitura de campo (2 paginas A4) e baixa no navegador. */
export async function exportReportPdf(match: MatchSheet): Promise<void> {
  const { jsPDF, GState } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const stats = computeMatchStats(match);
  const zones = computeVoronoiZones(stats.players);
  const W = 210;
  const M = 14;

  const text = (
    s: string,
    x: number,
    y: number,
    size: number,
    opts: { bold?: boolean; color?: [number, number, number]; align?: "left" | "center" | "right" } = {}
  ) => {
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...(opts.color ?? INK));
    doc.text(s, x, y, { align: opts.align ?? "left" });
  };

  /* ---------- Pagina 1 ---------- */
  doc.setFillColor(...INK);
  doc.rect(0, 0, W, 34, "F");
  text("LEITURA DE CAMPO", M, 15, 20, { bold: true, color: [244, 247, 243] });
  const sub = [match.competition, match.venue, match.date].filter((s) => s.trim()).join("  |  ");
  text(sub || "VoronoiField - analise tatica por dominio de espaco", M, 23, 10, {
    color: [200, 210, 203],
  });
  text(`${match.home.name}  x  ${match.away.name}`, M, 30, 11, { bold: true, color: [242, 183, 5] });

  // placar de dominio
  const pa = Math.round(stats.A.control * 100);
  const pb = 100 - pa;
  text(`${pa}%`, M, 48, 26, { bold: true, color: BLUE });
  text(`${pb}%`, W - M, 48, 26, { bold: true, color: RED, align: "right" });
  text("dominio de espaco", W / 2, 46, 10, { align: "center" });
  const barW = W - 2 * M;
  doc.setFillColor(...BLUE);
  doc.rect(M, 52, (barW * pa) / 100, 3.2, "F");
  doc.setFillColor(...RED);
  doc.rect(M + (barW * pa) / 100, 52, (barW * pb) / 100, 3.2, "F");

  // campo
  const px = M;
  const py = 62;
  const pw = W - 2 * M;
  const ph = (pw * PITCH_WIDTH_M) / PITCH_LENGTH_M;
  doc.setFillColor(...GRASS);
  doc.rect(px, py, pw, ph, "F");
  const sx = (x: number) => px + x * pw;
  const sy = (y: number) => py + y * ph;

  doc.saveGraphicsState();
  doc.setGState(new GState({ opacity: 0.42 }));
  zones.forEach((z) => {
    if (z.polygon.length < 3) return;
    const pts = z.polygon.slice(0, z.polygon.length - 1);
    doc.setFillColor(...(z.team === "A" ? BLUE : RED));
    const segs: number[][] = [];
    for (let i = 1; i < pts.length; i++) {
      segs.push([sx(pts[i][0]) - sx(pts[i - 1][0]), sy(pts[i][1]) - sy(pts[i - 1][1])]);
    }
    doc.lines(segs, sx(pts[0][0]), sy(pts[0][1]), [1, 1], "F", true);
  });
  doc.restoreGraphicsState();

  doc.setDrawColor(244, 247, 243);
  doc.setLineWidth(0.4);
  doc.rect(px, py, pw, ph, "S");
  doc.line(sx(0.5), py, sx(0.5), py + ph);
  doc.circle(sx(0.5), sy(0.5), (9.15 / PITCH_LENGTH_M) * pw, "S");
  const boxW = (16.5 / PITCH_LENGTH_M) * pw;
  const boxH = (40.3 / PITCH_WIDTH_M) * ph;
  doc.rect(px, sy(0.5) - boxH / 2, boxW, boxH, "S");
  doc.rect(px + pw - boxW, sy(0.5) - boxH / 2, boxW, boxH, "S");

  stats.players.forEach((p) => {
    doc.setFillColor(...(p.team === "A" ? BLUE : RED));
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.circle(sx(p.x), sy(p.y), 3.1, "FD");
    const sheet = p.team === "A" ? match.home : match.away;
    const idx = Number(p.id.slice(1)) - 1;
    text(String(sheet.squad[idx].number), sx(p.x), sy(p.y) + 1.1, 7, {
      bold: true,
      color: [255, 255, 255],
      align: "center",
    });
  });
  text(`${match.home.name} ataca ->`, px + 2, py + ph + 5, 8, { color: BLUE, bold: true });
  text(`<- ${match.away.name} ataca`, px + pw - 2, py + ph + 5, 8, { color: RED, bold: true, align: "right" });

  // comparativo
  let y = py + ph + 14;
  text("Comparativo", M, y, 13, { bold: true });
  y += 3;
  const rows: [string, (t: TeamStat) => number, string, number][] = [
    ["Dominio de espaco", (t) => t.control * 100, "%", 0],
    ["Largura (jogadores de linha)", (t) => t.widthM, " m", 1],
    ["Profundidade", (t) => t.depthM, " m", 1],
    ["Altura da linha defensiva", (t) => t.defLineM, " m", 1],
    ["Area do bloco (casco convexo)", (t) => t.hullM2, " m2", 0],
    ["Zona media por jogador", (t) => t.avgZoneM2, " m2", 0],
  ];
  rows.forEach(([label, get, unit, dec]) => {
    y += 8.2;
    const a = get(stats.A);
    const b = get(stats.B);
    text(`${a.toFixed(dec)}${unit}`, M, y, 10, { bold: true, color: BLUE });
    text(label, W / 2, y, 9.5, { align: "center" });
    text(`${b.toFixed(dec)}${unit}`, W - M, y, 10, { bold: true, color: RED, align: "right" });
    const tot = a + b || 1;
    doc.setFillColor(...BLUE);
    doc.rect(M, y + 1.6, ((barW * a) / tot) - 0.4, 1.6, "F");
    doc.setFillColor(...RED);
    doc.rect(M + (barW * a) / tot + 0.4, y + 1.6, (barW * b) / tot - 0.4, 1.6, "F");
  });

  /* ---------- Pagina 2 ---------- */
  doc.addPage();
  text("ESCALACOES E ZONAS", M, 18, 16, { bold: true });

  const drawTeam = (sheet: TeamSheet, st: TeamStat, color: [number, number, number], top: number) => {
    doc.setFillColor(...color);
    doc.rect(M, top, W - 2 * M, 8, "F");
    text(`${sheet.name}  -  ${sheet.formation}`, M + 3, top + 5.6, 11, {
      bold: true,
      color: [255, 255, 255],
    });
    if (sheet.coach.trim()) {
      text(`Tecnico: ${sheet.coach}`, W - M - 3, top + 5.6, 9, { color: [255, 255, 255], align: "right" });
    }
    let yy = top + 14;
    text("N", M + 2, yy, 8, { bold: true });
    text("Jogador", M + 14, yy, 8, { bold: true });
    text("Pos.", M + 88, yy, 8, { bold: true });
    text("Zona (m2)", M + 118, yy, 8, { bold: true, align: "right" });
    text("% do campo", M + 150, yy, 8, { bold: true, align: "right" });
    doc.setDrawColor(180, 190, 184);
    doc.setLineWidth(0.2);
    doc.line(M, yy + 1.8, W - M, yy + 1.8);
    const roles = rolesFor(sheet.formation);
    sheet.squad.forEach((m, i) => {
      yy += 6.1;
      const ps = st.players[i];
      const mark = ps.id === st.freest.id ? "  (mais livre)" : ps.id === st.tightest.id ? "  (mais marcado)" : "";
      text(String(m.number), M + 2, yy, 9.5, { bold: true, color });
      text(displayName(m) + mark, M + 14, yy, 9.5);
      text(roles[i], M + 88, yy, 9.5);
      text(ps.zoneM2.toFixed(0), M + 118, yy, 9.5, { align: "right" });
      text(`${(ps.zoneShare * 100).toFixed(1)}%`, M + 150, yy, 9.5, { align: "right" });
    });
    const bench = sheet.bench.split("\n").map((s) => s.trim()).filter(Boolean);
    if (bench.length) {
      yy += 7;
      text(`Reservas: ${bench.join(", ")}`.slice(0, 120), M + 2, yy, 8.5, { color: [90, 100, 94] });
    }
    return yy;
  };

  const end1 = drawTeam(match.home, stats.A, BLUE, 26);
  drawTeam(match.away, stats.B, RED, Math.max(end1 + 14, 150));

  // leitura em texto
  const lead = stats.A.control === stats.B.control ? null : stats.A.control > stats.B.control ? match.home : match.away;
  const leadStat = lead === match.home ? stats.A : stats.B;
  const summary = lead
    ? `${lead.name} ocupa mais espaco (${(leadStat.control * 100).toFixed(0)}% do campo). Dominio mede proximidade, nao posse de bola.`
    : "Os times ocupam o mesmo espaco. Dominio mede proximidade, nao posse de bola.";
  doc.setDrawColor(242, 183, 5);
  doc.setLineWidth(0.8);
  doc.line(M, 262, M, 272);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...INK);
  doc.text(doc.splitTextToSize(summary, W - 2 * M - 6), M + 3, 265.5);

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    text(`VoronoiField - voronoi-field.vercel.app   |   pagina ${i}/${total}`, W / 2, 289, 8, {
      color: [120, 130, 124],
      align: "center",
    });
  }

  doc.save(`leitura-${fileSlug(match)}.pdf`);
}