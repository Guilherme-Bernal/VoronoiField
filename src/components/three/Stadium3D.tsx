import { useEffect, useRef, useState } from "react";
import {
  CAMERA_PRESETS,
  PITCH_ASPECT,
  createStadium,
  type CameraPreset,
  type StadiumView,
} from "../../lib/three/stadium";
import {
  revealTactical,
  tickTacticalGroup,
  updateTacticalGroup,
} from "../../lib/ar/tacticalScene";
import { useTacticalStore } from "../../state/tacticalStore";
import styles from "./Stadium3D.module.css";

/** Simulador em 3D: o mesmo estado do simulador 2D, visto como numa transmissao. */
export function Stadium3D() {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<StadiumView | null>(null);
  const draggingRef = useRef<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [preset, setPreset] = useState<CameraPreset>("tv");

  const players = useTacticalStore((s) => s.players);
  const showZones = useTacticalStore((s) => s.showZones);
  const showPasses = useTacticalStore((s) => s.showPasses);
  const showOffside = useTacticalStore((s) => s.showOffside);
  const draggingId = useTacticalStore((s) => s.draggingId);
  const ballCarrierId = useTacticalStore((s) => s.ballCarrierId);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let view: StadiumView;
    try {
      view = createStadium(host, { interactive: true });
    } catch {
      // WebGL indisponivel: mostra o aviso em vez do campo 3D.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFailed(true);
      return;
    }
    viewRef.current = view;
    revealTactical(view.tactical);

    let frame = 0;
    const loop = (now: number) => {
      tickTacticalGroup(view.tactical, now);
      view.update(now);
      view.render();
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    const store = useTacticalStore.getState;
    const onDown = (event: PointerEvent) => {
      const id = view.pick(event);
      if (!id) return;
      draggingRef.current = id;
      view.controls.enabled = false;
      host.setPointerCapture(event.pointerId);
      store().startDrag(id);
    };
    const onMove = (event: PointerEvent) => {
      if (!draggingRef.current) return;
      const point = view.groundPoint(event);
      if (point) store().setPlayerPosition(draggingRef.current, point.x, point.y);
    };
    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = null;
      view.controls.enabled = true;
      store().endDrag();
    };
    host.addEventListener("pointerdown", onDown);
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerup", onUp);
    host.addEventListener("pointercancel", onUp);

    return () => {
      cancelAnimationFrame(frame);
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerup", onUp);
      host.removeEventListener("pointercancel", onUp);
      view.dispose();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    updateTacticalGroup(view.tactical, players, {
      showZones,
      showPasses,
      draggingId,
      labels: true,
      ballCarrierId,
      showOffside,
      aspect: PITCH_ASPECT,
      maxPassDistance: 0.22,
      pawnScale: 0.6,
      heightScale: 0.35,
        zoneOpacity: 0.18,
    });
  }, [players, showZones, showPasses, showOffside, draggingId, ballCarrierId]);

  const choose = (next: CameraPreset) => {
    setPreset(next);
    viewRef.current?.setPreset(next);
  };

  if (failed) {
    return (
      <div className={styles.fallback} role="alert">
        Este navegador não conseguiu abrir o 3D. Use a vista 2D.
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div
        ref={hostRef}
        className={styles.host}
        role="application"
        aria-label="Campo 3D. Arraste o gramado para girar a câmera; arraste um jogador para movê-lo."
      />
      <div className={styles.cameras} role="group" aria-label="Câmera">
        {(Object.keys(CAMERA_PRESETS) as CameraPreset[]).map((key) => (
          <button
            key={key}
            type="button"
            className={`${styles.cam} ${preset === key ? styles.camActive : ""}`}
            aria-pressed={preset === key}
            onClick={() => choose(key)}
          >
            {CAMERA_PRESETS[key].label}
          </button>
        ))}
      </div>
      <p className={styles.tip}>
        Arraste o gramado para girar. Arraste um jogador para movê-lo; toque nele para dar a bola.
      </p>
    </div>
  );
}
