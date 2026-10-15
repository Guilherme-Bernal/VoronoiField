import { analyzeTactic } from "./analysis";
import type { PlayFrame } from "./play";

export type Verdict = "A" | "B" | "equilibrado";

export interface TacticResult {
  /** Ha diferenca entre o ponto de partida e a situacao atual? */
  changed: boolean;
  controlBefore: number;
  controlAfter: number;
  /** Diferenca em pontos percentuais do domínio do time azul. */
  delta: number;
  ballBefore: string | null;
  ballAfter: string | null;
  bestBefore: string | null;
  bestAfter: string | null;
  offsideBefore: string[];
  offsideAfter: string[];
  verdict: Verdict;
  /** Frase-conclusao, pronta para mostrar. */
  headline: string;
  /** Detalhes, um por linha. */
  lines: string[];
}

const TEAM_NAME = { A: "azul", B: "vermelho" } as const;
const MOVE_EPSILON = 0.004;

function samePositions(a: PlayFrame, b: PlayFrame) {
  if (a.players.length !== b.players.length) return false;
  const byId = new Map(b.players.map((p) => [p.id, p]));
  return a.players.every((p) => {
    const q = byId.get(p.id);
    return !!q && Math.hypot(p.x - q.x, p.y - q.y) < MOVE_EPSILON;
  });
}

function teamWord(ids: string[]) {
  return ids[0]?.startsWith("B") ? TEAM_NAME.B : TEAM_NAME.A;
}

function teamAdjective(ids: string[], many: boolean) {
  const isB = ids[0]?.startsWith("B");
  if (isB) return many ? "vermelhos" : "vermelho";
  return many ? "azuis" : "azul";
}

function plural(n: number, one: string, many: string) {
  return n === 1 ? one : many;
}

function verdictOf(controlA: number): Verdict {
  if (controlA >= 55) return "A";
  if (controlA <= 45) return "B";
  return "equilibrado";
}

/**
 * Compara o ponto de partida com a situacao atual e escreve a conclusao em
 * portugues: o que mudou em dominio de espaco, bola, melhor passe e impedimento.
 */
export function compareTactics(
  before: PlayFrame,
  after: PlayFrame,
  showOffside = true
): TacticResult {
  const a = analyzeTactic(before.players, before.ball, showOffside);
  const b = analyzeTactic(after.players, after.ball, showOffside);

  const controlBefore = Math.round(a.control.A * 100);
  const controlAfter = Math.round(b.control.A * 100);
  const delta = controlAfter - controlBefore;
  const bestBefore = a.bestPass ? `${a.bestPass.from} → ${a.bestPass.to}` : null;
  const bestAfter = b.bestPass ? `${b.bestPass.from} → ${b.bestPass.to}` : null;
  const offsideBefore = showOffside ? (a.offside?.offsideIds ?? []) : [];
  const offsideAfter = showOffside ? (b.offside?.offsideIds ?? []) : [];

  const changed = !samePositions(before, after) || before.ball !== after.ball;
  const verdict = verdictOf(controlAfter);

  const lines: string[] = [];
  lines.push(
    delta === 0
      ? `Domínio do azul: ${controlAfter}% (sem mudança)`
      : `Domínio do azul: ${controlBefore}% → ${controlAfter}% (${delta > 0 ? "+" : "−"}${Math.abs(delta)} ${plural(Math.abs(delta), "ponto", "pontos")})`
  );
  lines.push(
    before.ball !== after.ball
      ? `Bola: ${before.ball ?? "-"} → ${after.ball ?? "-"}`
      : `Bola: continua com ${after.ball ?? "-"}`
  );
  lines.push(
    `Melhor passe: ${bestAfter ?? "nenhum livre"}` +
      (bestBefore !== bestAfter ? ` (antes: ${bestBefore ?? "nenhum livre"})` : "")
  );
  if (showOffside) {
    lines.push(
      offsideAfter.length
        ? `Impedimento (${teamWord(offsideAfter)}): ${offsideAfter.join(", ")}`
        : "Impedimento: ninguém"
    );
  }
  lines.push(
    verdict === "equilibrado"
      ? "Leitura: espaço equilibrado entre os times."
      : `Leitura: o ${TEAM_NAME[verdict]} tem vantagem de espaço.`
  );

  let headline: string;
  if (!changed) {
    headline =
      "Ainda não há mudança. Mova jogadores, dê a bola a outro, use a jogada automática ou escolha um cenário.";
  } else {
    const parts: string[] = [];
    if (delta === 0) parts.push(`o domínio do azul ficou em ${controlAfter}%`);
    else
      parts.push(
        `o domínio do azul ${delta > 0 ? "subiu" : "caiu"} de ${controlBefore}% para ${controlAfter}% (${delta > 0 ? "+" : "−"}${Math.abs(delta)} ${plural(Math.abs(delta), "ponto", "pontos")})`
      );
    if (before.ball !== after.ball)
      parts.push(`a bola foi de ${before.ball ?? "-"} para ${after.ball ?? "-"}`);
    if (bestAfter) parts.push(`o melhor passe agora é ${bestAfter}`);
    if (offsideAfter.length)
      parts.push(
        `${offsideAfter.length} ${plural(offsideAfter.length, "jogador", "jogadores")} ${teamAdjective(offsideAfter, offsideAfter.length > 1)} em impedimento (${offsideAfter.join(", ")})`
      );
    const last = parts.pop()!;
    const text = parts.length ? `${parts.join(", ")} e ${last}` : last;
    headline = `Em relação ao ponto de partida, ${text}.`;
  }

  return {
    changed,
    controlBefore,
    controlAfter,
    delta,
    ballBefore: before.ball,
    ballAfter: after.ball,
    bestBefore,
    bestAfter,
    offsideBefore,
    offsideAfter,
    verdict,
    headline,
    lines,
  };
}
