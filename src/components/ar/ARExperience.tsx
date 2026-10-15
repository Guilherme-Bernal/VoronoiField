import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useMindAR } from "../../lib/ar/useMindAR";
import {
  createTacticalGroup,
  revealTactical,
  tickTacticalGroup,
  updateTacticalGroup,
} from "../../lib/ar/tacticalScene";
import { useTacticalStore } from "../../state/tacticalStore";
import { Link, useLocation } from "react-router-dom";
import { readSharedTactic } from "../../tactics/share";
import { useCameras } from "../../lib/ar/useCameras";
import { CameraPicker } from "./CameraPicker";
import { ScanFrame } from "./ScanFrame";
import { Legend } from "../ui/Legend";
import { ARHint } from "./ARHint";
import { HUD } from "../ui/HUD";
import styles from "./ARExperience.module.css";

const IMAGE_TARGET_SRC = "/markers/targets.mind";

const ERROR_COPY = {
  "marker-missing": {
    title: "Marcador não encontrado",
    text: "Falta o arquivo public/markers/targets.mind.",
  },
  "script-missing": {
    title: "Biblioteca de AR não carregou",
    text: "O módulo de AR não carregou. Recarregue a página; se persistir, use outro navegador.",
  },
  camera: {
    title: "Não foi possível abrir a câmera",
    text: "Permita o acesso à câmera. No celular, é preciso abrir o site via HTTPS.",
  },
} as const;

export function ARExperience() {
  const { cameras, deviceId, setDeviceId, refresh } = useCameras();
  const { containerRef, mindARRef, anchorRef, targetFound, ready, error } =
    useMindAR(IMAGE_TARGET_SRC, deviceId);

  // Os nomes das cameras so ficam disponiveis depois da permissao.
  useEffect(() => {
    if (ready || error) void refresh();
  }, [ready, error, refresh]);

  const tacticalRef = useRef(createTacticalGroup());
  const draggingRef = useRef<string | null>(null);

  const players = useTacticalStore((s) => s.players);
  const showZones = useTacticalStore((s) => s.showZones);
  const showPasses = useTacticalStore((s) => s.showPasses);
  const draggingId = useTacticalStore((s) => s.draggingId);
  const ballCarrierId = useTacticalStore((s) => s.ballCarrierId);
  const showOffside = useTacticalStore((s) => s.showOffside);
  const loadTactic = useTacticalStore((s) => s.loadTactic);
  const stopPlay = useTacticalStore((s) => s.stopPlay);
  const { search } = useLocation();
  const setPlayerPosition = useTacticalStore((s) => s.setPlayerPosition);
  const startDrag = useTacticalStore((s) => s.startDrag);
  const endDrag = useTacticalStore((s) => s.endDrag);
  const setTargetFound = useTacticalStore((s) => s.setTargetFound);

  // Tatica compartilhada por link (?t=...) e limpeza ao sair.
  useEffect(() => {
    const shared = readSharedTactic(search);
    if (shared) loadTactic(shared.players, shared.ball, shared.steps);
    return () => stopPlay();
  }, [search, loadTactic, stopPlay]);

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
      draggingId,
      labels: true,
      ballCarrierId,
      showOffside,
      // Gramado com marcacoes cobre o marcador: o desenho fica limpo e a camera
      // continua rastreando o marcador pelo video.
      pitch: true,
      heightScale: 0.3,
      zoneOpacity: 0.24,
      // So os passes de quem esta com a bola: mais legivel e mais leve no celular.
      passMode: "carrier" as const,
      // Com 22 jogadores: peoes e numeros menores.
      ...(players.length > 8
        ? {
            maxPassDistance: 0.34,
            pawnScale: 0.74,
            labelScale: 0.95,
          }
        : { pawnScale: 1.1, labelScale: 1.15 }),
    });
  }, [players, showZones, showPasses, draggingId, ballCarrierId, showOffside]);

  // Animacoes (deslize dos jogadores, pulsos nos passes, entrada).
  useEffect(() => {
    let frame = 0;
    const loop = (now: number) => {
      tickTacticalGroup(tacticalRef.current, now);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Toda vez que o marcador e (re)detectado, o campo "entra" animado.
  useEffect(() => {
    if (targetFound) revealTactical(tacticalRef.current);
  }, [targetFound]);

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
        .intersectObjects(tokens.children, true)
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
      {error && (
        <div className={styles.errorBox} role="alert">
          <h2 className={styles.errorTitle}>{ERROR_COPY[error].title}</h2>
          <p className={styles.errorText}>{ERROR_COPY[error].text}</p>
          <Link to="/sim" className={styles.errorLink}>
            Abrir o simulador sem câmera
          </Link>
        </div>
      )}

      <CameraPicker cameras={cameras} value={deviceId} onChange={setDeviceId} />
      <ScanFrame visible={ready && !targetFound} />
      <ARHint />
      <Legend variant="overlay" />
      <HUD />
    </div>
  );
}

