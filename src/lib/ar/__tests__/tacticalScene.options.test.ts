import { describe, expect, it } from "vitest";
import {
  createTacticalGroup,
  tickTacticalGroup,
  updateTacticalGroup,
} from "../tacticalScene";
import type { Player } from "../../../tactics/engine";

const players: Player[] = [
  { id: "A1", team: "A", x: 0.25, y: 0.5 },
  { id: "A2", team: "A", x: 0.5, y: 0.3 },
  { id: "B1", team: "B", x: 0.75, y: 0.5 },
  { id: "B2", team: "B", x: 0.6, y: 0.8 },
];

const base = { showZones: true, showPasses: true, labels: false } as const;

describe("opcoes da cena (campo 3D)", () => {
  it("aspect alarga o campo e a posicao dos jogadores", () => {
    const tactical = createTacticalGroup();
    updateTacticalGroup(tactical, players, { ...base, aspect: 2 });
    tickTacticalGroup(tactical, 1000);

    expect(tactical.group.getObjectByName("ground")!.scale.x).toBe(2);
    const tokens = tactical.group.getObjectByName("tokens")!;
    const a1 = tokens.children.find((c) => c.userData.playerId === "A1")!;
    expect(a1.position.x).toBeCloseTo((0.25 - 0.5) * 2, 5);
    tactical.dispose();
  });

  it("pawnScale reduz o peao e heightScale reduz as zonas", () => {
    const small = createTacticalGroup();
    const full = createTacticalGroup();
    updateTacticalGroup(small, players, { ...base, pawnScale: 0.5, heightScale: 0.5 });
    updateTacticalGroup(full, players, base);

    const pawn = (t: ReturnType<typeof createTacticalGroup>) =>
      t.group.getObjectByName("tokens")!.children[0].scale.x;
    expect(pawn(small)).toBeCloseTo(pawn(full) * 0.5, 5);

    const zoneDepth = (t: ReturnType<typeof createTacticalGroup>) => {
      const zone = t.group.getObjectByName("zones")!.children[0].children[0] as unknown as {
        geometry: { parameters: { options: { depth: number } } };
      };
      return zone.geometry.parameters.options.depth;
    };
    expect(zoneDepth(small)).toBeCloseTo(zoneDepth(full) * 0.5, 5);
    small.dispose();
    full.dispose();
  });

  it("maxPassDistance corta passes longos", () => {
    const near = createTacticalGroup();
    const all = createTacticalGroup();
    updateTacticalGroup(near, players, { ...base, maxPassDistance: 0.1 });
    updateTacticalGroup(all, players, base);
    const lines = (t: ReturnType<typeof createTacticalGroup>) =>
      t.group.getObjectByName("lines")!.children.length;
    expect(lines(near)).toBeLessThan(lines(all));
    near.dispose();
    all.dispose();
  });
});
