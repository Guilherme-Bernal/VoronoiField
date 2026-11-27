import { useMemo, useRef, useState, type MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { computeVoronoiZones } from "../tactics/engine";
import { FORMATION_NAMES, type FormationName } from "../tactics/formations";
import { encodeTactic } from "../tactics/share";
import { detectPlayers, type DetectedPoint, type PitchRect } from "./detectPlayers";
import { buildLineup, toField } from "./lineup";
import styles from "./PhotoImportPage.module.css";

const MAX_SIDE = 720;
const MAX_POINTS = 22;

interface Loaded {
  url: string;
  w: number;
  h: number;
  pitch: PitchRect;
}

type Orientation = "auto" | "vertical" | "horizontal";

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("imagem inválida"));
    img.src = url;
  });
}

export function PhotoImportPage() {
  const navigate = useNavigate();
  const svgRef = useRef<SVGSVGElement>(null);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [pts, setPts] = useState<DetectedPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [orientation, setOrientation] = useState<Orientation>("auto");
  const [flip, setFlip] = useState(false);
  const [side, setSide] = useState<"A" | "B">("A");
  const [opponent, setOpponent] = useState<FormationName>("4-4-2");
  const [snap, setSnap] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const url = URL.createObjectURL(file);
      const img = await loadImage(url);
      const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("canvas indisponível");
      ctx.drawImage(img, 0, 0, w, h);
      const det = detectPlayers(ctx.getImageData(0, 0, w, h));
      if (!det) {
        setLoaded(null);
        setPts([]);
        setError("Não encontrei o campo verde nessa imagem. Enquadre só o campo com a escalação e tente de novo.");
        return;
      }
      setLoaded({ url, w, h, pitch: det.pitch });
      setPts(det.points);
      setFlip(false);
    } catch {
      setError("Não consegui abrir essa imagem. Tente outra foto ou um print.");
    } finally {
      setBusy(false);
    }
  }

  function onTap(e: MouseEvent<SVGSVGElement>) {
    if (!loaded || !svgRef.current) return;
    const box = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - box.left) / box.width) * loaded.w;
    const py = ((e.clientY - box.top) / box.height) * loaded.h;
    const { x0, y0, w, h } = loaded.pitch;
    const nx = (px - x0) / w;
    const ny = (py - y0) / h;
    if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return;
    const near = pts.findIndex(
      (p) => Math.hypot((p.x - nx) * w, (p.y - ny) * h) < Math.min(w, h) * 0.045
    );
    if (near >= 0) setPts(pts.filter((_, i) => i !== near));
    else if (pts.length < MAX_POINTS) setPts([...pts, { x: nx, y: ny }]);
  }

  const vertical =
    orientation === "auto" ? (loaded ? loaded.pitch.h > loaded.pitch.w : true) : orientation === "vertical";

  const lineup = useMemo(() => {
    if (pts.length < 5) return null;
    return buildLineup(toField(pts, { vertical, flip }), { side, opponent, snap });
  }, [pts, vertical, flip, side, opponent, snap]);

  const zones = useMemo(() => (lineup ? computeVoronoiZones(lineup.players) : []), [lineup]);

  function go(path: "/sim" | "/ar") {
    if (!lineup) return;
    navigate(`${path}?t=${encodeTactic(lineup.players, null)}`);
  }

  const formationText = lineup
    ? (["A", "B"] as const)
        .filter((t) => lineup.counts[t] > 0)
        .map((t) => `${t === "A" ? "Time A" : "Time B"}: ${lineup.counts[t]} jogadores${lineup.formation[t] ? ` · ${lineup.formation[t]}` : ""}`)
        .join("   |   ")
    : "";

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <Link to="/leitura" className={styles.back}>
          ← Leitura de campo
        </Link>
        <h1 className={styles.title}>Importar escalação por foto</h1>
      </header>

      <p className={styles.lead}>
        Tire uma foto (ou envie um print) do campo com a escalação, de qualquer app. O app acha os
        jogadores pela posição, sem ler nomes, e leva a formação para o simulador e para o AR.
      </p>

      <label className={styles.pick} htmlFor="foto">
        {busy ? "Analisando…" : loaded ? "Trocar foto" : "Tirar foto ou escolher print"}
        <input
          id="foto"
          type="file"
          accept="image/*"
          capture="environment"
          disabled={busy}
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}

      {loaded && (
        <div className={styles.layout}>
          <section className={styles.photo} aria-label="Foto com os jogadores detectados">
            <div className={styles.frame} style={{ aspectRatio: `${loaded.w} / ${loaded.h}`, ["--ar" as string]: loaded.w / loaded.h }}>
              <img src={loaded.url} alt="Foto da escalação enviada" />
              <svg
                ref={svgRef}
                viewBox={`0 0 ${loaded.w} ${loaded.h}`}
                onClick={onTap}
                role="presentation"
              >
                <rect
                  x={loaded.pitch.x0}
                  y={loaded.pitch.y0}
                  width={loaded.pitch.w}
                  height={loaded.pitch.h}
                  fill="none"
                  stroke="#f2b705"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                />
                {pts.map((p, i) => (
                  <circle
                    key={i}
                    cx={loaded.pitch.x0 + p.x * loaded.pitch.w}
                    cy={loaded.pitch.y0 + p.y * loaded.pitch.h}
                    r={Math.max(9, loaded.w * 0.028)}
                    fill="rgba(0,229,255,0.18)"
                    stroke="#00e5ff"
                    strokeWidth={3}
                  />
                ))}
              </svg>
            </div>
            <p className={styles.hint}>
              {pts.length} marcados. Toque num círculo para remover e num ponto vazio do campo para
              adicionar.
            </p>
          </section>

          <aside className={styles.side} aria-label="Resultado e ajustes">
            <div className={styles.row}>
              <label className={styles.field} htmlFor="ori">
                Campo na foto
                <select id="ori" value={orientation} onChange={(e) => setOrientation(e.target.value as Orientation)}>
                  <option value="auto">Automático</option>
                  <option value="vertical">Em pé (gol em cima e embaixo)</option>
                  <option value="horizontal">Deitado (gol nos lados)</option>
                </select>
              </label>
              <label className={styles.check}>
                <input type="checkbox" checked={flip} onChange={(e) => setFlip(e.target.checked)} />
                Girar 180°
              </label>
            </div>

            {pts.length < 15 && (
              <div className={styles.row}>
                <label className={styles.field} htmlFor="side">
                  Esse time é o
                  <select id="side" value={side} onChange={(e) => setSide(e.target.value as "A" | "B")}>
                    <option value="A">Time A (azul)</option>
                    <option value="B">Time B (vermelho)</option>
                  </select>
                </label>
                <label className={styles.field} htmlFor="opp">
                  Adversário
                  <select id="opp" value={opponent} onChange={(e) => setOpponent(e.target.value as FormationName)}>
                    {FORMATION_NAMES.map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            <label className={styles.check}>
              <input type="checkbox" checked={snap} onChange={(e) => setSnap(e.target.checked)} />
              Arrumar na formação detectada (posições limpas)
            </label>

            {lineup ? (
              <>
                <svg viewBox="0 0 105 68" className={styles.map} role="img" aria-label="Prévia das posições no campo do app">
                  <rect width="105" height="68" fill="#164e32" />
                  {zones.map((z) => (
                    <polygon
                      key={z.id}
                      points={z.polygon.map(([x, y]) => `${x * 105},${y * 68}`).join(" ")}
                      fill={z.team === "A" ? "#2f6fed" : "#e0483e"}
                      fillOpacity={0.4}
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth={0.2}
                    />
                  ))}
                  <line x1="52.5" y1="0" x2="52.5" y2="68" stroke="rgba(244,247,243,0.7)" strokeWidth={0.3} />
                  {lineup.players.map((p) => (
                    <circle
                      key={p.id}
                      cx={p.x * 105}
                      cy={p.y * 68}
                      r={2}
                      fill={p.team === "A" ? "#2f6fed" : "#e0483e"}
                      stroke="#fff"
                      strokeWidth={0.4}
                    />
                  ))}
                </svg>
                <p className={styles.summary}>{formationText}</p>
                {lineup.kind === "um" && (
                  <p className={styles.hint}>O time da foto foi colocado na própria metade; o adversário usa a formação escolhida.</p>
                )}
                <div className={styles.actions}>
                  <button type="button" className={styles.primary} onClick={() => go("/sim")}>
                    Simular no simulador
                  </button>
                  <button type="button" className={styles.secondary} onClick={() => go("/ar")}>
                    Ver em AR
                  </button>
                </div>
              </>
            ) : (
              <p className={styles.hint}>Marque pelo menos 5 jogadores na foto para ver o resultado.</p>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}