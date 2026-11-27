import {
  computeVoronoiZones,
  polygonArea,
  type Player,
  type Team,
} from "../tactics/engine";
import {
  PITCH_LENGTH_M,
  PITCH_WIDTH_M,
  buildPlayers,
  type MatchSheet,
} from "./lineup";

const M2 = PITCH_LENGTH_M * PITCH_WIDTH_M;

export interface PlayerStat {
  id: string;
  /** Area de Voronoi do jogador em m2. */
  zoneM2: number;
  /** Fatia do campo inteiro (0..1). */
  zoneShare: number;
}

export interface TeamStat {
  team: Team;
  /** Dominio de espaco (0..1) somando as zonas de Voronoi. */
  control: number;
  /** Largura ocupada pelos jogadores de linha, em metros. */
  widthM: number;
  /** Profundidade (do jogador de linha mais recuado ao mais avancado), em m. */
  depthM: number;
  /** Altura da linha defensiva: distancia do gol proprio ao penultimo jogador, em m. */
  defLineM: number;
  /** Area do casco convexo dos jogadores de linha, em m2 (menor = mais compacto). */
  hullM2: number;
  /** Centro de massa dos jogadores de linha, em metros (x = distancia do gol proprio). */
  centroid: { xM: number; yM: number };
  /** Zona media por jogador, em m2. */
  avgZoneM2: number;
  /** Jogador com maior zona (o mais livre). */
  freest: PlayerStat;
  /** Jogador com menor zona (o mais pressionado). */
  tightest: PlayerStat;
  players: PlayerStat[];
}

export interface MatchStats {
  A: TeamStat;
  B: TeamStat;
  players: Player[];
}

export function convexHullArea(points: [number, number][]): number {
  if (points.length < 3) return 0;
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: number[], a: number[], b: number[]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: [number, number][] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: [number, number][] = [];
  for (const p of [...pts].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return polygonArea([...lower, ...upper]);
}

function teamStat(team: Team, players: Player[], zoneById: Map<string, number>): TeamStat {
  const mine = players.filter((p) => p.team === team);
  const field = mine.filter((p) => p.id !== `${team}1`);
  // distancia ao gol proprio: A defende x=0, B defende x=1
  const own = (p: Player) => (team === "A" ? p.x : 1 - p.x);

  const stats: PlayerStat[] = mine.map((p) => {
    const a = zoneById.get(p.id) ?? 0;
    return { id: p.id, zoneM2: a * M2, zoneShare: a };
  });
  const total = stats.reduce((s, p) => s + p.zoneM2, 0);
  const all = (zoneById.size ? [...zoneById.values()].reduce((s, v) => s + v, 0) : 1) * M2;

  const ys = field.map((p) => p.y);
  const xs = field.map(own);
  const sortedOwn = mine.map(own).sort((a, b) => a - b);
  const byZone = [...stats].sort((a, b) => b.zoneM2 - a.zoneM2);

  return {
    team,
    control: all > 0 ? total / all : 0.5,
    widthM: (Math.max(...ys) - Math.min(...ys)) * PITCH_WIDTH_M,
    depthM: (Math.max(...xs) - Math.min(...xs)) * PITCH_LENGTH_M,
    defLineM: (sortedOwn[1] ?? 0) * PITCH_LENGTH_M,
    hullM2: convexHullArea(field.map((p) => [p.x * PITCH_LENGTH_M, p.y * PITCH_WIDTH_M])),
    centroid: {
      xM: (xs.reduce((s, v) => s + v, 0) / xs.length) * PITCH_LENGTH_M,
      yM: (ys.reduce((s, v) => s + v, 0) / ys.length) * PITCH_WIDTH_M,
    },
    avgZoneM2: total / stats.length,
    freest: byZone[0],
    tightest: byZone[byZone.length - 1],
    players: stats,
  };
}

/** Estatisticas de ocupacao de espaco calculadas pelo diagrama de Voronoi. */
export function computeMatchStats(match: MatchSheet): MatchStats {
  const players = buildPlayers(match);
  const zones = computeVoronoiZones(players);
  const zoneById = new Map(zones.map((z) => [z.id, polygonArea(z.polygon)]));
  return {
    A: teamStat("A", players, zoneById),
    B: teamStat("B", players, zoneById),
    players,
  };
}