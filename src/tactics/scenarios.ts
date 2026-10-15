import { attackDirection, type Player, type Team } from "./engine";
import { createMatch } from "./formations";
import { isGoalkeeper, type PlayFrame } from "./play";

export interface Scenario {
  id: string;
  name: string;
  /** A pergunta tatica que o cenario ajuda a responder. */
  question: string;
  /** O que observar no resultado. */
  look: string;
  build: () => PlayFrame;
}

const clamp = (v: number) => Math.min(0.97, Math.max(0.03, v));

/** Move para frente (positivo) ou para tras (negativo) os jogadores de linha de um time. */
function shiftTeam(
  players: Player[],
  team: Team,
  forward: number,
  only?: (p: Player) => boolean
): Player[] {
  const dir = attackDirection(team);
  return players.map((p) =>
    p.team === team && !isGoalkeeper(p.id) && (!only || only(p))
      ? { ...p, x: clamp(p.x + forward * dir) }
      : p
  );
}

const number = (p: Player) => Number(p.id.slice(1));

function setX(players: Player[], ids: string[], x: number): Player[] {
  return players.map((p) => (ids.includes(p.id) ? { ...p, x } : p));
}

const base = () => createMatch("4-4-2", "4-3-3");

export const SCENARIOS: Scenario[] = [
  {
    id: "inicial",
    name: "Posição inicial",
    question: "Como o jogo começa, com 4-4-2 contra 4-3-3?",
    look: "Domínio perto de 50% para cada lado e a bola no círculo central.",
    build: () => ({ players: base(), ball: "A11" }),
  },
  {
    id: "linha-alta",
    name: "Linha alta do azul",
    question: "O que muda se o azul adianta toda a equipe?",
    look: "O domínio do azul sobe. O risco real, o espaço nas costas da defesa azul, este modelo não mede.",
    build: () => ({ players: shiftTeam(base(), "A", 0.14), ball: "A8" }),
  },
  {
    id: "bloco-baixo",
    name: "Bloco baixo do vermelho",
    question: "E se o vermelho recua e se fecha perto do próprio gol?",
    look: "O azul passa a dominar mais campo e o melhor passe vira um lançamento para o ataque.",
    build: () => ({ players: shiftTeam(base(), "B", -0.14), ball: "A8" }),
  },
  {
    id: "contra-ataque",
    name: "Contra-ataque do azul",
    question: "Qual o melhor passe quando o vermelho sobe demais?",
    look: "O domínio do azul cai (o vermelho ocupa mais campo), mas o melhor passe vai ao atacante solto nas costas da defesa.",
    build: () => {
      let p = shiftTeam(base(), "B", 0.16);
      p = shiftTeam(p, "A", 0.14, (q) => number(q) >= 10);
      return { players: p, ball: "A7" };
    },
  },
  {
    id: "impedimento",
    name: "Armadilha de impedimento",
    question: "Quando um atacante fica em posição irregular?",
    look: "A linha vermelha marca onde está o impedimento e os atacantes adiantados ganham anel.",
    build: () => {
      let p = shiftTeam(base(), "B", 0.14);
      p = setX(p, ["A10"], 0.72);
      p = setX(p, ["A11"], 0.7);
      return { players: p, ball: "A8" };
    },
  },
];
