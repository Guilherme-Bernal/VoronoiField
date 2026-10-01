import type * as THREE from "three";

export interface MindARAnchor {
  group: THREE.Group;
  onTargetFound: (() => void) | null;
  onTargetLost: (() => void) | null;
}

export class MindARThree {
  constructor(options: {
    container: HTMLElement;
    imageTargetSrc: string;
    userDeviceId?: string | null;
    environmentDeviceId?: string | null;
  });
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  addAnchor(targetIndex: number): MindARAnchor;
  start(): Promise<void>;
  stop(): void;
}
