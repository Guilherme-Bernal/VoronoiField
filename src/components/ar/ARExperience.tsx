import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useMindAR } from "../../lib/ar/useMindAR";
import {
  createTacticalGroup,
  updateTacticalGroup,
} from "../../lib/ar/tacticalScene";
import { useTacticalStore } from "../../state/tacticalStore";
import { ScanFrame } from "./ScanFrame";
import { HUD } from "../ui/HUD";
import styles from "./ARExperience.module.css";

const IMAGE_TARGET_SRC = "/markers/targets.mind";

export function ARExperience() {
  const { containerRef, mindARRef, anchorRef, targetFound, ready } =
    useMindAR(IMAGE_TARGET_SRC);

  const tacticalRef = useRef(createTacticalGroup());
  const draggingRef = useRef<string | null>(null);

  const players = useTacticalStore((s) => s.players);
  const showZones = useTacticalStore((s) => s.showZones);
  const showPasses = useTacticalStore((s) => s.showPasses);
  const setPlayerPosition = useTacticalStore((s) => s.setPlayerPosition);
  const startDrag = useTacticalStore((s) => s.startDrag);
  const endDrag = useTacticalStore((s) => s.endDrag);
  const setTargetFound = useTacticalStore((s) => s.setTargetFound);

  useEffect(() => {
    setTargetFound(targetFound);
  }, [targetFound, setTargetFound]);

  useEffect(() => {
    if (!ready || !mindARRef.current || !anchorRef.current) return;
    const anchor = anchorRef.current;
    const tactical = tacticalRef.current;
    anchor.group.add(tactical.group);

    return () => {
      anchor.group.remove(tactical.group);
      tactical.dispose();
    };
  }, [ready, mindARRef, anchorRef]);

  useEffect(() => {
    updateTacticalGroup(tacticalRef.current, players, {
      showZones,
      showPasses,
    });
  }, [players, showZones, showPasses]);

  useEffect(() => {
    const container = containerRef.current;
    const mindAR = mindARRef.current;
    if (!container || !mindAR || !ready) return;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const toNDC = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const handlePointerDown = (event: PointerEvent) => {
      toNDC(event);
      raycaster.setFromCamera(pointer, mindAR.camera);
      const tokens = tacticalRef.current.group.getObjectByName("tokens");
      if (!tokens) return;
      const hit = raycaster
        .intersectObjects(tokens.children, false)
        .find((intersection) => intersection.object.userData.playerId);
      if (hit) {
        const playerId = hit.object.userData.playerId as string;
        draggingRef.current = playerId;
        startDrag(playerId);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!draggingRef.current) return;
      const ground = tacticalRef.current.group.getObjectByName("ground");
      if (!ground) return;
      toNDC(event);
      raycaster.setFromCamera(pointer, mindAR.camera);
      const hits = raycaster.intersectObject(ground, false);
      if (!hits.length) return;
      const localPoint = ground.worldToLocal(hits[0].point.clone());
      setPlayerPosition(
        draggingRef.current,
        localPoint.x + 0.5,
        0.5 - localPoint.y
      );
    };

    const handlePointerUp = () => {
      draggingRef.current = null;
      endDrag();
    };

    container.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      container.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [
    ready,
    containerRef,
    mindARRef,
    setPlayerPosition,
    startDrag,
    endDrag,
  ]);

  return (
    <div className={styles.stage}>
      <div ref={containerRef} className={styles.viewport} />
      <ScanFrame visible={ready && !targetFound} />
      <HUD />
    </div>
  );
}
