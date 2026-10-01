import { describe, expect, it } from "vitest";
import { FORMATION_NAMES, createMatch, createTeam } from "../formations";

describe("createTeam", () => {
  it.each(FORMATION_NAMES)("formacao %s tem 11 jogadores", (name) => {
    expect(createTeam("A", name)).toHaveLength(11);
  });

  it("mantem todos os jogadores dentro do campo", () => {
    FORMATION_NAMES.forEach((name) => {
      createMatch(name, name).forEach((p) => {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(1);
        expect(p.y).toBeGreaterThan(0);
        expect(p.y).toBeLessThan(1);
      });
    });
  });

  it("time A fica na metade esquerda e time B na direita", () => {
    const players = createMatch("4-4-2", "4-3-3");
    players
      .filter((p) => p.team === "A")
      .forEach((p) => expect(p.x).toBeLessThan(0.5));
    players
      .filter((p) => p.team === "B")
      .forEach((p) => expect(p.x).toBeGreaterThan(0.5));
  });

  it("gera ids unicos", () => {
    const ids = createMatch("4-4-2", "4-4-2").map((p) => p.id);
    expect(new Set(ids).size).toBe(22);
  });
});
