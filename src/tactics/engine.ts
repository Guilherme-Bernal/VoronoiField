import { Delaunay } from "d3-delaunay";

export type Team = "A" | "B";

export interface Player {
  id: string;
  team: Team;
  x: number;
  y: number;
}

export interface VoronoiZone {
  id: string;
  team: Team;
  polygon: number[][];
}

export interface PassingLine {
  from: string;
  to: string;
  blocked: boolean;
}

export function computeVoronoiZones(
  players: Player[],
  bbox: [number, number, number, number] = [0, 0, 1, 1]
): VoronoiZone[] {
  const points: [number, number][] = players.map((p) => [p.x, p.y]);
  const delaunay = Delaunay.from(points);
  const voronoi = delaunay.voronoi(bbox);

  return players.map((p, i) => ({
    id: p.id,
    team: p.team,
    polygon: voronoi.cellPolygon(i) ?? [],
  }));
}

export function computePassingLines(
  players: Player[],
  interceptRadius = 0.06,
  maxDistance = Infinity
): PassingLine[] {
  const lines: PassingLine[] = [];

  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const a = players[i];
      const b = players[j];
      if (a.team !== b.team) continue;
      if (Math.hypot(a.x - b.x, a.y - b.y) > maxDistance) continue;

      const opponents = players.filter((p) => p.team !== a.team);
      const blocked = opponents.some((o) =>
        isNearSegment(o, a, b, interceptRadius)
      );

      lines.push({ from: a.id, to: b.id, blocked });
    }
  }

  return lines;
}

function isNearSegment(
  o: Player,
  a: Player,
  b: Player,
  radius: number
): boolean {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const lenSq = abx * abx + aby * aby;
  if (lenSq === 0) return false;

  let t = ((o.x - a.x) * abx + (o.y - a.y) * aby) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projX = a.x + t * abx;
  const projY = a.y + t * aby;
  const dist = Math.hypot(o.x - projX, o.y - projY);

  return dist < radius && t > 0.05 && t < 0.95;
}

export function demoPlayers(): Player[] {
  return [
    { id: "A1", team: "A", x: 0.15, y: 0.5 },
    { id: "A2", team: "A", x: 0.35, y: 0.25 },
    { id: "A3", team: "A", x: 0.35, y: 0.75 },
    { id: "A4", team: "A", x: 0.5, y: 0.5 },
    { id: "B1", team: "B", x: 0.85, y: 0.5 },
    { id: "B2", team: "B", x: 0.65, y: 0.25 },
    { id: "B3", team: "B", x: 0.65, y: 0.75 },
    { id: "B4", team: "B", x: 0.5, y: 0.15 },
  ];
}


export function polygonArea(polygon: number[][]): number {
  let sum = 0;
  for (let i = 0; i < polygon.length; i++) {
    const [x1, y1] = polygon[i];
    const [x2, y2] = polygon[(i + 1) % polygon.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

export interface TeamControl {
  A: number;
  B: number;
}

/** Fracao (0..1) do campo dominada por cada time, somando as zonas de Voronoi. */
export function computeTeamControl(zones: VoronoiZone[]): TeamControl {
  const totals = { A: 0, B: 0 };
  zones.forEach((zone) => {
    totals[zone.team] += polygonArea(zone.polygon);
  });
  const all = totals.A + totals.B;
  if (all === 0) return { A: 0.5, B: 0.5 };
  return { A: totals.A / all, B: totals.B / all };
}

/* ------------------------------------------------------------------ */
/* Impedimento e melhor passe                                          */
/* ------------------------------------------------------------------ */

/** Direcao de ataque no eixo X: o time A ataca para a direita, o B para a esquerda. */
export function attackDirection(team: Team): 1 | -1 {
  return team === "A" ? 1 : -1;
}

export interface OffsideInfo {
  /** Time que esta com a bola (atacando). */
  team: Team;
  /** Posicao X (0..1) da linha de impedimento. */
  x: number;
  /** Atacantes em posicao irregular. */
  offsideIds: string[];
}

/**
 * Linha de impedimento: penultimo defensor ou a bola, o que estiver mais
 * adiantado. So ha impedimento na metade de campo adversaria.
 */
export function computeOffside(
  players: Player[],
  carrierId: string | null | undefined
): OffsideInfo | null {
  const carrier = players.find((p) => p.id === carrierId);
  if (!carrier) return null;
  const dir = attackDirection(carrier.team);

  const defenders = players
    .filter((p) => p.team !== carrier.team)
    .sort((a, b) => (b.x - a.x) * dir);
  if (defenders.length < 2) return null;

  const secondLast = defenders[1].x;
  const x = dir === 1 ? Math.max(secondLast, carrier.x) : Math.min(secondLast, carrier.x);

  const offsideIds = players
    .filter(
      (p) =>
        p.team === carrier.team &&
        p.id !== carrier.id &&
        (p.x - x) * dir > 0.005 &&
        (p.x - 0.5) * dir > 0
    )
    .map((p) => p.id);

  return { team: carrier.team, x, offsideIds };
}

export interface BestPass {
  from: string;
  to: string;
  score: number;
}

export interface BestPassOptions {
  maxDistance?: number;
  interceptRadius?: number;
  /** Ignora receptores em impedimento. */
  offside?: boolean;
}

function distanceToSegment(o: Player, a: Player, b: Player): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const lenSq = abx * abx + aby * aby;
  if (lenSq === 0) return Math.hypot(o.x - a.x, o.y - a.y);
  const t = Math.max(
    0,
    Math.min(1, ((o.x - a.x) * abx + (o.y - a.y) * aby) / lenSq)
  );
  return Math.hypot(o.x - (a.x + t * abx), o.y - (a.y + t * aby));
}

/**
 * Melhor passe do portador da bola: entre os passes livres (sem adversario no
 * caminho), pondera folga na linha de passe, espaco do receptor, ganho de
 * campo e distancia curta.
 */
export function computeBestPass(
  players: Player[],
  carrierId: string | null | undefined,
  options: BestPassOptions = {}
): BestPass | null {
  const { maxDistance = 0.4, interceptRadius = 0.06, offside = true } = options;
  const carrier = players.find((p) => p.id === carrierId);
  if (!carrier) return null;

  const dir = attackDirection(carrier.team);
  const opponents = players.filter((p) => p.team !== carrier.team);
  const offsideIds = new Set(
    offside ? (computeOffside(players, carrierId)?.offsideIds ?? []) : []
  );

  let best: BestPass | null = null;

  for (const mate of players) {
    if (mate.team !== carrier.team || mate.id === carrier.id) continue;
    if (offsideIds.has(mate.id)) continue;

    const dist = Math.hypot(mate.x - carrier.x, mate.y - carrier.y);
    if (dist === 0 || dist > maxDistance) continue;
    if (opponents.some((o) => isNearSegment(o, carrier, mate, interceptRadius))) {
      continue;
    }

    const clearance = Math.min(
      1,
      Math.min(...opponents.map((o) => distanceToSegment(o, carrier, mate)), 0.15) /
        0.15
    );
    const space = Math.min(
      1,
      Math.min(...opponents.map((o) => Math.hypot(o.x - mate.x, o.y - mate.y)), 0.2) /
        0.2
    );
    const forward = Math.max(-1, Math.min(1, ((mate.x - carrier.x) * dir) / 0.3));
    const short = 1 - dist / maxDistance;

    const score = 0.35 * clearance + 0.3 * space + 0.25 * forward + 0.1 * short;
    if (!best || score > best.score) {
      best = { from: carrier.id, to: mate.id, score };
    }
  }

  return best;
}
