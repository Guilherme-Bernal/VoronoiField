import { describe, expect, it } from "vitest";
import {
  computePassingLines,
  computeTeamControl,
  computeVoronoiZones,
  polygonArea,
  type Player,
} from "../engine";

describe("computePassingLines com distancia maxima", () => {
  it("ignora passes mais longos que a distancia maxima", () => {
    const players: Player[] = [
      { id: "A1", team: "A", x: 0.1, y: 0.5 },
      { id: "A2", team: "A", x: 0.9, y: 0.5 },
    ];

    expect(computePassingLines(players, 0.06, 0.3)).toHaveLength(0);
    expect(computePassingLines(players, 0.06, 1)).toHaveLength(1);
  });
});

describe("polygonArea", () => {
  it("calcula a area de um quadrado", () => {
    expect(polygonArea([[0, 0], [1, 0], [1, 1], [0, 1]])).toBeCloseTo(1);
  });
});

describe("computeTeamControl", () => {
  it("divide o campo igualmente para jogadores simetricos", () => {
    const players: Player[] = [
      { id: "A1", team: "A", x: 0.25, y: 0.5 },
      { id: "B1", team: "B", x: 0.75, y: 0.5 },
    ];
    const control = computeTeamControl(computeVoronoiZones(players));

    expect(control.A).toBeCloseTo(0.5);
    expect(control.B).toBeCloseTo(0.5);
  });

  it("da mais dominio ao time que tem mais jogadores espalhados", () => {
    const players: Player[] = [
      { id: "A1", team: "A", x: 0.2, y: 0.2 },
      { id: "A2", team: "A", x: 0.2, y: 0.8 },
      { id: "A3", team: "A", x: 0.5, y: 0.5 },
      { id: "B1", team: "B", x: 0.9, y: 0.5 },
    ];
    const control = computeTeamControl(computeVoronoiZones(players));

    expect(control.A).toBeGreaterThan(control.B);
    expect(control.A + control.B).toBeCloseTo(1);
  });
});
