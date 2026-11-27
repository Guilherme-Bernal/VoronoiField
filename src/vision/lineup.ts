import type { Player, Team } from "../tactics/engine";
import { createTeam, FORMATION_NAMES, type FormationName } from "../tactics/formations";
import type { DetectedPoint } from "./detectPlayers";

export interface PhotoOptions {
  /** O campo da foto esta em pe (golaço em cima e embaixo). Auto: altura > largura. */
  vertical: boolean;
  /** Gira 180 graus (quando o time aparece atacando para o outro lado). */
  flip: boolean;
  /** Time que aparece sozinho na foto (quando ha so um). */
  side: Team;
  /** Formacao do adversario quando a foto mostra um time so. */
  opponent: FormationName;
  /** Arruma os jogadores na formacao detectada. */
  snap: boolean;
}

/** Converte pontos da imagem para o campo do app (time A defende a esquerda). */
export function toField(points: DetectedPoint[], opts: Pick<PhotoOptions, "vertical" | "flip">): DetectedPoint[] {
  return points.map((p) => {
    // Em pe: o gol de baixo vira a esquerda (goleiro em x pequeno, ataque para cima = direita).
    let x = opts.vertical ? 1 - p.y : p.x;
    let y = opts.vertical ? p.x : p.y;
    if (opts.flip) {
      x = 1 - x;
      y = 1 - y;
    }
    return { x, y };
  });
}

const own = (team: Team, p: { x: number }) => (team === "A" ? p.x : 1 - p.x);

/** Formacao mais parecida: linhas de jogadores (por distancia ao proprio gol) com menor variacao interna. */
export function guessFormation(team: Team, pts: DetectedPoint[]): FormationName | null {
  if (pts.length !== 11) return null;
  const sorted = [...pts].sort((a, b) => own(team, a) - own(team, b));
  const field = sorted.slice(1).map((p) => own(team, p));
  let best: FormationName | null = null;
  let bestCost = Infinity;
  for (const name of FORMATION_NAMES) {
    let i = 0;
    let cost = 0;
    for (const count of name.split("-").map(Number)) {
      const line = field.slice(i, i + count);
      i += count;
      const mean = line.reduce((s, v) => s + v, 0) / count;
      cost += line.reduce((s, v) => s + (v - mean) ** 2, 0);
    }
    if (cost < bestCost) {
      bestCost = cost;
      best = name;
    }
  }
  return best;
}

function toPlayers(team: Team, pts: DetectedPoint[]): Player[] {
  const sorted = [...pts].sort((a, b) => own(team, a) - own(team, b));
  const gk = sorted[0];
  const rest = sorted.slice(1).sort((a, b) => own(team, a) - own(team, b) || a.y - b.y);
  return [gk, ...rest].map((p, i) => ({
    id: `${team}${i + 1}`,
    team,
    x: Math.min(1, Math.max(0, p.x)),
    y: Math.min(1, Math.max(0, p.y)),
  }));
}

export interface LineupResult {
  players: Player[];
  /** Formacao provavel de cada time (null se nao tem 11 jogadores). */
  formation: Record<Team, FormationName | null>;
  counts: Record<Team, number>;
  /** "dois" = foto com os dois times; "um" = so um time. */
  kind: "dois" | "um";
}

/** Monta os jogadores do app (ids A1.., B1..) a partir dos pontos ja no campo. */
export function buildLineup(field: DetectedPoint[], opts: Pick<PhotoOptions, "side" | "opponent" | "snap">): LineupResult {
  const two = field.length >= 15;
  let a: DetectedPoint[];
  let b: DetectedPoint[];

  if (two) {
    a = field.filter((p) => p.x < 0.5);
    b = field.filter((p) => p.x >= 0.5);
  } else {
    // um time so: cabe na propria metade
    const half = field.map((p) => ({ x: p.x * 0.5, y: p.y }));
    if (opts.side === "A") {
      a = half;
      b = [];
    } else {
      a = [];
      b = half.map((p) => ({ x: 1 - p.x, y: p.y }));
    }
  }

  const formation: Record<Team, FormationName | null> = {
    A: guessFormation("A", a),
    B: guessFormation("B", b),
  };

  let playersA = a.length ? toPlayers("A", a) : createTeam("A", opts.opponent);
  let playersB = b.length ? toPlayers("B", b) : createTeam("B", opts.opponent);

  if (opts.snap) {
    if (formation.A) playersA = createTeam("A", formation.A);
    if (formation.B) playersB = createTeam("B", formation.B);
  }

  return {
    players: [...playersA, ...playersB],
    formation,
    counts: { A: a.length, B: b.length },
    kind: two ? "dois" : "um",
  };
}