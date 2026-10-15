import { describe, expect, it } from "vitest";
import * as THREE from "three";
import {
  createTacticalGroup,
  revealTactical,
  tickTacticalGroup,
  updateTacticalGroup,
} from "../tacticalScene";
import type { Player } from "../../../tactics/engine";

function findGroup(root: THREE.Group, name: string): THREE.Group {
  const found = root.getObjectByName(name);
  if (!found) throw new Error(`grupo "${name}" nao encontrado`);
  return found as THREE.Group;
}

describe("animacoes da cena", () => {
  const players: Player[] = [
    { id: "A1", team: "A", x: 0.2, y: 0.5 },
    { id: "A2", team: "A", x: 0.4, y: 0.5 },
    { id: "B1", team: "B", x: 0.8, y: 0.5 },
  ];
  const options = { showZones: true, showPasses: true };

  const tokenX = (tactical: ReturnType<typeof createTacticalGroup>) =>
    findGroup(tactical.group, "tokens").children.find(
      (child) => child.userData.playerId === "A1"
    )!.position.x;

  it("desliza o jogador ate a nova posicao ao longo dos frames", () => {
    const tactical = createTacticalGroup();
    updateTacticalGroup(tactical, players, options);
    updateTacticalGroup(
      tactical,
      players.map((p) => (p.id === "A1" ? { ...p, x: 0.6 } : p)),
      options
    );

    const before = tokenX(tactical);
    expect(before).toBeCloseTo(0.2 - 0.5);

    tickTacticalGroup(tactical, 1000);
    tickTacticalGroup(tactical, 1016);
    expect(tokenX(tactical)).toBeGreaterThan(before);
    expect(tokenX(tactical)).toBeLessThan(0.6 - 0.5);

    for (let i = 0; i < 200; i++) tickTacticalGroup(tactical, 1032 + i * 16);
    expect(tokenX(tactical)).toBeCloseTo(0.6 - 0.5, 3);
  });

  it("o jogador arrastado acompanha a posicao sem atraso", () => {
    const tactical = createTacticalGroup();
    updateTacticalGroup(tactical, players, options);
    updateTacticalGroup(
      tactical,
      players.map((p) => (p.id === "A1" ? { ...p, x: 0.6 } : p)),
      { ...options, draggingId: "A1" }
    );

    expect(tokenX(tactical)).toBeCloseTo(0.6 - 0.5);
  });

  it("cria um pulso de luz para cada passe livre", () => {
    const tactical = createTacticalGroup();
    updateTacticalGroup(tactical, players, options);

    expect(findGroup(tactical.group, "pulses").children).toHaveLength(1);
  });

  it("a animacao de entrada termina com as camadas na escala normal", () => {
    const tactical = createTacticalGroup();
    updateTacticalGroup(tactical, players, options);
    revealTactical(tactical, 0);

    tickTacticalGroup(tactical, 100);
    expect(findGroup(tactical.group, "zones").scale.z).toBeLessThan(1);

    tickTacticalGroup(tactical, 5000);
    expect(findGroup(tactical.group, "zones").scale.z).toBe(1);
  });
});
