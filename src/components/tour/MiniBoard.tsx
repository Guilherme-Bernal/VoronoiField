import { useMemo, useRef, useState } from "react";
import {
  computeTeamControl,
  computeVoronoiZones,
  demoPlayers,
  type Player,
} from "../../tactics/engine";
import styles from "./MiniBoard.module.css";

const W = 100;
const H = 64;
const MOVABLE_ID = "A4";
const KEY_STEP = 0.04;

const clamp = (v: number) => Math.min(0.97, Math.max(0.03, v));

/** Mini-campo de treino: o usuário arrasta um jogador e vê o controle de campo mudar. */
export function MiniBoard() {
  const [players, setPlayers] = useState<Player[]>(() => demoPlayers());
  const [dragging, setDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const initial = useMemo(() => {
    const c = computeTeamControl(computeVoronoiZones(demoPlayers()));
    return Math.round(c.A * 100);
  }, []);

  const zones = useMemo(() => computeVoronoiZones(players), [players]);
  const percent = Math.round(computeTeamControl(zones).A * 100);
  const delta = percent - initial;

  const moveTo = (x: number, y: number) =>
    setPlayers((prev) =>
      prev.map((p) => (p.id === MOVABLE_ID ? { ...p, x: clamp(x), y: clamp(y) } : p))
    );

  const fromPointer = (event: React.PointerEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    moveTo((event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const me = players.find((p) => p.id === MOVABLE_ID);
    if (!me) return;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-KEY_STEP, 0],
      ArrowRight: [KEY_STEP, 0],
      ArrowUp: [0, -KEY_STEP],
      ArrowDown: [0, KEY_STEP],
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    event.stopPropagation();
    moveTo(me.x + move[0], me.y + move[1]);
  };

  return (
    <div className={styles.wrap}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className={styles.board}
        role="group"
        aria-label="Mini-campo de treino"
        onPointerMove={(e) => dragging && fromPointer(e)}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
      >
        <rect x="0.5" y="0.5" width={W - 1} height={H - 1} className={styles.pitch} />
        <line x1={W / 2} y1="0.5" x2={W / 2} y2={H - 0.5} className={styles.mid} />
        {zones.map((z) => (
          <polygon
            key={z.id}
            points={z.polygon.map(([x, y]) => `${x * W},${y * H}`).join(" ")}
            className={z.team === "A" ? styles.zoneA : styles.zoneB}
          />
        ))}
        {players.map((p) => {
          const mine = p.id === MOVABLE_ID;
          return (
            <g
              key={p.id}
              transform={`translate(${p.x * W} ${p.y * H})`}
              {...(mine
                ? {
                    role: "button",
                    tabIndex: 0,
                    "aria-label": "Jogador azul 4. Arraste ou use as setas do teclado.",
                    onPointerDown: (e: React.PointerEvent) => {
                      (e.target as Element).setPointerCapture?.(e.pointerId);
                      setDragging(true);
                      fromPointer(e);
                    },
                    onKeyDown,
                    className: styles.movable,
                  }
                : {})}
            >
              {mine && <circle r="5.4" className={styles.ring} />}
              <circle r="3.4" className={p.team === "A" ? styles.tokenA : styles.tokenB} />
            </g>
          );
        })}
      </svg>
      <p className={styles.readout} aria-live="polite">
        Azul controla <strong>{percent}%</strong> do campo
        {delta !== 0 && (
          <span className={delta > 0 ? styles.up : styles.down}>
            {" "}
            ({delta > 0 ? "+" : ""}
            {delta} pontos)
          </span>
        )}
      </p>
    </div>
  );
}