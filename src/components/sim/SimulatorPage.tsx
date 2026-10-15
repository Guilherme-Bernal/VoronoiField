import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { copyText } from "../../lib/clipboard";
import { analyzeTactic } from "../../tactics/analysis";
import { buildShareUrl, encodeTactic, readSharedTactic } from "../../tactics/share";
import { computePassingLines, computeVoronoiZones } from "../../tactics/engine";
import { FORMATION_NAMES, type FormationName } from "../../tactics/formations";
import { useTacticalStore } from "../../state/tacticalStore";
import styles from "./SimulatorPage.module.css";

const PITCH_W = 105;
const PITCH_H = 68;
const MAX_PASS_DISTANCE = 0.2;

export function SimulatorPage() {
  const players = useTacticalStore((s) => s.players);
  const showZones = useTacticalStore((s) => s.showZones);
  const showPasses = useTacticalStore((s) => s.showPasses);
  const draggingId = useTacticalStore((s) => s.draggingId);
  const setPlayerPosition = useTacticalStore((s) => s.setPlayerPosition);
  const startDrag = useTacticalStore((s) => s.startDrag);
  const endDrag = useTacticalStore((s) => s.endDrag);
  const toggleZones = useTacticalStore((s) => s.toggleZones);
  const togglePasses = useTacticalStore((s) => s.togglePasses);
  const loadMatch = useTacticalStore((s) => s.loadMatch);
  const resetFormation = useTacticalStore((s) => s.resetFormation);
  const loadTactic = useTacticalStore((s) => s.loadTactic);
  const ballCarrierId = useTacticalStore((s) => s.ballCarrierId);
  const showOffside = useTacticalStore((s) => s.showOffside);
  const playing = useTacticalStore((s) => s.playing);
  const toggleOffside = useTacticalStore((s) => s.toggleOffside);
  const startPlay = useTacticalStore((s) => s.startPlay);
  const stopPlay = useTacticalStore((s) => s.stopPlay);
  const passBall = useTacticalStore((s) => s.passBall);
  const { search } = useLocation();

  const [formationA, setFormationA] = useState<FormationName>("4-4-2");
  const [formationB, setFormationB] = useState<FormationName>("4-3-3");
  const [shared, setShared] = useState(() => readSharedTactic(search));
  const [copied, setCopied] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Uma tatica vinda de link (?t=...) vale ate o usuario trocar a formacao.
  useEffect(() => {
    if (shared) loadTactic(shared.players, shared.ball);
    else loadMatch(formationA, formationB);
  }, [shared, formationA, formationB, loadMatch, loadTactic]);

  useEffect(() => resetFormation, [resetFormation]);
  useEffect(() => stopPlay, [stopPlay]);

  const chooseFormationA = (value: FormationName) => {
    setShared(null);
    setFormationA(value);
  };
  const chooseFormationB = (value: FormationName) => {
    setShared(null);
    setFormationB(value);
  };
  const restart = () => {
    setShared(null);
    loadMatch(formationA, formationB);
  };
  const share = async () => {
    const ok = await copyText(buildShareUrl("/sim", players, ballCarrierId));
    setCopied(ok);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const zones = useMemo(() => computeVoronoiZones(players), [players]);
  const { control, bestPass, offside } = useMemo(
    () => analyzeTactic(players, ballCarrierId, showOffside),
    [players, ballCarrierId, showOffside]
  );
  const lines = useMemo(
    () => computePassingLines(players, 0.04, MAX_PASS_DISTANCE),
    [players]
  );
  const byId = useMemo(
    () => new Map(players.map((p) => [p.id, p])),
    [players]
  );

  const toPitch = (event: React.PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(
      matrix.inverse()
    );
    return { x: point.x / PITCH_W, y: point.y / PITCH_H };
  };

  const handlePointerDown = (event: React.PointerEvent, id: string) => {
    event.preventDefault();
    svgRef.current?.setPointerCapture(event.pointerId);
    startDrag(id);
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (!draggingId) return;
    const pos = toPitch(event);
    if (pos) setPlayerPosition(draggingId, pos.x, pos.y);
  };

  const handlePointerUp = () => endDrag();

  const percentA = Math.round(control.A * 100);
  const percentB = 100 - percentA;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.back}>
          ← Início
        </Link>
        <h1 className={styles.title}>Simulador tático</h1>
        <Link
          to={`/ar?t=${encodeTactic(players, ballCarrierId)}`}
          className={styles.arLink}
        >
          Abrir em AR
        </Link>
      </header>

      <div className={styles.layout}>
        <div className={styles.boardWrap}>
          <svg
            ref={svgRef}
            className={styles.board}
            viewBox={`0 0 ${PITCH_W} ${PITCH_H}`}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            role="application"
            aria-label="Campo de futebol interativo. Arraste os jogadores para mudar a tática."
          >
            <PitchMarkings />

            {showZones &&
              zones.map((zone) =>
                zone.polygon.length >= 3 ? (
                  <polygon
                    key={zone.id}
                    className={zone.team === "A" ? styles.zoneA : styles.zoneB}
                    points={zone.polygon
                      .map(([x, y]) => `${x * PITCH_W},${y * PITCH_H}`)
                      .join(" ")}
                  />
                ) : null
              )}

            {showPasses &&
              lines.map((line) => {
                const from = byId.get(line.from);
                const to = byId.get(line.to);
                if (!from || !to) return null;
                return (
                  <line
                    key={`${line.from}-${line.to}`}
                    className={line.blocked ? styles.passBlocked : styles.passOpen}
                    x1={from.x * PITCH_W}
                    y1={from.y * PITCH_H}
                    x2={to.x * PITCH_W}
                    y2={to.y * PITCH_H}
                  />
                );
              })}

            {showPasses && bestPass && byId.get(bestPass.from) && byId.get(bestPass.to) && (
              <line
                className={styles.passBest}
                x1={byId.get(bestPass.from)!.x * PITCH_W}
                y1={byId.get(bestPass.from)!.y * PITCH_H}
                x2={byId.get(bestPass.to)!.x * PITCH_W}
                y2={byId.get(bestPass.to)!.y * PITCH_H}
              />
            )}

            {showOffside && offside && (
              <g>
                <line
                  className={styles.offsideLine}
                  x1={offside.x * PITCH_W}
                  y1={0.5}
                  x2={offside.x * PITCH_W}
                  y2={PITCH_H - 0.5}
                />
                <text
                  className={styles.offsideText}
                  x={offside.x * PITCH_W - 0.8}
                  y={3}
                >
                  Impedimento
                </text>
              </g>
            )}

            {players.map((p) => (
              <g
                key={p.id}
                className={`${styles.player} ${
                  draggingId === p.id ? styles.playerDragging : ""
                }`}
                transform={`translate(${p.x * PITCH_W} ${p.y * PITCH_H})`}
                onPointerDown={(e) => handlePointerDown(e, p.id)}
              >
                {showOffside && offside?.offsideIds.includes(p.id) && (
                  <circle r={3.6} className={styles.offsideRing} />
                )}
                <circle
                  r={2.6}
                  className={p.team === "A" ? styles.tokenA : styles.tokenB}
                />
                <text className={styles.tokenLabel} y={0.9}>
                  {p.id.slice(1)}
                </text>
              </g>
            ))}
            {ballCarrierId && byId.get(ballCarrierId) && (
              <circle
                className={styles.ball}
                r={1.1}
                style={{
                  transform: `translate(${byId.get(ballCarrierId)!.x * PITCH_W + 2.6}px, ${
                    byId.get(ballCarrierId)!.y * PITCH_H + 1.8
                  }px)`,
                }}
              />
            )}
          </svg>
        </div>

        <aside className={styles.panel}>
          <section className={styles.block}>
            <h2 className={styles.blockTitle}>Domínio do campo</h2>
            <div
              className={styles.meter}
              role="img"
              aria-label={`Time azul ${percentA} por cento, time vermelho ${percentB} por cento`}
            >
              <div className={styles.meterA} style={{ width: `${percentA}%` }}>
                {percentA}%
              </div>
              <div className={styles.meterB} style={{ width: `${percentB}%` }}>
                {percentB}%
              </div>
            </div>
            <p className={styles.hint}>
              Cada cor mostra a área do campo mais próxima dos jogadores do time
              (diagrama de Voronoi).
            </p>
          </section>

          <section className={styles.block}>
            <h2 className={styles.blockTitle}>Formações</h2>
            <label className={styles.field}>
              <span className={styles.swatchA} /> Time azul
              <select
                value={formationA}
                onChange={(e) => chooseFormationA(e.target.value as FormationName)}
              >
                {FORMATION_NAMES.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.swatchB} /> Time vermelho
              <select
                value={formationB}
                onChange={(e) => chooseFormationB(e.target.value as FormationName)}
              >
                {FORMATION_NAMES.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
          </section>

          <section className={styles.block}>
            <h2 className={styles.blockTitle}>Camadas</h2>
            <div className={styles.buttons}>
              <button
                type="button"
                className={`${styles.toggle} ${showZones ? styles.toggleActive : ""}`}
                aria-pressed={showZones}
                onClick={toggleZones}
              >
                Zonas
              </button>
              <button
                type="button"
                className={`${styles.toggle} ${showPasses ? styles.toggleActive : ""}`}
                aria-pressed={showPasses}
                onClick={togglePasses}
              >
                Passes
              </button>
              <button
                type="button"
                className={`${styles.toggle} ${showOffside ? styles.toggleActive : ""}`}
                aria-pressed={showOffside}
                onClick={toggleOffside}
              >
                Impedimento
              </button>
              <button
                type="button"
                className={styles.reset}
                onClick={restart}
              >
                Reiniciar
              </button>
            </div>
            <p className={styles.hint}>
              Linhas amarelas são passes livres; cinzas estão bloqueadas por um
              adversário. Arraste qualquer jogador.
            </p>
          </section>

          <section className={styles.block}>
            <h2 className={styles.blockTitle}>Jogada</h2>
            <div className={styles.buttons}>
              <button
                type="button"
                className={`${styles.toggle} ${playing ? styles.toggleActive : ""}`}
                aria-pressed={playing}
                onClick={playing ? stopPlay : startPlay}
              >
                {playing ? "Parar" : "Jogar"}
              </button>
              <button
                type="button"
                className={styles.reset}
                onClick={passBall}
                disabled={!bestPass || playing}
              >
                Passar
              </button>
              <button type="button" className={styles.reset} onClick={share}>
                {copied ? "Link copiado" : "Compartilhar"}
              </button>
            </div>
            <p className={styles.hint}>
              Bola com {ballCarrierId ?? "-"}.{" "}
              {bestPass
                ? `Melhor passe (verde): ${bestPass.from} → ${bestPass.to}.`
                : "Nenhum passe livre."}{" "}
              {showOffside && offside?.offsideIds.length
                ? `Impedimento: ${offside.offsideIds.join(", ")}.`
                : ""}{" "}
              Quem você arrasta fica com a bola.
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}

function PitchMarkings() {
  return (
    <g className={styles.markings}>
      <rect x={0} y={0} width={PITCH_W} height={PITCH_H} className={styles.grass} />
      <rect x={0.5} y={0.5} width={PITCH_W - 1} height={PITCH_H - 1} />
      <line x1={PITCH_W / 2} y1={0.5} x2={PITCH_W / 2} y2={PITCH_H - 0.5} />
      <circle cx={PITCH_W / 2} cy={PITCH_H / 2} r={9.15} />
      <circle cx={PITCH_W / 2} cy={PITCH_H / 2} r={0.4} className={styles.spot} />
      <rect x={0.5} y={13.85} width={16.5} height={40.3} />
      <rect x={PITCH_W - 17} y={13.85} width={16.5} height={40.3} />
      <rect x={0.5} y={24.85} width={5.5} height={18.3} />
      <rect x={PITCH_W - 6} y={24.85} width={5.5} height={18.3} />
    </g>
  );
}
