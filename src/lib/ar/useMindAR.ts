import { useEffect, useRef, useState } from "react";
import type { MindARAnchor, MindARThreeInstance } from "../../types/mind-ar";

export function useMindAR(imageTargetSrc: string) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindARRef = useRef<MindARThreeInstance | null>(null);
  const anchorRef = useRef<MindARAnchor | null>(null);
  const [targetFound, setTargetFound] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const mindAR = new window.MINDAR.IMAGE.MindARThree({
      container,
      imageTargetSrc,
    });
    mindARRef.current = mindAR;

    const anchor = mindAR.addAnchor(0);
    anchor.onTargetFound = () => setTargetFound(true);
    anchor.onTargetLost = () => setTargetFound(false);
    anchorRef.current = anchor;

    let cancelled = false;

    mindAR.start().then(() => {
      if (cancelled) return;
      setReady(true);
      mindAR.renderer.setAnimationLoop(() => {
        mindAR.renderer.render(mindAR.scene, mindAR.camera);
      });
    });

    return () => {
      cancelled = true;
      setReady(false);
      mindAR.renderer.setAnimationLoop(null);
      mindAR.stop();
    };
  }, [imageTargetSrc]);

  return { containerRef, mindARRef, anchorRef, targetFound, ready };
}
