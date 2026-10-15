import * as THREE from "three";
import {
  computeBestPass,
  computeOffside,
  computePassingLines,
  computeVoronoiZones,
  polygonArea,
  type Player,
  type Team,
} from "../../tactics/engine";

const TEAM_COLOR: Record<Team, number> = {
  A: 0x2f6fed,
  B: 0xe0483e,
};
const PASS_COLOR = 0xf2b705;
const BLOCKED_COLOR = 0x9aa0a6;
const BEST_COLOR = 0x5dffb0;
const OFFSIDE_COLOR = 0xff5a4d;

const GLIDE_SPEED = 16;
const REVEAL_MS = 1100;

export interface TacticalGroupOptions {
  showZones: boolean;
  showPasses: boolean;
  /** Jogador sendo arrastado: fica "levantado" e sem atraso. */
  draggingId?: string | null;
  /** Mostra o numero flutuando acima de cada jogador. */
  labels?: boolean;
  /** Portador da bola: habilita bola, melhor passe e impedimento. */
  ballCarrierId?: string | null;
  showOffside?: boolean;
  /** Proporcao do campo (padrao 1). O simulador 3D usa 105/68. */
  aspect?: number;
  /** Desenha so passes mais curtos que isto (0..1); alivia o celular com 22 jogadores. */
  maxPassDistance?: number;
  /** Escala dos peoes (1 no AR; menor no campo 3D de tamanho real). */
  pawnScale?: number;
  /** Escala da altura das zonas e dos arcos de passe. */
  heightScale?: number;
  /** Opacidade das zonas (padrao 0.26). */
  zoneOpacity?: number;
}

interface PlayerVisual {
  id: string;
  team: Team;
  group: THREE.Group;
  pawn: THREE.Group;
  shadow: THREE.Mesh;
  label: THREE.Sprite | null;
  display: { x: number; y: number };
  target: { x: number; y: number };
  lift: number;
  drop: number;
}

interface Pulse {
  mesh: THREE.Mesh;
  curve: THREE.Curve<THREE.Vector3>;
  phase: number;
}

interface SceneState {
  visuals: Map<string, PlayerVisual>;
  players: Player[];
  options: TacticalGroupOptions;
  lastTime: number | null;
  lastRebuild: number;
  pendingRebuild: boolean;
  revealStart: number | null;
  pulses: Pulse[];
  ball: THREE.Mesh;
  ballDisplay: { x: number; y: number } | null;
  labelTextures: Map<string, THREE.CanvasTexture>;
  teamMaterials: Record<Team, THREE.MeshStandardMaterial>;
  bodyGeometry: THREE.BufferGeometry;
  headGeometry: THREE.BufferGeometry;
  ringGeometry: THREE.BufferGeometry;
  shadowGeometry: THREE.BufferGeometry;
  hitGeometry: THREE.BufferGeometry;
  ringMaterial: THREE.MeshBasicMaterial;
  shadowMaterial: THREE.MeshBasicMaterial;
  hitMaterial: THREE.MeshBasicMaterial;
  border: THREE.LineLoop;
}

export interface TacticalGroup {
  group: THREE.Group;
  dispose: () => void;
  state: SceneState;
}

function disposeObject(object: THREE.Object3D) {
  const target = object as THREE.Mesh;
  target.geometry?.dispose();
  const material = target.material as
    | THREE.Material
    | THREE.Material[]
    | undefined;
  if (Array.isArray(material)) {
    material.forEach((m) => m.dispose());
  } else {
    material?.dispose();
  }
}

function clearGroup(group: THREE.Group) {
  while (group.children.length) {
    const child = group.children[0];
    group.remove(child);
    child.traverse(disposeObject);
  }
}

/** Proporcao largura/altura do campo (1 = quadrado do marcador; 105/68 = campo real). */
let aspect = 1;
let pawnScale = 1;
let heightScale = 1;

function toWorld(x: number, y: number): [number, number] {
  return [(x - 0.5) * aspect, 0.5 - y];
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function makeLabelTexture(text: string): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.font = '700 88px "IBM Plex Sans", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 14;
  ctx.strokeStyle = "rgba(8, 25, 18, 0.9)";
  ctx.strokeText(text, 64, 70);
  ctx.fillStyle = "#f4f7f3";
  ctx.fillText(text, 64, 70);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createTacticalGroup(): TacticalGroup {
  const group = new THREE.Group();
  group.name = "tactical-group";

  const zonesGroup = new THREE.Group();
  zonesGroup.name = "zones";
  const linesGroup = new THREE.Group();
  linesGroup.name = "lines";
  const pulsesGroup = new THREE.Group();
  pulsesGroup.name = "pulses";
  const tokensGroup = new THREE.Group();
  tokensGroup.name = "tokens";
  const offsideGroup = new THREE.Group();
  offsideGroup.name = "offside";

  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.013, 20, 14),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.35,
      roughness: 0.4,
    })
  );
  ball.name = "ball";
  ball.visible = false;

  const ambient = new THREE.AmbientLight(0xffffff, 1.4);
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(0.3, -0.5, 1);
  group.add(ambient, sun, sun.target);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.001 })
  );
  ground.name = "ground";

  const border = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.5, -0.5, 0.001),
      new THREE.Vector3(0.5, -0.5, 0.001),
      new THREE.Vector3(0.5, 0.5, 0.001),
      new THREE.Vector3(-0.5, 0.5, 0.001),
    ]),
    new THREE.LineBasicMaterial({
      color: PASS_COLOR,
      transparent: true,
      opacity: 0.5,
    })
  );
  border.name = "border";

  group.add(
    ground,
    border,
    zonesGroup,
    linesGroup,
    pulsesGroup,
    offsideGroup,
    tokensGroup,
    ball
  );

  const teamMaterial = (color: number) =>
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.18,
      roughness: 0.45,
      metalness: 0.1,
    });

  const state: SceneState = {
    visuals: new Map(),
    players: [],
    options: { showZones: true, showPasses: true },
    lastTime: null,
    lastRebuild: 0,
    pendingRebuild: false,
    revealStart: null,
    pulses: [],
    ball,
    ballDisplay: null,
    labelTextures: new Map(),
    teamMaterials: {
      A: teamMaterial(TEAM_COLOR.A),
      B: teamMaterial(TEAM_COLOR.B),
    },
    bodyGeometry: new THREE.CylinderGeometry(0.014, 0.025, 0.07, 24),
    headGeometry: new THREE.SphereGeometry(0.019, 20, 16),
    ringGeometry: new THREE.RingGeometry(0.028, 0.034, 32),
    shadowGeometry: new THREE.CircleGeometry(0.032, 24),
    hitGeometry: new THREE.CylinderGeometry(0.045, 0.045, 0.14, 12),
    ringMaterial: new THREE.MeshBasicMaterial({ color: 0xf3f7f2 }),
    shadowMaterial: new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    }),
    hitMaterial: new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
    border,
  };

  const dispose = () => {
    group.traverse(disposeObject);
    state.labelTextures.forEach((texture) => texture.dispose());
    state.bodyGeometry.dispose();
    state.headGeometry.dispose();
    state.ringGeometry.dispose();
    state.shadowGeometry.dispose();
    state.hitGeometry.dispose();
    state.teamMaterials.A.dispose();
    state.teamMaterials.B.dispose();
    state.ringMaterial.dispose();
    state.shadowMaterial.dispose();
    state.hitMaterial.dispose();
  };

  return { group, dispose, state };
}

function getGroup(tactical: TacticalGroup, name: string): THREE.Group {
  return tactical.group.getObjectByName(name) as THREE.Group;
}

function createVisual(tactical: TacticalGroup, player: Player): PlayerVisual {
  const s = tactical.state;
  const group = new THREE.Group();
  group.userData.playerId = player.id;

  // Area de toque maior que o desenho, para facilitar arrastar com o dedo.
  const hit = new THREE.Mesh(s.hitGeometry, s.hitMaterial);
  hit.rotation.x = Math.PI / 2;
  hit.position.z = 0.07;
  hit.userData.playerId = player.id;

  const ring = new THREE.Mesh(s.ringGeometry, s.ringMaterial);
  ring.position.z = 0.0006;
  ring.userData.playerId = player.id;

  const shadow = new THREE.Mesh(s.shadowGeometry, s.shadowMaterial);
  shadow.position.z = 0.0004;

  // O eixo Y local do peao aponta para cima (eixo Z do marcador).
  const pawn = new THREE.Group();
  pawn.rotation.x = Math.PI / 2;
  const material = s.teamMaterials[player.team];
  const body = new THREE.Mesh(s.bodyGeometry, material);
  body.castShadow = true;
  body.position.y = 0.035;
  body.userData.playerId = player.id;
  const head = new THREE.Mesh(s.headGeometry, material);
  head.castShadow = true;
  head.position.y = 0.088;
  head.userData.playerId = player.id;
  pawn.add(body, head);

  group.add(hit, ring, shadow, pawn);

  return {
    id: player.id,
    team: player.team,
    group,
    pawn,
    shadow,
    label: null,
    display: { x: player.x, y: player.y },
    target: { x: player.x, y: player.y },
    lift: 0,
    drop: 1,
  };
}

function ensureLabel(tactical: TacticalGroup, visual: PlayerVisual) {
  if (visual.label) return;
  const s = tactical.state;
  const text = visual.id.replace(/^[A-Za-z]+/, "");
  let texture = s.labelTextures.get(text);
  if (!texture) {
    const created = makeLabelTexture(text);
    if (!created) return;
    texture = created;
    s.labelTextures.set(text, texture);
  }
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    })
  );
  sprite.scale.set(0.055, 0.055, 1);
  sprite.userData.playerId = visual.id;
  visual.group.add(sprite);
  visual.label = sprite;
}

function removeVisual(visual: PlayerVisual) {
  visual.group.removeFromParent();
  visual.label?.material.dispose();
}

function placeVisual(visual: PlayerVisual) {
  const [wx, wy] = toWorld(visual.display.x, visual.display.y);
  visual.group.position.set(wx, wy, 0);
  visual.group.scale.setScalar(pawnScale);

  const z = visual.lift * 0.035 + (1 - visual.drop) * 0.3;
  visual.pawn.position.z = z;
  visual.pawn.scale.setScalar(
    Math.max(0.001, (1 + visual.lift * 0.15) * (0.4 + 0.6 * visual.drop))
  );
  visual.shadow.scale.setScalar(
    Math.max(0.001, (1 + visual.lift * 0.3) * (0.3 + 0.7 * visual.drop))
  );
  if (visual.label) visual.label.position.z = 0.135 + z;
}

function syncPlayers(tactical: TacticalGroup, players: Player[]) {
  const s = tactical.state;
  const tokens = getGroup(tactical, "tokens");
  const ids = new Set(players.map((p) => p.id));

  s.visuals.forEach((visual, id) => {
    if (!ids.has(id)) {
      removeVisual(visual);
      s.visuals.delete(id);
    }
  });

  players.forEach((player) => {
    let visual = s.visuals.get(player.id);
    if (!visual) {
      visual = createVisual(tactical, player);
      s.visuals.set(player.id, visual);
      tokens.add(visual.group);
    } else {
      visual.target.x = player.x;
      visual.target.y = player.y;
    }
    // O jogador arrastado acompanha o dedo sem atraso.
    if (s.options.draggingId === player.id) {
      visual.display.x = player.x;
      visual.display.y = player.y;
    }
    if (s.options.labels) ensureLabel(tactical, visual);
  });

  s.players = players;
}

function rebuildOverlays(tactical: TacticalGroup) {
  const s = tactical.state;
  const zonesGroup = getGroup(tactical, "zones");
  const linesGroup = getGroup(tactical, "lines");
  const pulsesGroup = getGroup(tactical, "pulses");
  const offsideGroup = getGroup(tactical, "offside");

  clearGroup(offsideGroup);
  clearGroup(zonesGroup);
  clearGroup(linesGroup);
  clearGroup(pulsesGroup);
  s.pulses = [];

  const current: Player[] = s.players.map((p) => {
    const visual = s.visuals.get(p.id);
    return {
      ...p,
      x: visual ? visual.display.x : p.x,
      y: visual ? visual.display.y : p.y,
    };
  });

  if (s.options.showZones && current.length > 0) {
    const zones = computeVoronoiZones(current);
    const areas = zones.map((zone) => polygonArea(zone.polygon));
    const maxArea = Math.max(...areas, 1e-6);

    zones.forEach((zone, index) => {
      if (zone.polygon.length < 3) return;
      const points = zone.polygon.map(([px, py]) => {
        const [wx, wy] = toWorld(px, py);
        return new THREE.Vector2(wx, wy);
      });
      // Quanto maior a area dominada, mais alto o prisma.
      const height = (0.012 + 0.04 * (areas[index] / maxArea)) * heightScale;
      const color = TEAM_COLOR[zone.team];

      const mesh = new THREE.Mesh(
        new THREE.ExtrudeGeometry(new THREE.Shape(points), {
          depth: height,
          bevelEnabled: false,
        }),
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.25,
          transparent: true,
          opacity: s.options.zoneOpacity ?? 0.26,
          side: THREE.DoubleSide,
          depthWrite: false,
          roughness: 0.8,
        })
      );
      const outline = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(
          points.map((p) => new THREE.Vector3(p.x, p.y, height))
        ),
        new THREE.LineBasicMaterial({
          color: new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.35),
          transparent: true,
          opacity: 0.95,
        })
      );
      const zoneGroup = new THREE.Group();
      zoneGroup.position.z = 0.0008;
      zoneGroup.add(mesh, outline);
      zonesGroup.add(zoneGroup);
    });
  }

  if (s.options.showPasses) {
    const byId = new Map(current.map((p) => [p.id, p]));
    computePassingLines(current, 0.06, s.options.maxPassDistance ?? Infinity).forEach((line, index) => {
      const from = byId.get(line.from);
      const to = byId.get(line.to);
      if (!from || !to) return;
      const [fx, fy] = toWorld(from.x, from.y);
      const [tx, ty] = toWorld(to.x, to.y);
      const dist = Math.hypot(tx - fx, ty - fy);
      const baseZ = 0.03;
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(fx, fy, baseZ),
        new THREE.Vector3(
          (fx + tx) / 2,
          (fy + ty) / 2,
          baseZ + Math.min(dist, 0.6) * 0.5 * heightScale
        ),
        new THREE.Vector3(tx, ty, baseZ)
      );

      if (line.blocked) {
        const dashed = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(curve.getPoints(24)),
          new THREE.LineDashedMaterial({
            color: BLOCKED_COLOR,
            dashSize: 0.012,
            gapSize: 0.01,
            transparent: true,
            opacity: 0.55,
          })
        );
        dashed.computeLineDistances();
        linesGroup.add(dashed);
        return;
      }

      linesGroup.add(
        new THREE.Mesh(
          new THREE.TubeGeometry(curve, 24, 0.0032, 6, false),
          new THREE.MeshBasicMaterial({
            color: PASS_COLOR,
            transparent: true,
            opacity: 0.85,
          })
        )
      );

      const pulse = new THREE.Mesh(
        new THREE.SphereGeometry(0.0085, 12, 8),
        new THREE.MeshBasicMaterial({ color: 0xfff3c4 })
      );
      pulsesGroup.add(pulse);
      s.pulses.push({ mesh: pulse, curve, phase: (index * 0.37) % 1 });
    });
  }

  const carrierId = s.options.ballCarrierId ?? null;
  const offsideOn = s.options.showOffside ?? true;

  if (s.options.showPasses && carrierId) {
    const best = computeBestPass(current, carrierId, { offside: offsideOn });
    const from = current.find((p) => p.id === best?.from);
    const to = current.find((p) => p.id === best?.to);
    if (best && from && to) {
      const [fx, fy] = toWorld(from.x, from.y);
      const [tx, ty] = toWorld(to.x, to.y);
      const dist = Math.hypot(tx - fx, ty - fy);
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(fx, fy, 0.035),
        new THREE.Vector3((fx + tx) / 2, (fy + ty) / 2, 0.035 + Math.min(dist, 0.6) * 0.6 * heightScale),
        new THREE.Vector3(tx, ty, 0.035)
      );
      linesGroup.add(
        new THREE.Mesh(
          new THREE.TubeGeometry(curve, 28, 0.0068, 8, false),
          new THREE.MeshBasicMaterial({ color: BEST_COLOR })
        )
      );
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.04, 0.05, 40),
        new THREE.MeshBasicMaterial({
          color: BEST_COLOR,
          transparent: true,
          opacity: 0.95,
          side: THREE.DoubleSide,
        })
      );
      ring.position.set(tx, ty, 0.002);
      linesGroup.add(ring);
    }
  }

  const offside = offsideOn && carrierId ? computeOffside(current, carrierId) : null;
  if (offside) {
    const [lx] = toWorld(offside.x, 0);
    const height = 0.1;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        [lx, -0.5, 0, lx, 0.5, 0, lx, 0.5, height, lx, -0.5, height],
        3
      )
    );
    geometry.setIndex([0, 1, 2, 0, 2, 3]);
    offsideGroup.add(
      new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({
          color: OFFSIDE_COLOR,
          transparent: true,
          opacity: 0.2,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      ),
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(lx, -0.5, height),
          new THREE.Vector3(lx, 0.5, height),
        ]),
        new THREE.LineBasicMaterial({ color: OFFSIDE_COLOR })
      )
    );
    offside.offsideIds.forEach((id) => {
      const p = current.find((q) => q.id === id);
      if (!p) return;
      const [px, py] = toWorld(p.x, p.y);
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.036, 0.046, 32),
        new THREE.MeshBasicMaterial({
          color: OFFSIDE_COLOR,
          side: THREE.DoubleSide,
        })
      );
      ring.position.set(px, py, 0.003);
      offsideGroup.add(ring);
    });
  }
}

/**
 * Atualiza a cena com a nova lista de jogadores. Jogadores novos aparecem na
 * posicao final; os que ja existiam deslizam ate la nos frames seguintes
 * (veja tickTacticalGroup).
 */
export function updateTacticalGroup(
  tactical: TacticalGroup,
  players: Player[],
  options: TacticalGroupOptions
) {
  tactical.state.options = options;
  aspect = options.aspect ?? 1;
  pawnScale = options.pawnScale ?? 1;
  heightScale = options.heightScale ?? 1;
  getGroup(tactical, "ground").scale.x = aspect;
  getGroup(tactical, "border").scale.x = aspect;
  syncPlayers(tactical, players);
  tactical.state.visuals.forEach(placeVisual);
  rebuildOverlays(tactical);
}

/** Dispara a animacao de entrada (jogadores "caem" no campo, zonas sobem). */
export function revealTactical(
  tactical: TacticalGroup,
  now: number = performance.now()
) {
  tactical.state.revealStart = now;
}

/** Avanca as animacoes. Deve ser chamado a cada frame (requestAnimationFrame). */
export function tickTacticalGroup(
  tactical: TacticalGroup,
  now: number = performance.now()
) {
  const s = tactical.state;
  aspect = s.options.aspect ?? 1;
  pawnScale = s.options.pawnScale ?? 1;
  heightScale = s.options.heightScale ?? 1;
  const dt =
    s.lastTime === null ? 0.016 : Math.min(0.05, (now - s.lastTime) / 1000);
  s.lastTime = now;

  const k = 1 - Math.exp(-dt * GLIDE_SPEED);
  const dragging = s.options.draggingId ?? null;
  let moving = false;

  // Entrada: progresso de cada peao (escalonado) e das camadas.
  let elapsed = 0;
  let layerProgress = 1;
  if (s.revealStart !== null) {
    elapsed = now - s.revealStart;
    layerProgress = easeOutCubic(clamp01((elapsed - 200) / 700));
    if (elapsed > REVEAL_MS + s.visuals.size * 60) s.revealStart = null;
  }

  let index = 0;
  s.visuals.forEach((visual) => {
    const dx = visual.target.x - visual.display.x;
    const dy = visual.target.y - visual.display.y;
    if (Math.abs(dx) > 1e-4 || Math.abs(dy) > 1e-4) {
      visual.display.x += dx * k;
      visual.display.y += dy * k;
      moving = true;
    } else {
      visual.display.x = visual.target.x;
      visual.display.y = visual.target.y;
    }

    const wantLift = dragging === visual.id ? 1 : 0;
    visual.lift += (wantLift - visual.lift) * k;

    visual.drop =
      s.revealStart === null
        ? 1
        : easeOutCubic(clamp01((elapsed - index * 60) / 500));
    index += 1;

    placeVisual(visual);
  });

  const zScale = Math.max(0.001, layerProgress);
  getGroup(tactical, "zones").scale.z = zScale;
  getGroup(tactical, "lines").scale.z = zScale;
  getGroup(tactical, "pulses").scale.z = zScale;
  getGroup(tactical, "offside").scale.z = zScale;

  // Bola: acompanha o portador, com um arco curto quando viaja num passe.
  const carrier = s.options.ballCarrierId
    ? s.visuals.get(s.options.ballCarrierId)
    : undefined;
  s.ball.visible = !!carrier;
  if (carrier) {
    const goal = { x: carrier.display.x + 0.022, y: carrier.display.y + 0.012 };
    if (!s.ballDisplay) {
      s.ballDisplay = { ...goal };
    } else {
      const kb = 1 - Math.exp(-dt * 9);
      s.ballDisplay.x += (goal.x - s.ballDisplay.x) * kb;
      s.ballDisplay.y += (goal.y - s.ballDisplay.y) * kb;
    }
    const remaining = Math.hypot(goal.x - s.ballDisplay.x, goal.y - s.ballDisplay.y);
    const [bx, by] = toWorld(s.ballDisplay.x, s.ballDisplay.y);
    s.ball.position.set(bx, by, 0.014 + Math.min(remaining, 0.4) * 0.3);
  }

  // Reconstruir zonas e arcos custa caro: no maximo ~20x por segundo.
  if (moving) {
    if (now - s.lastRebuild >= 50) {
      rebuildOverlays(tactical);
      s.lastRebuild = now;
      s.pendingRebuild = false;
    } else {
      s.pendingRebuild = true;
    }
  } else if (s.pendingRebuild) {
    rebuildOverlays(tactical);
    s.lastRebuild = now;
    s.pendingRebuild = false;
  }

  const seconds = now / 1000;
  s.pulses.forEach((pulse) => {
    const t = (seconds * 0.45 + pulse.phase) % 1;
    pulse.mesh.position.copy(pulse.curve.getPoint(t));
    pulse.mesh.scale.setScalar(0.4 + 0.6 * Math.sin(Math.PI * t));
  });

  (s.border.material as THREE.LineBasicMaterial).opacity =
    0.35 + 0.2 * Math.sin(seconds * 2);
}
