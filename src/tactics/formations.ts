import type { Player, Team } from "./engine";

export const FORMATION_NAMES = ["4-4-2", "4-3-3", "3-5-2", "4-2-3-1", "5-3-2"] as const;
export type FormationName = (typeof FORMATION_NAMES)[number];

/**
 * Cria os 11 jogadores de um time. O time A defende o gol da esquerda
 * (ataca para a direita); o time B e o espelho.
 */
export function createTeam(team: Team, formation: FormationName): Player[] {
  const lines = formation.split("-").map(Number);
  const players: Player[] = [{ id: `${team}1`, team, x: 0.05, y: 0.5 }];

  const firstLineX = 0.2;
  const lastLineX = 0.44;
  const step = lines.length > 1 ? (lastLineX - firstLineX) / (lines.length - 1) : 0;

  let number = 2;
  lines.forEach((count, lineIndex) => {
    const baseX = firstLineX + step * lineIndex;
    for (let i = 0; i < count; i++) {
      const y = (i + 1) / (count + 1);
      players.push({
        id: `${team}${number++}`,
        team,
        x: team === "A" ? baseX : 1 - baseX,
        y,
      });
    }
  });

  if (team === "B") {
    players[0] = { ...players[0], x: 0.95 };
  }
  return players;
}

export function createMatch(a: FormationName, b: FormationName): Player[] {
  return [...createTeam("A", a), ...createTeam("B", b)];
}
