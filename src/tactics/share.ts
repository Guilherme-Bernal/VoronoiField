import type { Player } from "./engine";
import type { PlayFrame } from "./play";

export interface SharedTactic {
  players: Player[];
  ball: string | null;
  /** Passos da jogada preparada (mesma ordem de `players`). */
  steps: PlayFrame[];
}

const MAX_STEPS = 12;

const ID_PATTERN = /^[AB]\d{1,2}$/;

function toBase64Url(text: string): string {
  return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(token: string): string {
  const base = token.replace(/-/g, "+").replace(/_/g, "/");
  return atob(base + "=".repeat((4 - (base.length % 4)) % 4));
}

/** Codifica as posicoes (milesimos) e o portador da bola em um texto curto para URL. */
export function encodeTactic(
  players: Player[],
  ball: string | null,
  steps: PlayFrame[] = []
): string {
  const order = players.map((p) => p.id);
  return toBase64Url(
    JSON.stringify({
      b: ball,
      s: steps.map((frame) => {
        const byId = new Map(frame.players.map((p) => [p.id, p]));
        const flat: number[] = [];
        order.forEach((id) => {
          const q = byId.get(id);
          flat.push(Math.round((q?.x ?? 0) * 1000), Math.round((q?.y ?? 0) * 1000));
        });
        return [frame.ball, flat];
      }),
      p: players.map((p) => [
        p.id,
        Math.round(p.x * 1000),
        Math.round(p.y * 1000),
      ]),
    })
  );
}

export function decodeTactic(token: string | null | undefined): SharedTactic | null {
  if (!token) return null;
  try {
    const data = JSON.parse(fromBase64Url(token)) as {
      b?: unknown;
      p?: unknown;
      s?: unknown;
    };
    if (!Array.isArray(data.p) || data.p.length < 2 || data.p.length > 30) {
      return null;
    }
    const seen = new Set<string>();
    const players: Player[] = [];
    for (const item of data.p) {
      if (!Array.isArray(item) || item.length !== 3) return null;
      const [id, x, y] = item as [unknown, unknown, unknown];
      if (typeof id !== "string" || !ID_PATTERN.test(id) || seen.has(id)) {
        return null;
      }
      if (
        typeof x !== "number" ||
        typeof y !== "number" ||
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        x < 0 ||
        x > 1000 ||
        y < 0 ||
        y > 1000
      ) {
        return null;
      }
      seen.add(id);
      players.push({ id, team: id[0] as "A" | "B", x: x / 1000, y: y / 1000 });
    }
    const ball =
      typeof data.b === "string" && seen.has(data.b) ? data.b : null;

    const steps: PlayFrame[] = [];
    if (Array.isArray(data.s)) {
      if (data.s.length > MAX_STEPS) return null;
      for (const item of data.s) {
        if (!Array.isArray(item) || item.length !== 2) return null;
        const [frameBall, flat] = item as [unknown, unknown];
        if (!Array.isArray(flat) || flat.length !== players.length * 2) return null;
        if (flat.some((n) => typeof n !== "number" || !(n >= 0 && n <= 1000))) {
          return null;
        }
        steps.push({
          ball:
            typeof frameBall === "string" && seen.has(frameBall) ? frameBall : null,
          players: players.map((p, i) => ({
            ...p,
            x: (flat[i * 2] as number) / 1000,
            y: (flat[i * 2 + 1] as number) / 1000,
          })),
        });
      }
    }
    return { players, ball, steps };
  } catch {
    return null;
  }
}

export function readSharedTactic(search: string): SharedTactic | null {
  return decodeTactic(new URLSearchParams(search).get("t"));
}

export function buildShareUrl(
  path: string,
  players: Player[],
  ball: string | null,
  steps: PlayFrame[] = [],
  origin: string = window.location.origin
): string {
  return `${origin}${path}?t=${encodeTactic(players, ball, steps)}`;
}
