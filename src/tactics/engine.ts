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
  interceptRadius = 0.06
): PassingLine[] {
  const lines: PassingLine[] = [];

  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const a = players[i];
      const b = players[j];
      if (a.team !== b.team) continue;

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
