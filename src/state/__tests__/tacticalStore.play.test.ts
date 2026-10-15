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

  it("arrastar interrompe a jogada sem mudar a bola; um toque passa a bola", () => {
    const store = useTacticalStore;
    const carrier = store.getState().ballCarrierId;
    store.getState().startPlay();
    vi.advanceTimersByTime(300);
    store.getState().startDrag("B5");
    expect(store.getState().playing).toBe(false);
    store.getState().setPlayerPosition("B5", 0.5, 0.5);
    store.getState().endDrag();
    expect(store.getState().ballCarrierId).not.toBe("B5");
    expect(carrier).not.toBe("B5");

    store.getState().startDrag("B6");
    store.getState().endDrag(); // sem mover = toque
    expect(store.getState().ballCarrierId).toBe("B6");
  });

  it("prancheta: salva passos, reproduz ate o ultimo e limpa", () => {
    const store = useTacticalStore;
    const s = store.getState();
    s.addStep();
    s.setPlayerPosition("A9", 0.7, 0.3);
    s.setBallCarrier("A9");
    s.addStep();
    expect(store.getState().steps).toHaveLength(2);

    store.getState().playSteps();
    expect(store.getState().playing).toBe(true);
    vi.advanceTimersByTime(3000);
    expect(store.getState().playing).toBe(false);
    const a9 = store.getState().players.find((p) => p.id === "A9")!;
    expect(a9.x).toBeCloseTo(0.7, 2);
    expect(store.getState().ballCarrierId).toBe("A9");

    store.getState().goToStep(0);
    expect(store.getState().players.find((p) => p.id === "A9")!.x).not.toBeCloseTo(0.7, 2);

    store.getState().clearSteps();
    expect(store.getState().steps).toHaveLength(0);
  });

  it("passBall entrega a bola ao melhor receptor", () => {
    const store = useTacticalStore;
    const from = store.getState().ballCarrierId;
    store.getState().passBall();
    expect(store.getState().ballCarrierId).not.toBe(from);
  });
});
