import { describe, expect, it } from "vitest";
import {
  computeBestPass,
  computeOffside,
  type Player,
} from "../engine";
import { decodeTactic, encodeTactic, readSharedTactic } from "../share";
import { planStep } from "../play";
import { createMatch } from "../formations";

const p = (id: string, x: number, y: number): Player => ({
  id,
  team: id[0] as "A" | "B",
  x,
  y,
});

describe("impedimento", () => {
  const players = [
    p("A1", 0.05, 0.5),
    p("A2", 0.5, 0.3), // portador
    p("A3", 0.8, 0.6), // alem da linha
    p("A4", 0.6, 0.7), // em linha
    p("B1", 0.95, 0.5),
    p("B2", 0.7, 0.4), // penultimo defensor
    p("B3", 0.4, 0.2),
  ];

  it("usa o penultimo defensor como linha e marca quem passou dela", () => {
    const info = computeOffside(players, "A2");
    expect(info?.x).toBeCloseTo(0.7);
    expect(info?.offsideIds).toEqual(["A3"]);
  });

  it("espelha para o time B", () => {
    const mirrored = players.map((q) =>
      p(q.id[0] === "A" ? q.id.replace("A", "B") : q.id.replace("B", "A"), 1 - q.x, q.y)
    );
    const info = computeOffside(mirrored, "B2");
    expect(info?.team).toBe("B");
    expect(info?.x).toBeCloseTo(0.3);
    expect(info?.offsideIds).toEqual(["B3"]);
  });

  it("nao ha impedimento na propria metade", () => {
    const own = [p("A1", 0.05, 0.5), p("A2", 0.3, 0.5), p("A3", 0.2, 0.2), p("B1", 0.9, 0.5), p("B2", 0.1, 0.5)];
    expect(computeOffside(own, "A1")?.offsideIds).toEqual([]);
  });

  it("devolve null sem portador valido", () => {
    expect(computeOffside(players, "X9")).toBeNull();
  });
});

describe("melhor passe", () => {
  it("ignora passe bloqueado e receptor impedido", () => {
    const players = [
      p("A1", 0.3, 0.5),
      p("A2", 0.5, 0.5), // bloqueado por B3
      p("A3", 0.35, 0.8),
      p("B1", 0.95, 0.5),
      p("B2", 0.9, 0.2),
      p("B3", 0.4, 0.5),
    ];
    const best = computeBestPass(players, "A1");
    expect(best?.to).toBe("A3");
  });

  it("devolve null quando nao ha passe livre", () => {
    const players = [p("A1", 0.3, 0.5), p("A2", 0.5, 0.5), p("B1", 0.4, 0.5), p("B2", 0.9, 0.5)];
    expect(computeBestPass(players, "A1")).toBeNull();
  });
});

describe("compartilhar tatica", () => {
  it("codifica e decodifica sem perder posicoes (milesimos)", () => {
    const players = createMatch("4-4-2", "4-3-3");
    const token = encodeTactic(players, "A9");
    const back = decodeTactic(token);
    expect(back?.players).toHaveLength(22);
    expect(back?.ball).toBe("A9");
    back?.players.forEach((q, i) => {
      expect(q.id).toBe(players[i].id);
      expect(q.x).toBeCloseTo(players[i].x, 2);
      expect(q.y).toBeCloseTo(players[i].y, 2);
    });
    expect(readSharedTactic(`?t=${token}`)?.players).toHaveLength(22);
  });

  it("leva os passos da jogada no link", () => {
    const players = createMatch("4-4-2", "4-3-3");
    const moved = players.map((q) => (q.id === "A9" ? { ...q, x: 0.7 } : q));
    const token = encodeTactic(players, "A4", [
      { players, ball: "A4" },
      { players: moved, ball: "A9" },
    ]);
    const back = decodeTactic(token);
    expect(back?.steps).toHaveLength(2);
    expect(back?.steps[1].ball).toBe("A9");
    expect(back?.steps[1].players.find((q) => q.id === "A9")?.x).toBeCloseTo(0.7, 2);
  });

  it("rejeita lixo", () => {
    expect(decodeTactic("")).toBeNull();
    expect(decodeTactic("nao-e-base64!!")).toBeNull();
    expect(decodeTactic(btoa(JSON.stringify({ p: [["Z1", 1, 1], ["A1", 2, 2]] })))).toBeNull();
    expect(decodeTactic(btoa(JSON.stringify({ p: [["A1", 5000, 1], ["B1", 2, 2]] })))).toBeNull();
  });
});

describe("planStep", () => {
  it("avanca o time com a bola e mantem goleiros e limites", () => {
    const players = createMatch("4-4-2", "4-4-2");
    const step = planStep(players, "A9");
    expect(step.targets).toHaveLength(players.length);
    step.targets.forEach((t, i) => {
      expect(t.x).toBeGreaterThanOrEqual(0.03);
      expect(t.x).toBeLessThanOrEqual(0.97);
      if (t.id.endsWith("1")) expect(t.x).toBe(players[i].x);
      if (t.team === "A" && !t.id.endsWith("1")) {
        expect(t.x).toBeGreaterThan(players[i].x);
      }
    });
  });
});
