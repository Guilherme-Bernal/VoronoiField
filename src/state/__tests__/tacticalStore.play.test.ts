import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTacticalStore } from "../tacticalStore";

describe("jogada animada", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useTacticalStore.getState().loadMatch("4-4-2", "4-3-3");
  });
  afterEach(() => {
    useTacticalStore.getState().stopPlay();
    vi.useRealTimers();
  });

  it("move os jogadores, passa a bola e termina sozinha", () => {
    const store = useTacticalStore;
    const before = store.getState().players.map((q) => ({ ...q }));
    const carrierBefore = store.getState().ballCarrierId;

    store.getState().startPlay();
    expect(store.getState().playing).toBe(true);

    vi.advanceTimersByTime(8000);

    expect(store.getState().playing).toBe(false);
    const after = store.getState().players;
    expect(after.some((q, i) => Math.abs(q.x - before[i].x) > 0.05)).toBe(true);
    expect(store.getState().ballCarrierId).not.toBe(carrierBefore);
  });

  it("arrastar um jogador interrompe a jogada", () => {
    const store = useTacticalStore;
    store.getState().startPlay();
    vi.advanceTimersByTime(300);
    store.getState().startDrag("B5");
    expect(store.getState().playing).toBe(false);
    expect(store.getState().ballCarrierId).toBe("B5");
  });

  it("passBall entrega a bola ao melhor receptor", () => {
    const store = useTacticalStore;
    const from = store.getState().ballCarrierId;
    store.getState().passBall();
    expect(store.getState().ballCarrierId).not.toBe(from);
  });
});
