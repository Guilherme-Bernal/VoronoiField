import { useEffect, useRef, useState } from "react";
import type {
  MindARAnchor,
  MindARThree,
} from "../../vendor/mind-ar/mindar-image-three.prod.js";

export type ARError = "marker-missing" | "script-missing" | "camera";

async function markerExists(src: string): Promise<boolean> {
  try {
    const res = await fetch(src, { method: "GET" });
    const type = res.headers.get("content-type") ?? "";
    // O servidor de dev devolve index.html (200) quando o arquivo nao existe.
    return res.ok && !type.includes("text/html");
  } catch {
    return false;
  }
}

export function useMindAR(imageTargetSrc: string, deviceId: string | null = null) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindARRef = useRef<MindARThree | null>(null);
  const anchorRef = useRef<MindARAnchor | null>(null);
  const [targetFound, setTargetFound] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<ARError | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let cleanup: (() => void) | null = null;

    (async () => {
      let MindARThreeClass: typeof MindARThree;
      try {
        // Carregado sob demanda: a biblioteca e pesada e so o /ar usa.
        ({ MindARThree: MindARThreeClass } = await import(
          "../../vendor/mind-ar/mindar-image-three.prod.js"
        ));
      } catch {
        if (!cancelled) setError("script-missing");
        return;
      }
      if (!(await markerExists(imageTargetSrc))) {
        if (!cancelled) setError("marker-missing");
        return;
      }
      if (cancelled) return;

      const mindAR = new MindARThreeClass({
        userDeviceId: deviceId,
        environmentDeviceId: deviceId,
        container,
        imageTargetSrc,
      });
      mindARRef.current = mindAR;

      const anchor = mindAR.addAnchor(0);
      anchor.onTargetFound = () => setTargetFound(true);
      anchor.onTargetLost = () => setTargetFound(false);
      anchorRef.current = anchor;

      cleanup = () => {
        mindAR.renderer.setAnimationLoop(null);
        mindAR.stop();
      };

      try {
        await mindAR.start();
      } catch {
        if (!cancelled) setError("camera");
        return;
      }
      if (cancelled) return;
      setReady(true);
      mindAR.renderer.setAnimationLoop(() => {
        mindAR.renderer.render(mindAR.scene, mindAR.camera);
      });
    })();

    return () => {
      cancelled = true;
      setReady(false);
      setError(null);
      cleanup?.();
    };
  }, [imageTargetSrc, deviceId]);

  return { containerRef, mindARRef, anchorRef, targetFound, ready, error };
}
