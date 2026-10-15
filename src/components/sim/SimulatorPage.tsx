import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { copyText } from "../../lib/clipboard";
import { Stadium3D } from "../three/Stadium3D";
import { analyzeTactic } from "../../tactics/analysis";
import { buildShareUrl, encodeTactic, readSharedTactic } from "../../tactics/share";
import { computePassingLines, computeVoronoiZones } from "../../tactics/engine";
import { type FormationName } from "../../tactics/formations";
import { buildHeatmap, TEAM_RGB } from "../../tactics/heat";
import { FormationPicker } from "./FormationPicker";
import { prefetchAR } from "../../lib/prefetch";
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
  const showTrails = useTacticalStore((s) => s.showTrails);
  const showHeat = useTacticalStore((s) => s.showHeat);
  const trails = useTacticalStore((s) => s.trails);
  const toggleTrails = useTacticalStore((s) => s.toggleTrails);
  const toggleHeat = useTacticalStore((s) => s.toggleHeat);
  const startPlay = useTacticalStore((s) => s.startPlay);
  const stopPlay = useTacticalStore((s) => s.stopPlay);
  const passBall = useTacticalStore((s) => s.passBall);
  const steps = useTacticalStore((s) => s.steps);
  const addStep = useTacticalStore((s) => s.addStep);
  const removeLastStep = useTacticalStore((s) => s.removeLastStep);
  const clearSteps = useTacticalStore((s) => s.clearSteps);
  const goToStep = useTacticalStore((s) => s.goToStep);
  const playSteps = useTacticalStore((s) => s.playSteps);
  const { search } = useLocation();

  const [formationA, setFormationA] = useState<FormationName>("4-4-2");
  const [formationB, setFormationB] = useState<FormationName>("4-3-3");
  const [shared, setShared] = useState(() => readSharedTactic(search));
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<"2d" | "3d">("2d");
  const svgRef = useRef<SVGSVGElement>(null);

  // Uma tatica vinda de link (?t=...) vale ate o usuario trocar a formacao.
  useEffect(() => {
    if (shared) loadTactic(shared.players, shared.ball, shared.steps);
    else loadMatch(formationA, formationB);
  }, [shared, formationA, formationB, loadMatch, loadTactic]);

  useEffect(() => resetFormation, [resetFormation]);
  useEffect(() => stopPlay, [stopPlay]);
  // O AR e pesado: baixa em segundo plano para abrir rapido quando o usuario clicar.
  useEffect(() => {
    const id = window.setTimeout(prefetchAR, 2500);
    return () => window.clearTimeout(id);
  }, []);

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
    const ok = await copyText(buildShareUrl("/sim", players, ballCarrierId, steps));
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
  const heat = useMemo(
    () => (showHeat ? buildHeatmap(trails) : null),
    [showHeat, trails]
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
        <div className={styles.viewSwitch} role="group" aria-label="Tipo de vista">
          {(["2d", "3d"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`${styles.viewButton} ${view === mode ? styles.viewActive : ""}`}
              aria-pressed={view === mode}
              onClick={() => setView(mode)}
            >
              {mode === "2d" ? "2D" : "3D"}
            </button>
          ))}
        </div>
        <Link
          to={`/ar?t=${encodeTactic(players, ballCarrierId, steps)}`}
          className={styles.arLink}
          onPointerEnter={prefetchAR}
          onFocus={prefetchAR}
          onTouchStart={prefetchAR}
        >
          Abrir em AR
        </Link>
      </header>

      <div className={styles.layout}>
        <div className={styles.boardWrap}>
          {view === "3d" ? (
            <Stadium3D />
          ) : (
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

            {heat && (
              <g className={styles.heat}>
              {Array.from({ length: heat.cols * heat.rows }, (_, i) => {
                const a = heat.A[i];
                const b = heat.B[i];
                const total = a + b;
                if (total < 0.04) return null;
                const [ar, ag, ab] = TEAM_RGB.A;
                const [br, bg, bb] = TEAM_RGB.B;
                const fill = `rgb(${Math.round((ar * a + br * b) / total)} ${Math.round(
                  (ag * a + bg * b) / total
                )} ${Math.round((ab * a + bb * b) / total)})`;
                const cw = PITCH_W / heat.cols;
                const ch = PITCH_H / heat.rows;
                return (
                  <rect
                    key={i}
                    x={(i % heat.cols) * cw}
                    y={Math.floor(i / heat.cols) * ch}
                    width={cw + 0.05}
                    height={ch + 0.05}
                    fill={fill}
                    fillOpacity={Math.min(0.85, Math.max(a, b) * 0.85)}
                    pointerEvents="none"
                  />
                );
              })}
              </g>
            )}

            {showTrails &&
              Object.entries(trails).map(([id, pts]) =>
                pts.length > 1 ? (
                  <polyline
                    key={id}
                    className={id.startsWith("A") ? styles.trailA : styles.trailB}
                    points={pts.map(([x, y]) => `${x * PITCH_W},${y * PITCH_H}`).join(" ")}
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
          )}
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
            <FormationPicker
              team="A"
              label="Time azul"
              value={formationA}
              onChange={chooseFormationA}
            />
            <FormationPicker
              team="B"
              label="Time vermelho"
              value={formationB}
              onChange={chooseFormationB}
            />
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
                className={`${styles.toggle} ${showTrails ? styles.toggleActive : ""}`}
                aria-pressed={showTrails}
                onClick={toggleTrails}
              >
                Rastro
              </button>
              <button
                type="button"
                className={`${styles.toggle} ${showHeat ? styles.toggleActive : ""}`}
                aria-pressed={showHeat}
                onClick={toggleHeat}
              >
                Calor
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
                {playing ? "Parar" : "Jogada automática"}
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
              Toque num jogador (sem arrastar) para dar a bola a ele.
            </p>
          </section>

          <section className={styles.block}>
            <h2 className={styles.blockTitle}>Prancheta de jogadas</h2>
            <ol className={styles.howto}>
              <li>Arraste os jogadores para a posição inicial e toque em quem está com a bola.</li>
              <li>Clique em “Salvar passo”.</li>
              <li>Mova os jogadores (e a bola) para o próximo momento e salve de novo.</li>
              <li>Com 2 ou mais passos, clique em “Reproduzir”.</li>
            </ol>
            <div className={styles.buttons}>
              <button
                type="button"
                className={styles.toggle}
                onClick={addStep}
                disabled={playing || steps.length >= 12}
              >
                Salvar passo
              </button>
              <button
                type="button"
                className={`${styles.toggle} ${playing ? styles.toggleActive : ""}`}
                onClick={playing ? stopPlay : playSteps}
                disabled={!playing && steps.length < 2}
              >
                {playing ? "Parar" : "Reproduzir"}
              </button>
              <button
                type="button"
                className={styles.reset}
                onClick={removeLastStep}
                disabled={playing || steps.length === 0}
              >
                Desfazer
              </button>
              <button
                type="button"
                className={styles.reset}
                onClick={clearSteps}
                disabled={steps.length === 0}
              >
                Limpar
              </button>
            </div>
            {steps.length > 0 && (
              <div className={styles.stepChips} aria-label="Passos salvos">
                {steps.map((frame, index) => (
                  <button
                    key={index}
                    type="button"
                    className={styles.chip}
                    onClick={() => goToStep(index)}
                    disabled={playing}
                    title={`Voltar ao passo ${index + 1} (bola com ${frame.ball ?? "-"})`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            )}
            <p className={styles.hint}>
              {steps.length === 0
                ? "Nenhum passo salvo. Compartilhar leva a jogada junto (também para o AR)."
                : `${steps.length} passo(s) salvo(s). Clique no número para voltar a ele.`}
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
