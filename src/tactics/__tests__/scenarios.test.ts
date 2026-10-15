import { describe, expect, it } from "vitest";
import { analyzeTactic } from "../analysis";
import { compareTactics } from "../result";
import { isGoalkeeper, planStep } from "../play";
import { SCENARIOS } from "../scenarios";

const get = (id: string) => SCENARIOS.find((s) => s.id === id)!.build();

describe("cenarios prontos", () => {
  it("todos tem 22 jogadores, bola valida e posicoes dentro do campo", () => {
    for (const s of SCENARIOS) {
      const f = s.build();
      expect(f.players).toHaveLength(22);
      expect(f.players.some((p) => p.id === f.ball)).toBe(true);
      f.players.forEach((p) => {
        expect(p.x).toBeGreaterThanOrEqual(0.03);
        expect(p.x).toBeLessThanOrEqual(0.97);
      });
      expect(s.question.length).toBeGreaterThan(10);
    }
  });

  it("linha alta aumenta o dominio do azul e bloco baixo tambem", () => {
    const start = get("inicial");
    expect(compareTactics(start, get("linha-alta")).delta).toBeGreaterThan(3);
    expect(compareTactics(start, get("bloco-baixo")).delta).toBeGreaterThan(3);
  });

  it("contra-ataque reduz o dominio mas encontra passe ao atacante", () => {
    const start = get("inicial");
    const f = get("contra-ataque");
    expect(compareTactics(start, f).delta).toBeLessThan(0);
    const a = analyzeTactic(f.players, f.ball, true);
    expect(a.bestPass?.to).toBe("A10");
  });

  it("armadilha de impedimento marca A10 e A11", () => {
    const f = get("impedimento");
    const a = analyzeTactic(f.players, f.ball, true);
    expect(a.offside?.offsideIds.sort()).toEqual(["A10", "A11"]);
  });

  it("A11 e B11 nao sao goleiros e se movem na jogada automatica", () => {
    expect(isGoalkeeper("A1")).toBe(true);
    expect(isGoalkeeper("B1")).toBe(true);
    expect(isGoalkeeper("A11")).toBe(false);
    const f = get("inicial");
    const step = planStep(f.players, "A8");
    const a11 = f.players.find((p) => p.id === "A11")!;
    expect(step.targets.find((p) => p.id === "A11")!.x).not.toBeCloseTo(a11.x, 3);
  });
});

describe("compareTactics", () => {
  it("sem mudanca avisa que nada mudou", () => {
    const f = get("inicial");
    const r = compareTactics(f, { players: f.players.map((p) => ({ ...p })), ball: f.ball });
    expect(r.changed).toBe(false);
    expect(r.delta).toBe(0);
    expect(r.headline).toMatch(/Ainda não há mudança/);
  });

  it("escreve a conclusao com dominio, bola e impedimento", () => {
    const r = compareTactics(get("inicial"), get("impedimento"));
    expect(r.changed).toBe(true);
    expect(r.headline).toMatch(/^Em relação ao ponto de partida,/);
    expect(r.headline).toMatch(/a bola foi de A11 para A8/);
    expect(r.headline).toMatch(/2 jogadores azuis em impedimento \(A10, A11\)/);
    expect(r.lines.some((l) => l.startsWith("Impedimento (azul): A10, A11"))).toBe(true);
  });

  it("descreve subida e queda do dominio com sinais corretos", () => {
    const up = compareTactics(get("inicial"), get("linha-alta"));
    expect(up.headline).toMatch(/subiu de 48% para \d+% \(\+\d+ pontos\)/);
    const down = compareTactics(get("inicial"), get("contra-ataque"));
    expect(down.headline).toMatch(/caiu de 48% para \d+% \(−\d+ pontos\)/);
  });

  it("sem impedimento ligado nao fala de impedimento", () => {
    const r = compareTactics(get("inicial"), get("impedimento"), false);
    expect(r.lines.some((l) => l.startsWith("Impedimento"))).toBe(false);
    expect(r.headline).not.toMatch(/impedimento/);
  });
});
