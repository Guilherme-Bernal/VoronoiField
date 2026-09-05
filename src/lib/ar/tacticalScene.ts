import * as THREE from "three";
import {
  computePassingLines,
  computeVoronoiZones,
  type Player,
} from "../../tactics/engine";

const TEAM_COLOR: Record<"A" | "B", number> = {
  A: 0x2f6fed,
  B: 0xe0483e,
};

export interface TacticalGroupOptions {
  showZones: boolean;
  showPasses: boolean;
}

export interface TacticalGroup {
  group: THREE.Group;
  dispose: () => void;
}

function disposeChild(child: THREE.Object3D) {
  if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
    child.geometry.dispose();
    const material = child.material;
    if (Array.isArray(material)) {
      material.forEach((m) => m.dispose());
    } else {
      material.dispose();
    }
  }
}

function clearGroup(group: THREE.Group) {
  while (group.children.length) {
    const child = group.children[0];
    group.remove(child);
    disposeChild(child);
  }
}

function toWorld(x: number, y: number): [number, number] {
  return [x - 0.5, 0.5 - y];
}

export function createTacticalGroup(): TacticalGroup {
  const group = new THREE.Group();
  group.name = "tactical-group";

  const zonesGroup = new THREE.Group();
  zonesGroup.name = "zones";
  const linesGroup = new THREE.Group();
  linesGroup.name = "lines";
  const tokensGroup = new THREE.Group();
  tokensGroup.name = "tokens";

  group.add(zonesGroup, linesGroup, tokensGroup);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.001 })
  );
  ground.name = "ground";
  group.add(ground);

  const dispose = () => group.traverse(disposeChild);

  return { group, dispose };
}

export function updateTacticalGroup(
  tactical: TacticalGroup,
  players: Player[],
  options: TacticalGroupOptions
) {
  const zonesGroup = tactical.group.getObjectByName("zones") as THREE.Group;
  const linesGroup = tactical.group.getObjectByName("lines") as THREE.Group;
  const tokensGroup = tactical.group.getObjectByName("tokens") as THREE.Group;

  clearGroup(zonesGroup);
  clearGroup(linesGroup);
  clearGroup(tokensGroup);

  if (options.showZones) {
    computeVoronoiZones(players).forEach((zone) => {
      if (zone.polygon.length < 3) return;
      const shape = new THREE.Shape();
      zone.polygon.forEach(([px, py], idx) => {
        const [wx, wy] = toWorld(px, py);
        if (idx === 0) {
          shape.moveTo(wx, wy);
        } else {
          shape.lineTo(wx, wy);
        }
      });
      const mesh = new THREE.Mesh(
        new THREE.ShapeGeometry(shape),
        new THREE.MeshBasicMaterial({
          color: TEAM_COLOR[zone.team],
          transparent: true,
          opacity: 0.18,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      );
      mesh.position.z = 0.001;
      zonesGroup.add(mesh);
    });
  }

  if (options.showPasses) {
    computePassingLines(players).forEach((line) => {
      const from = players.find((p) => p.id === line.from);
      const to = players.find((p) => p.id === line.to);
      if (!from || !to) return;
      const [fx, fy] = toWorld(from.x, from.y);
      const [tx, ty] = toWorld(to.x, to.y);
      const lineObj = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(fx, fy, 0.002),
          new THREE.Vector3(tx, ty, 0.002),
        ]),
        new THREE.LineBasicMaterial({
          color: line.blocked ? 0x9aa0a6 : 0xf2b705,
          transparent: true,
          opacity: line.blocked ? 0.35 : 0.95,
        })
      );
      linesGroup.add(lineObj);
    });
  }

  players.forEach((player) => {
    const [wx, wy] = toWorld(player.x, player.y);

    const token = new THREE.Mesh(
      new THREE.CircleGeometry(0.022, 24),
      new THREE.MeshBasicMaterial({ color: TEAM_COLOR[player.team] })
    );
    token.position.set(wx, wy, 0.003);
    token.userData.playerId = player.id;
    tokensGroup.add(token);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.024, 0.028, 24),
      new THREE.MeshBasicMaterial({ color: 0xf3f7f2 })
    );
    ring.position.set(wx, wy, 0.0035);
    tokensGroup.add(ring);
  });
}

