import {
  attackDirection,
  computeBestPass,
  type BestPass,
  type Player,
} from "./engine";

const clamp = (value: number, min = 0.03, max = 0.97) =>
  Math.min(max, Math.max(min, value));

/** Um passo salvo na prancheta: posicoes de todos os jogadores e quem esta com a bola. */
export interface PlayFrame {
  players: Player[];
  ball: string | null;
}

export interface PlayStep {
  /** Posicoes finais do passo, na mesma ordem de `players`. */
  targets: Player[];
  /** Passe executado no inicio do passo (a bola vai para `pass.to`). */
  pass: BestPass | null;
}

/**
 * Um passo da jogada: o time com a bola sobe o bloco, o receptor do melhor
 * passe corre mais, e a defesa recua e fecha em direcao a bola. Funciona para
 * qualquer formacao.
 */
export function planStep(players: Player[], carrierId: string | null): PlayStep {
  const carrier = players.find((p) => p.id === carrierId);
  if (!carrier) return { targets: players.map((p) => ({ ...p })), pass: null };

  const dir = attackDirection(carrier.team);
  const pass = computeBestPass(players, carrier.id);

  const targets = players.map((p) => {
    if (p.id.endsWith("1")) return { ...p }; // goleiro fica
    if (p.team === carrier.team) {
      let dx = 0.05 * dir;
      if (p.id === carrier.id) dx = 0.03 * dir;
      if (pass && p.id === pass.to) dx = 0.1 * dir;
      return { ...p, x: clamp(p.x + dx) };
    }
    return {
      ...p,
      x: clamp(p.x + 0.03 * dir),
      y: clamp(p.y + (carrier.y - p.y) * 0.18),
    };
  });

  return { targets, pass };
}
