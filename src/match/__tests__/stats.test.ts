import { describe, expect, it } from "vitest";
import { defaultMatch, parseMatch, rolesFor, displayName } from "../lineup";
import { computeMatchStats, convexHullArea } from "../stats";

describe("rolesFor", () => {
  it("gera 11 funcoes com goleiro primeiro", () => {
    (["4-4-2", "4-3-3", "3-5-2", "4-2-3-1", "5-3-2"] as const).forEach((f) => {
      const r = rolesFor(f);
      expect(r).toHaveLength(11);
      expect(r[0]).toBe("GOL");
      expect(r[10]).toBe("ATA");
    });
    expect(rolesFor("4-2-3-1").filter((r) => r === "VOL")).toHaveLength(2);
  });
});

describe("convexHullArea", () => {
  it("calcula a area de um quadrado", () => {
    expect(convexHullArea([[0, 0], [2, 0], [2, 2], [0, 2], [1, 1]])).toBeCloseTo(4);
  });
  it("devolve 0 com menos de 3 pontos", () => {
    expect(convexHullArea([[0, 0], [1, 1]])).toBe(0);
  });
});

describe("computeMatchStats", () => {
  it("o dominio dos dois times soma 100% e as zonas cobrem o campo", () => {
    const s = computeMatchStats(defaultMatch());
    expect(s.A.control + s.B.control).toBeCloseTo(1, 5);
    const total = [...s.A.players, ...s.B.players].reduce((x, p) => x + p.zoneM2, 0);
    expect(total).toBeCloseTo(105 * 68, 0);
  });

  it("formacoes iguais dao dominio equilibrado", () => {
    const m = defaultMatch();
    m.home.formation = "4-4-2";
    m.away.formation = "4-4-2";
    const s = computeMatchStats(m);
    expect(s.A.control).toBeCloseTo(0.5, 2);
    expect(s.A.widthM).toBeCloseTo(s.B.widthM, 5);
  });

  it("linha defensiva fica na propria metade", () => {
    const s = computeMatchStats(defaultMatch());
    expect(s.A.defLineM).toBeGreaterThan(0);
    expect(s.A.defLineM).toBeLessThan(52.5);
    expect(s.B.defLineM).toBeLessThan(52.5);
    expect(s.A.freest.zoneM2).toBeGreaterThanOrEqual(s.A.tightest.zoneM2);
  });
});

describe("parseMatch", () => {
  it("volta ao padrao com JSON invalido ou vazio", () => {
    expect(parseMatch(null)).toEqual(defaultMatch());
    expect(parseMatch("{nao e json")).toEqual(defaultMatch());
  });
  it("aceita dados validos e corrige campos ruins", () => {
    const m = parseMatch(
      JSON.stringify({
        competition: "Copa",
        home: { name: "Facens FC", formation: "9-9-9", squad: [{ number: 200, name: "Ana" }] },
      })
    );
    expect(m.competition).toBe("Copa");
    expect(m.home.name).toBe("Facens FC");
    expect(m.home.formation).toBe("4-3-3");
    expect(m.home.squad[0]).toEqual({ number: 99, name: "Ana" });
    expect(m.home.squad).toHaveLength(11);
  });
  it("nome vazio vira Jogador N", () => {
    expect(displayName({ number: 7, name: " " })).toBe("Jogador 7");
  });
});