import type * as THREE from "three";

export interface MindARAnchor {
  group: THREE.Group;
  onTargetFound: (() => void) | null;
  onTargetLost: (() => void) | null;
}

export interface MindARThreeInstance {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  addAnchor(targetIndex: number): MindARAnchor;
  start(): Promise<void>;
  stop(): void;
}

export interface MindARThreeConstructor {
  new (options: {
    container: HTMLElement;
    imageTargetSrc: string;
  }): MindARThreeInstance;
}

declare global {
  interface Window {
    MINDAR: {
      IMAGE: {
        MindARThree: MindARThreeConstructor;
      };
    };
  }
}
