import { describe, expect, it } from "vitest";
import * as THREE from "three";
import {
  createTacticalGroup,
  updateTacticalGroup,
} from "../tacticalScene";
import type { Player } from "../../../tactics/engine";

function findGroup(root: THREE.Group, name: string): THREE.Group {
  const found = root.getObjectByName(name);
  if (!found) throw new Error(`grupo "${name}" nao encontrado`);
  return found as THREE.Group;
}

describe("createTacticalGroup", () => {
  it("cria a estrutura base com zones, lines, tokens e ground", () => {
    const tactical = createTacticalGroup();

    expect(tactical.group.name).toBe("tactical-group");
    expect(findGroup(tactical.group, "zones")).toBeInstanceOf(THREE.Group);
    expect(findGroup(tactical.group, "lines")).toBeInstanceOf(THREE.Group);
    expect(findGroup(tactical.group, "tokens")).toBeInstanceOf(THREE.Group);
    expect(tactical.group.getObjectByName("ground")).toBeInstanceOf(
      THREE.Mesh
    );
  });

  it("dispose nao lanca erro mesmo sem conteudo", () => {
    const tactical = createTacticalGroup();
    expect(() => tactical.dispose()).not.toThrow();
  });
});

describe("updateTacticalGroup", () => {
  const players: Player[] = [
    { id: "A1", team: "A", x: 0.2, y: 0.5 },
    { id: "A2", team: "A", x: 0.4, y: 0.5 },
    { id: "B1", team: "B", x: 0.8, y: 0.5 },
  ];

  it("gera um token e um anel para cada jogador", () => {
    const tactical = createTacticalGroup();
    updateTacticalGroup(tactical, players, {
      showZones: false,
      showPasses: false,
    });

    const tokens = findGroup(tactical.group, "tokens");
    expect(tokens.children).toHaveLength(players.length * 2);
  });

  it("posiciona o token do jogador convertendo coordenadas normalizadas", () => {
    const tactical = createTacticalGroup();
    updateTacticalGroup(tactical, players, {
      showZones: false,
      showPasses: false,
    });

    const tokens = findGroup(tactical.group, "tokens");
    const token = tokens.children.find(
      (child) => child.userData.playerId === "A1"
    );

    expect(token).toBeDefined();
    expect(token!.position.x).toBeCloseTo(0.2 - 0.5);
    expect(token!.position.y).toBeCloseTo(0.5 - 0.5);
  });

  it("nao gera zonas quando showZones e false", () => {
    const tactical = createTacticalGroup();
    updateTacticalGroup(tactical, players, {
      showZones: false,
      showPasses: true,
    });

    const zones = findGroup(tactical.group, "zones");
    expect(zones.children).toHaveLength(0);
  });

  it("gera zonas quando showZones e true", () => {
    const tactical = createTacticalGroup();
    updateTacticalGroup(tactical, players, {
      showZones: true,
      showPasses: false,
    });

    const zones = findGroup(tactical.group, "zones");
    expect(zones.children.length).toBeGreaterThan(0);
    expect(zones.children.length).toBeLessThanOrEqual(players.length);
  });

  it("gera uma linha de passe para o par do mesmo time e nenhuma entre times diferentes", () => {
    const tactical = createTacticalGroup();
    updateTacticalGroup(tactical, players, {
      showZones: false,
      showPasses: true,
    });

    const lines = findGroup(tactical.group, "lines");
    // A1-A2 e o unico par do mesmo time nesse cenario
    expect(lines.children).toHaveLength(1);
  });

  it("limpa o conteudo anterior antes de redesenhar", () => {
    const tactical = createTacticalGroup();
    updateTacticalGroup(tactical, players, {
      showZones: true,
      showPasses: true,
    });
    updateTacticalGroup(tactical, players.slice(0, 1), {
      showZones: true,
      showPasses: true,
    });

    const tokens = findGroup(tactical.group, "tokens");
    expect(tokens.children).toHaveLength(2);
  });
});
