import { useEffect, useRef } from "react";
import { PITCH_ASPECT, createStadium } from "../../lib/three/stadium";
import {
  revealTactical,
  tickTacticalGroup,
  updateTacticalGroup,
} from "../../lib/ar/tacticalScene";
import { createMatch } from "../../tactics/formations";
import { planStep } from "../../tactics/play";
import { defaultCarrier } from "../../state/tacticalStore";

const STEP_MS = 1500;
const STEPS = 5;

/** Fundo da tela inicial: um jogo 4-4-2 x 4-3-3 se repetindo, com zonas e passe ao vivo. */
export default function HeroScene() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let view;
    try {
      view = createStadium(host, { interactive: false, autoOrbit: !reduced, pixelRatioCap: 1.5 });
    } catch {
      return; // sem WebGL: a tela inicial continua legivel sem o fundo
    }

    let players = createMatch("4-4-2", "4-3-3");
    let carrier = defaultCarrier(players);
    let step = 0;

    const push = () =>
      updateTacticalGroup(view.tactical, players, {
        showZones: true,
        showPasses: true,
        labels: false,
        ballCarrierId: carrier,
        showOffside: true,
        aspect: PITCH_ASPECT,
        maxPassDistance: 0.22,
        pawnScale: 0.6,
        heightScale: 0.35,
        zoneOpacity: 0.18,
      });

    push();
    revealTactical(view.tactical);

    let timer: ReturnType<typeof setInterval> | undefined;
    if (!reduced) {
      timer = setInterval(() => {
        if (step >= STEPS) {
          players = createMatch("4-4-2", "4-3-3");
          carrier = defaultCarrier(players);
          step = 0;
          revealTactical(view.tactical);
        } else {
          const next = planStep(players, carrier);
          players = next.targets;
          if (next.pass) carrier = next.pass.to;
          step += 1;
        }
        push();
      }, STEP_MS);
    }

    let frame = 0;
    const loop = (now: number) => {
      tickTacticalGroup(view.tactical, now);
      view.update(now);
      view.render();
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      if (timer) clearInterval(timer);
      view.dispose();
    };
  }, []);

  return <div ref={hostRef} style={{ position: "absolute", inset: 0 }} aria-hidden="true" />;
}
