import { describe, expect, it } from "vitest";
import { createTacticalGroup, updateTacticalGroup } from "../tacticalScene";
import { createMatch } from "../../../tactics/formations";

const base = { showZones: false, showPasses: true, labels: true, ballCarrierId: "A10" } as const;

describe("estilo limpo do AR", () => {
  it("passMode 'carrier' desenha menos linhas que 'all' com 22 jogadores", () => {
    const players = createMatch("4-4-2", "4-3-3");
    const all = createTacticalGroup();
    const carrier = createTacticalGroup();
    updateTacticalGroup(all, players, { ...base, maxPassDistance: 0.34 });
    updateTacticalGroup(carrier, players, {
      ...base,
      maxPassDistance: 0.34,
      passMode: "carrier",
    });
    const count = (t: ReturnType<typeof createTacticalGroup>) =>
      t.group.getObjectByName("lines")!.children.length;
    expect(count(carrier)).toBeGreaterThan(0);
    expect(count(carrier)).toBeLessThan(count(all));
    all.dispose();
    carrier.dispose();
  });

  it("veil liga e desliga o veu escuro", () => {
    const players = createMatch("4-4-2", "4-3-3");
    const t = createTacticalGroup();
    updateTacticalGroup(t, players, { ...base, veil: true, labelScale: 0.5 });
    expect(t.group.getObjectByName("veil")!.visible).toBe(true);
    // jsdom nao tem canvas: o numero so existe em navegadores de verdade.
    const sprite = t.state.visuals.get("A2")!.label;
    if (sprite) expect(sprite.scale.x).toBeCloseTo(0.055 * 0.5, 5);
    updateTacticalGroup(t, players, { ...base, veil: false });
    expect(t.group.getObjectByName("veil")!.visible).toBe(false);
    t.dispose();
  });
});

describe("gramado do AR", () => {
  it("pitch liga e desliga o gramado e nao quebra sem canvas", () => {
    const players = createMatch("4-4-2", "4-3-3");
    const t = createTacticalGroup();
    expect(() =>
      updateTacticalGroup(t, players, { ...base, pitch: true })
    ).not.toThrow();
    updateTacticalGroup(t, players, { ...base, pitch: false });
    expect(t.group.getObjectByName("pitch")!.visible).toBe(false);
    t.dispose();
  });
});
