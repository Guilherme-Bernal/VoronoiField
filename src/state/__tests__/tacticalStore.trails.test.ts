import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTacticalStore } from "../tacticalStore";

describe("rastro da jogada", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useTacticalStore.getState().loadMatch("4-4-2", "4-3-3");
  });
  afterEach(() => {
    useTacticalStore.getState().stopPlay();
    vi.useRealTimers();
  });

  it("comeca vazio e cresce durante a jogada automatica", () => {
    expect(useTacticalStore.getState().trails).toEqual({});
    useTacticalStore.getState().startPlay();
    vi.advanceTimersByTime(2500);
    const { trails } = useTacticalStore.getState();
    const moved = Object.values(trails).filter((t) => t.length > 2);
    expect(moved.length).toBeGreaterThan(5);
  });

  it("e limpo ao reiniciar ou ao arrastar", () => {
    useTacticalStore.getState().startPlay();
    vi.advanceTimersByTime(1500);
    useTacticalStore.getState().startDrag("A5");
    expect(useTacticalStore.getState().trails).toEqual({});
    useTacticalStore.getState().loadMatch("4-4-2", "4-4-2");
    expect(useTacticalStore.getState().trails).toEqual({});
  });

  it("limita o tamanho do rastro", () => {
    useTacticalStore.getState().startPlay();
    vi.advanceTimersByTime(6000);
    const sizes = Object.values(useTacticalStore.getState().trails).map((t) => t.length);
    expect(Math.max(...sizes)).toBeLessThanOrEqual(160);
  });
});

describe("ponto de partida do resultado", () => {
  it("loadMatch e applyScenario definem o baseline; markBaseline usa a posicao atual", () => {
    const s = useTacticalStore.getState();
    s.loadMatch("4-4-2", "4-3-3");
    expect(useTacticalStore.getState().baseline?.players).toHaveLength(22);

    s.setPlayerPosition("A8", 0.7, 0.4);
    expect(useTacticalStore.getState().baseline?.players.find((p) => p.id === "A8")!.x).not.toBeCloseTo(0.7, 2);

    s.markBaseline();
    expect(useTacticalStore.getState().baseline?.players.find((p) => p.id === "A8")!.x).toBeCloseTo(0.7, 5);

    s.applyScenario({ players: useTacticalStore.getState().players.map((p) => ({ ...p, x: 0.5 })), ball: "A8" });
    expect(useTacticalStore.getState().ballCarrierId).toBe("A8");
    expect(useTacticalStore.getState().baseline?.players.every((p) => p.x === 0.5)).toBe(true);
  });
});
