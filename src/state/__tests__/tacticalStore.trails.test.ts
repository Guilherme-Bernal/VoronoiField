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
