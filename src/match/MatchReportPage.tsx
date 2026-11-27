import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTacticalStore } from "../state/tacticalStore";
import {
  FORMATION_NAMES,
  buildPlayers,
  defaultMatch,
  parseMatch,
  rolesFor,
  type FormationName,
  type MatchSheet,
  type TeamSheet,
} from "./lineup";
import { PitchMap } from "./PitchMap";
import { computeMatchStats, type TeamStat } from "./stats";
import styles from "./MatchReportPage.module.css";

const STORAGE_KEY = "voronoifield.leitura.v1";

function load(): MatchSheet {
  try {
    return parseMatch(localStorage.getItem(STORAGE_KEY));
  } catch {
    return defaultMatch();
  }
}

function save(match: MatchSheet) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(match));
  } catch {
    /* armazenamento indisponível: segue sem salvar */
  }
}

type Side = "home" | "away";

function TeamForm({
  side,
  sheet,
  onChange,
}: {
  side: Side;
  sheet: TeamSheet;
  onChange: (next: TeamSheet) => void;
}) {
  const roles = rolesFor(sheet.formation);
  const label = side === "home" ? "Time A (azul, ataca →)" : "Time B (vermelho, ataca ←)";
  return (
    <section className={`${styles.card} ${side === "home" ? styles.a : styles.b}`} aria-label={label}>
      <h2 className={styles.cardTitle}>{label}</h2>
      <div className={styles.row2}>
        <label className={styles.field}>
          Nome do time
          <input
            value={sheet.name}
            maxLength={40}
            onChange={(e) => onChange({ ...sheet, name: e.target.value })}
          />
        </label>
        <label className={styles.field}>
          Formação
          <select
            value={sheet.formation}
            onChange={(e) => onChange({ ...sheet, formation: e.target.value as FormationName })}
          >
            {FORMATION_NAMES.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </label>
      </div>
      <label className={styles.field}>
        Técnico
        <input
          value={sheet.coach}
          maxLength={40}
          onChange={(e) => onChange({ ...sheet, coach: e.target.value })}
        />
      </label>
      <ol className={styles.squad}>
        {sheet.squad.map((m, i) => (
          <li key={i} className={styles.member}>
            <input
              className={styles.num}
              type="number"
              min={0}
              max={99}
              inputMode="numeric"
              aria-label={`Número do titular ${i + 1}`}
              value={m.number}
              onChange={(e) => {
                const squad = sheet.squad.map((s, k) =>
                  k === i ? { ...s, number: Number(e.target.value) } : s
                );
                onChange({ ...sheet, squad });
              }}
            />
            <input
              className={styles.pname}
              placeholder={`Jogador ${m.number}`}
              aria-label={`Nome do titular ${i + 1}`}
              maxLength={40}
              value={m.name}
              onChange={(e) => {
                const squad = sheet.squad.map((s, k) =>
                  k === i ? { ...s, name: e.target.value } : s
                );
                onChange({ ...sheet, squad });
              }}
            />
            <span className={styles.role}>{roles[i]}</span>
          </li>
        ))}
      </ol>
      <label className={styles.field}>
        Reservas (um por linha)
        <textarea
          rows={3}
          maxLength={600}
          value={sheet.bench}
          onChange={(e) => onChange({ ...sheet, bench: e.target.value })}
        />
      </label>
    </section>
  );
}

function StatRow({
  label,
  a,
  b,
  unit,
  decimals = 0,
}: {
  label: string;
  a: number;
  b: number;
  unit: string;
  decimals?: number;
}) {
  const total = a + b || 1;
  return (
    <div className={styles.stat}>
      <div className={styles.statNums}>
        <strong className={styles.na}>
          {a.toFixed(decimals)}
          {unit}
        </strong>
        <span>{label}</span>
        <strong className={styles.nb}>
          {b.toFixed(decimals)}
          {unit}
        </strong>
      </div>
      <div className={styles.bar} aria-hidden="true">
        <span style={{ width: `${(a / total) * 100}%` }} className={styles.barA} />
        <span style={{ width: `${(b / total) * 100}%` }} className={styles.barB} />
      </div>
    </div>
  );
}

function freestLine(st: TeamStat, sheet: TeamSheet, tight: boolean) {
  const ps = tight ? st.tightest : st.freest;
  const m = sheet.squad[Number(ps.id.slice(1)) - 1];
  return `${m.name.trim() || `Jogador ${m.number}`} (nº ${m.number}) · ${ps.zoneM2.toFixed(0)} m²`;
}

export function MatchReportPage() {
  const navigate = useNavigate();
  const [match, setMatch] = useState<MatchSheet>(load);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(() => computeMatchStats(match), [match]);

  function update(next: MatchSheet) {
    setMatch(next);
    save(next);
  }

  async function makePdf() {
    setBusy(true);
    setError(null);
    try {
      const { exportReportPdf } = await import("./pdf");
      await exportReportPdf(match);
    } catch {
      setError("Não foi possível gerar o PDF. Tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  function openInSimulator() {
    useTacticalStore.getState().loadTactic(buildPlayers(match), null);
    navigate("/sim");
  }

  const pa = Math.round(stats.A.control * 100);

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <Link to="/" className={styles.back}>
          ← Início
        </Link>
        <h1 className={styles.title}>Leitura de campo</h1>
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={openInSimulator}>
            Abrir no simulador
          </button>
          <button type="button" className={styles.primary} onClick={makePdf} disabled={busy}>
            {busy ? "Gerando…" : "Gerar PDF"}
          </button>
        </div>
      </header>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}

      <section className={styles.meta} aria-label="Dados da partida">
        <label className={styles.field}>
          Competição
          <input
            value={match.competition}
            maxLength={80}
            onChange={(e) => update({ ...match, competition: e.target.value })}
          />
        </label>
        <label className={styles.field}>
          Local
          <input
            value={match.venue}
            maxLength={80}
            onChange={(e) => update({ ...match, venue: e.target.value })}
          />
        </label>
        <label className={styles.field}>
          Data
          <input
            value={match.date}
            maxLength={80}
            placeholder="dd/mm/aaaa"
            onChange={(e) => update({ ...match, date: e.target.value })}
          />
        </label>
      </section>

      <div className={styles.layout}>
        <div className={styles.forms}>
          <TeamForm side="home" sheet={match.home} onChange={(home) => update({ ...match, home })} />
          <TeamForm side="away" sheet={match.away} onChange={(away) => update({ ...match, away })} />
        </div>

        <aside className={styles.report} aria-label="Estatísticas da partida">
          <div className={styles.score}>
            <span className={styles.na}>{pa}%</span>
            <span className={styles.scoreLabel}>domínio de espaço</span>
            <span className={styles.nb}>{100 - pa}%</span>
          </div>
          <div className={styles.bar} aria-hidden="true">
            <span style={{ width: `${pa}%` }} className={styles.barA} />
            <span style={{ width: `${100 - pa}%` }} className={styles.barB} />
          </div>
          <p className={styles.names}>
            <span className={styles.na}>{match.home.name}</span>
            <span className={styles.nb}>{match.away.name}</span>
          </p>

          <PitchMap match={match} />

          <StatRow label="Largura" a={stats.A.widthM} b={stats.B.widthM} unit=" m" decimals={1} />
          <StatRow label="Profundidade" a={stats.A.depthM} b={stats.B.depthM} unit=" m" decimals={1} />
          <StatRow
            label="Linha defensiva"
            a={stats.A.defLineM}
            b={stats.B.defLineM}
            unit=" m"
            decimals={1}
          />
          <StatRow label="Área do bloco" a={stats.A.hullM2} b={stats.B.hullM2} unit=" m²" />
          <StatRow label="Zona média por jogador" a={stats.A.avgZoneM2} b={stats.B.avgZoneM2} unit=" m²" />

          <dl className={styles.facts}>
            <dt>Mais livre · {match.home.name}</dt>
            <dd>{freestLine(stats.A, match.home, false)}</dd>
            <dt>Mais marcado · {match.home.name}</dt>
            <dd>{freestLine(stats.A, match.home, true)}</dd>
            <dt>Mais livre · {match.away.name}</dt>
            <dd>{freestLine(stats.B, match.away, false)}</dd>
            <dt>Mais marcado · {match.away.name}</dt>
            <dd>{freestLine(stats.B, match.away, true)}</dd>
          </dl>
          <p className={styles.note}>
            Domínio mede proximidade (quem chega primeiro a cada ponto do campo), não posse de bola.
          </p>
          <button type="button" className={styles.link} onClick={() => update(defaultMatch())}>
            Limpar escalações
          </button>
        </aside>
      </div>
    </main>
  );
}