import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  createTacticalGroup,
  type TacticalGroup,
} from "../ar/tacticalScene";
import { makePitchTexture } from "./pitchTexture";

/** Campo real: 105 m x 68 m. A altura do campo vale 1 unidade na cena. */
export const PITCH_ASPECT = 105 / 68;

export type CameraPreset = "tv" | "aerea" | "lateral" | "gol";

export const CAMERA_PRESETS: Record<
  CameraPreset,
  { label: string; position: [number, number, number]; target: [number, number, number] }
> = {
  tv: { label: "TV", position: [0, -1.25, 0.85], target: [0, 0, 0] },
  aerea: { label: "Aérea", position: [0, -0.25, 2.1], target: [0, 0, 0] },
  lateral: { label: "Lateral", position: [-1.75, -0.55, 0.55], target: [0.1, 0, 0] },
  gol: { label: "Atrás do gol", position: [-1.9, 0, 0.42], target: [0.2, 0, 0] },
};

export interface StadiumOptions {
  /** Permite girar a camera e arrastar jogadores. */
  interactive?: boolean;
  /** Camera passeia devagar em volta do campo (tela inicial). */
  autoOrbit?: boolean;
  pixelRatioCap?: number;
}

export interface StadiumView {
  tactical: TacticalGroup;
  controls: OrbitControls;
  setPreset: (preset: CameraPreset) => void;
  update: (now: number) => void;
  render: () => void;
  resize: () => void;
  /** Id do jogador sob o ponteiro, se houver. */
  pick: (event: PointerEvent) => string | null;
  /** Ponto do campo sob o ponteiro, normalizado em 0..1. */
  groundPoint: (event: PointerEvent) => { x: number; y: number } | null;
  dispose: () => void;
}

function makeCrowdTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#0a1a13";
  ctx.fillRect(0, 0, 512, 128);
  const colors = ["#2f6fed", "#e0483e", "#f4f7f3", "#f2b705", "#1f6a42", "#9aa0a6"];
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 2600; i++) {
    ctx.globalAlpha = 0.25 + rand() * 0.5;
    ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
    ctx.fillRect(rand() * 512, rand() * 128, 2, 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.repeat.set(3, 1);
  return texture;
}

const PITCH_H = 68;

function addGoal(scene: THREE.Scene, side: 1 | -1) {
  const unit = 1 / PITCH_H;
  const width = 7.32 * unit;
  const height = 2.44 * unit;
  const depth = 2.2 * unit;
  const x = (side * PITCH_ASPECT) / 2;

  const post = new THREE.MeshStandardMaterial({ color: 0xf4f7f3, roughness: 0.4 });
  const group = new THREE.Group();
  const r = 0.0016;
  const postGeometry = new THREE.CylinderGeometry(r, r, height, 8);
  [-1, 1].forEach((k) => {
    const p = new THREE.Mesh(postGeometry, post);
    p.rotation.x = Math.PI / 2;
    p.position.set(0, (k * width) / 2, height / 2);
    group.add(p);
  });
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(r, r, width, 8), post);
  bar.position.set(0, 0, height);
  group.add(bar);

  const net = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(depth, width, height, 4, 10, 4)),
    new THREE.LineBasicMaterial({ color: 0xf4f7f3, transparent: true, opacity: 0.22 })
  );
  net.position.set((side * depth) / 2, 0, height / 2);
  group.add(net);

  group.position.set(x, 0, 0);
  scene.add(group);
}

function addStands(scene: THREE.Scene, crowd: THREE.Texture) {
  // Cada arquibancada so aparece de frente (FrontSide): vista por tras ela some
  // e nao tapa a camera.
  const material = new THREE.MeshBasicMaterial({
    map: crowd,
    color: 0xa9b8b0,
    side: THREE.FrontSide,
  });
  const tilt = THREE.MathUtils.degToRad(30);
  const extent = 0.42;

  // [comprimento, distancia do centro do campo, rotacao em Z]
  const sides: [number, number, number][] = [
    [PITCH_ASPECT + 0.9, 0.5 + 0.04 + (extent * Math.cos(tilt)) / 2, 0],
    [PITCH_ASPECT + 0.9, 0.5 + 0.04 + (extent * Math.cos(tilt)) / 2, Math.PI],
    [1.9, PITCH_ASPECT / 2 + 0.04 + (extent * Math.cos(tilt)) / 2, Math.PI / 2],
    [1.9, PITCH_ASPECT / 2 + 0.04 + (extent * Math.cos(tilt)) / 2, -Math.PI / 2],
  ];

  sides.forEach(([length, distance, rotation]) => {
    const holder = new THREE.Group();
    holder.rotation.z = rotation;
    const stand = new THREE.Mesh(new THREE.PlaneGeometry(length, extent), material);
    stand.rotation.x = -tilt;
    stand.position.set(0, -distance, (extent * Math.sin(tilt)) / 2);
    holder.add(stand);
    scene.add(holder);
  });
}

function addFloodlights(scene: THREE.Scene) {
  const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x2b3a33, roughness: 0.8 });
  const lampMaterial = new THREE.MeshBasicMaterial({ color: 0xfff6d6 });
  const corners: [number, number][] = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ];
  corners.forEach(([sx, sy]) => {
    const x = sx * (PITCH_ASPECT / 2 + 0.55);
    const y = sy * 0.95;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.9, 8), poleMaterial);
    pole.rotation.x = Math.PI / 2;
    pole.position.set(x, y, 0.45);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.05), lampMaterial);
    head.position.set(x, y, 0.92);
    head.lookAt(0, 0, 0.3);
    scene.add(pole, head);
  });
}

export function createStadium(
  container: HTMLElement,
  options: StadiumOptions = {}
): StadiumView {
  const { interactive = true, autoOrbit = false, pixelRatioCap = 2 } = options;

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const canvas = renderer.domElement;
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.touchAction = interactive ? "none" : "auto";
  container.appendChild(canvas);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x06120d);
  scene.fog = new THREE.FogExp2(0x06120d, 0.2);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 30);
  camera.up.set(0, 0, 1);
  const start = CAMERA_PRESETS.tv;
  camera.position.set(...start.position);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 0.45;
  controls.maxDistance = 3.4;
  controls.maxPolarAngle = Math.PI * 0.47;
  controls.target.set(...start.target);
  controls.enabled = interactive;

  // Gramado e entorno
  const pitchTexture = makePitchTexture();
  const pitch = new THREE.Mesh(
    new THREE.PlaneGeometry(PITCH_ASPECT, 1),
    new THREE.MeshStandardMaterial({ map: pitchTexture, roughness: 1 })
  );
  pitch.receiveShadow = true;
  scene.add(pitch);

  const apron = new THREE.Mesh(
    new THREE.PlaneGeometry(PITCH_ASPECT + 3, 4),
    new THREE.MeshStandardMaterial({ color: 0x0b2417, roughness: 1 })
  );
  apron.position.z = -0.003;
  apron.receiveShadow = true;
  scene.add(apron);

  const crowd = makeCrowdTexture();
  addStands(scene, crowd);
  addGoal(scene, 1);
  addGoal(scene, -1);
  addFloodlights(scene);

  // Luzes
  scene.add(new THREE.HemisphereLight(0xbfd8ff, 0x0a2a18, 0.7));
  const key = new THREE.DirectionalLight(0xfff1d6, 1.6);
  key.position.set(-0.7, -0.9, 1.7);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -1.4;
  key.shadow.camera.right = 1.4;
  key.shadow.camera.top = 1.1;
  key.shadow.camera.bottom = -1.1;
  key.shadow.camera.near = 0.2;
  key.shadow.camera.far = 5;
  key.shadow.bias = -0.002;
  key.shadow.normalBias = 0.012;
  scene.add(key, key.target);

  const tactical = createTacticalGroup();
  tactical.group.position.z = 0.0015;
  scene.add(tactical.group);

  // Camera
  let goalPosition = new THREE.Vector3(...start.position);
  let goalTarget = new THREE.Vector3(...start.target);
  let transitioning = false;
  let last: number | null = null;

  const setPreset = (preset: CameraPreset) => {
    const p = CAMERA_PRESETS[preset];
    goalPosition = new THREE.Vector3(...p.position);
    goalTarget = new THREE.Vector3(...p.target);
    transitioning = true;
  };

  const resize = () => {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  const update = (now: number) => {
    const dt = last === null ? 0.016 : Math.min(0.05, (now - last) / 1000);
    last = now;

    if (autoOrbit) {
      const t = now / 1000;
      const angle = Math.sin(t * 0.09) * 0.55;
      const radius = 2.05;
      // Em telas largas o campo fica a direita, para o titulo respirar.
      const shift = camera.aspect > 1.2 ? -0.42 : 0;
      camera.position.set(
        shift + Math.sin(angle) * radius,
        -Math.cos(angle) * radius,
        0.95 + Math.sin(t * 0.07) * 0.08
      );
      camera.lookAt(shift + 0.12, 0, 0.02);
      return;
    }

    if (transitioning) {
      const k = 1 - Math.exp(-dt * 4);
      camera.position.lerp(goalPosition, k);
      controls.target.lerp(goalTarget, k);
      if (
        camera.position.distanceTo(goalPosition) < 0.01 &&
        controls.target.distanceTo(goalTarget) < 0.01
      ) {
        transitioning = false;
      }
    }
    controls.update();
  };

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const setPointer = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
  };

  const pick = (event: PointerEvent) => {
    const tokens = tactical.group.getObjectByName("tokens");
    if (!tokens) return null;
    setPointer(event);
    const hit = raycaster
      .intersectObjects(tokens.children, true)
      .find((i) => i.object.userData.playerId);
    return hit ? (hit.object.userData.playerId as string) : null;
  };

  const groundPoint = (event: PointerEvent) => {
    const ground = tactical.group.getObjectByName("ground");
    if (!ground) return null;
    setPointer(event);
    const hit = raycaster.intersectObject(ground, false)[0];
    if (!hit) return null;
    const local = ground.worldToLocal(hit.point.clone());
    return { x: local.x + 0.5, y: 0.5 - local.y };
  };

  const dispose = () => {
    observer.disconnect();
    controls.dispose();
    tactical.dispose();
    scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      (Array.isArray(material) ? material : material ? [material] : []).forEach((m) =>
        m.dispose()
      );
    });
    pitchTexture.dispose();
    crowd.dispose();
    renderer.dispose();
    canvas.remove();
  };

  return {
    tactical,
    controls,
    setPreset,
    update,
    render: () => renderer.render(scene, camera),
    resize,
    pick,
    groundPoint,
    dispose,
  };
}
