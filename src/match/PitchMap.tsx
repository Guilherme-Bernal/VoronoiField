import { useMemo } from "react";
import { computeVoronoiZones } from "../tactics/engine";
import { buildPlayers, type MatchSheet } from "./lineup";

const W = 105;
const H = 68;

/** Campo em SVG com as zonas de Voronoi e a camisa de cada titular. */
export function PitchMap({ match }: { match: MatchSheet }) {
  const { players, zones } = useMemo(() => {
    const players = buildPlayers(match);
    return { players, zones: computeVoronoiZones(players) };
  }, [match]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Campo com as escalações e as zonas de domínio de cada jogador"
      style={{ width: "100%", height: "auto", display: "block", background: "#164e32" }}
    >
      {zones.map((z) => (
        <polygon
          key={z.id}
          points={z.polygon.map(([x, y]) => `${x * W},${y * H}`).join(" ")}
          fill={z.team === "A" ? "#2f6fed" : "#e0483e"}
          fillOpacity={0.4}
          stroke="rgba(255,255,255,0.35)"
          strokeWidth={0.2}
        />
      ))}
      <g fill="none" stroke="rgba(244,247,243,0.85)" strokeWidth={0.3}>
        <rect x={0.2} y={0.2} width={W - 0.4} height={H - 0.4} />
        <line x1={W / 2} y1={0} x2={W / 2} y2={H} />
        <circle cx={W / 2} cy={H / 2} r={9.15} />
        <rect x={0.2} y={(H - 40.3) / 2} width={16.5} height={40.3} />
        <rect x={W - 16.7} y={(H - 40.3) / 2} width={16.5} height={40.3} />
      </g>
      {players.map((p) => {
        const sheet = p.team === "A" ? match.home : match.away;
        const n = sheet.squad[Number(p.id.slice(1)) - 1].number;
        return (
          <g key={p.id}>
            <circle
              cx={p.x * W}
              cy={p.y * H}
              r={2.5}
              fill={p.team === "A" ? "#2f6fed" : "#e0483e"}
              stroke="#fff"
              strokeWidth={0.4}
            />
            <text
              x={p.x * W}
              y={p.y * H + 0.95}
              fontSize={2.8}
              fontWeight={700}
              textAnchor="middle"
              fill="#fff"
            >
              {n}
            </text>
          </g>
        );
      })}
    </svg>
  );
}