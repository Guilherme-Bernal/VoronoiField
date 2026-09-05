import { describe, expect, it } from "vitest";
import {
  computePassingLines,
  computeVoronoiZones,
  type Player,
} from "../engine";

describe("computeVoronoiZones", () => {
  it("gera um poligono para cada jogador", () => {
    const players: Player[] = [
      { id: "A1", team: "A", x: 0.2, y: 0.5 },
      { id: "B1", team: "B", x: 0.8, y: 0.5 },
    ];

    const zones = computeVoronoiZones(players);

    expect(zones).toHaveLength(2);
    zones.forEach((zone) => {
      expect(zone.polygon.length).toBeGreaterThan(0);
    });
  });
});

describe("computePassingLines", () => {
  it("marca a linha como bloqueada quando um adversario esta no meio do caminho", () => {
    const players: Player[] = [
      { id: "A1", team: "A", x: 0.1, y: 0.5 },
      { id: "A2", team: "A", x: 0.9, y: 0.5 },
      { id: "B1", team: "B", x: 0.5, y: 0.5 }, // exatamente no meio da reta
    ];

    const lines = computePassingLines(players);
    const line = lines.find((l) => l.from === "A1" && l.to === "A2");

    expect(line).toBeDefined();
    expect(line!.blocked).toBe(true);
  });

  it("nao marca a linha como bloqueada quando nao ha adversario perto", () => {
    const players: Player[] = [
      { id: "A1", team: "A", x: 0.1, y: 0.5 },
      { id: "A2", team: "A", x: 0.9, y: 0.5 },
      { id: "B1", team: "B", x: 0.5, y: 0.1 }, // longe da reta
    ];

    const lines = computePassingLines(players);
    const line = lines.find((l) => l.from === "A1" && l.to === "A2");

    expect(line).toBeDefined();
    expect(line!.blocked).toBe(false);
  });

  it("nao gera linha entre jogadores de times diferentes", () => {
    const players: Player[] = [
      { id: "A1", team: "A", x: 0.1, y: 0.5 },
      { id: "B1", team: "B", x: 0.9, y: 0.5 },
    ];

    const lines = computePassingLines(players);

    expect(lines).toHaveLength(0);
  });
});
