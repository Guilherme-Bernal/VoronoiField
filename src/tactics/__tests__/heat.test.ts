import { describe, expect, it } from "vitest";
import { buildHeatmap } from "../heat";

describe("buildHeatmap", () => {
  it("normaliza cada time para 0..1 e acumula onde o jogador passou", () => {
    const heat = buildHeatmap(
      {
        A2: [
          [0.1, 0.5],
          [0.1, 0.5],
          [0.12, 0.5],
        ],
        B2: [[0.95, 0.2]],
      },
      10,
      10
    );
    expect(Math.max(...heat.A)).toBeCloseTo(1, 5);
    expect(Math.max(...heat.B)).toBeCloseTo(1, 5);
    const hotA = heat.A.indexOf(Math.max(...heat.A));
    expect(hotA % 10).toBe(1); // coluna proxima de x = 0.1
    const hotB = heat.B.indexOf(Math.max(...heat.B));
    expect(hotB % 10).toBe(9);
  });

  it("devolve zeros sem rastro", () => {
    const heat = buildHeatmap({}, 4, 4);
    expect(heat.A.every((v) => v === 0)).toBe(true);
    expect(heat.B.every((v) => v === 0)).toBe(true);
  });

  it("ignora pontos fora do campo sem quebrar", () => {
    expect(() => buildHeatmap({ A2: [[1.5, -0.2]] }, 4, 4)).not.toThrow();
  });
});
