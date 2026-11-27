import type { Player, Team } from "../tactics/engine";
import { createTeam, FORMATION_NAMES, type FormationName } from "../tactics/formations";

export { FORMATION_NAMES };
export type { FormationName };

export interface SquadMember {
  number: number;
  name: string;
}

export interface TeamSheet {
  name: string;
  coach: string;
  formation: FormationName;
  /** 11 titulares, na ordem da formacao: goleiro e depois linha a linha. */
  squad: SquadMember[];
  /** Reservas, um por linha (texto livre). */
  bench: string;
}

export interface MatchSheet {
  competition: string;
  venue: string;
  date: string;
  home: TeamSheet;
  away: TeamSheet;
}

export const PITCH_LENGTH_M = 105;
export const PITCH_WIDTH_M = 68;

/** Funcao de cada posicao da formacao, na mesma ordem de `createTeam`. */
export function rolesFor(formation: FormationName): string[] {
  const lines = formation.split("-").map(Number);
  const roles = ["GOL"];
  lines.forEach((count, i) => {
    let role = "MEI";
    if (i === 0) role = "DEF";
    else if (i === lines.length - 1) role = "ATA";
    else if (lines.length === 4) role = i === 1 ? "VOL" : "MEI";
    for (let k = 0; k < count; k++) roles.push(role);
  });
  return roles;
}

export function defaultSquad(): SquadMember[] {
  return Array.from({ length: 11 }, (_, i) => ({ number: i + 1, name: "" }));
}

export function defaultTeam(name: string, formation: FormationName): TeamSheet {
  return { name, coach: "", formation, squad: defaultSquad(), bench: "" };
}

export function defaultMatch(): MatchSheet {
  return {
    competition: "",
    venue: "",
    date: "",
    home: defaultTeam("Time A", "4-3-3"),
    away: defaultTeam("Time B", "4-4-2"),
  };
}

/** Nome para exibir: o digitado ou, se vazio, "Jogador N". */
export function displayName(member: SquadMember): string {
  const n = member.name.trim();
  return n === "" ? `Jogador ${member.number}` : n;
}

/** Posicoes em campo (0..1) de um time a partir da formacao escolhida. */
export function playersOf(team: Team, sheet: TeamSheet): Player[] {
  return createTeam(team, sheet.formation);
}

export function buildPlayers(match: MatchSheet): Player[] {
  return [...playersOf("A", match.home), ...playersOf("B", match.away)];
}

function isFormation(v: unknown): v is FormationName {
  return typeof v === "string" && (FORMATION_NAMES as readonly string[]).includes(v);
}

function cleanTeam(raw: unknown, fallback: TeamSheet): TeamSheet {
  if (typeof raw !== "object" || raw === null) return fallback;
  const r = raw as Partial<Record<keyof TeamSheet, unknown>>;
  const rawSquad: unknown[] = Array.isArray(r.squad) ? r.squad : [];
  const squad = Array.isArray(r.squad)
    ? fallback.squad.map((base, i) => {
        const m = rawSquad[i] as Partial<SquadMember> | undefined;
        const num = Number(m?.number);
        return {
          number: Number.isFinite(num) ? Math.max(0, Math.min(99, Math.round(num))) : base.number,
          name: typeof m?.name === "string" ? m.name.slice(0, 40) : "",
        };
      })
    : fallback.squad;
  return {
    name: typeof r.name === "string" ? r.name.slice(0, 40) : fallback.name,
    coach: typeof r.coach === "string" ? r.coach.slice(0, 40) : "",
    formation: isFormation(r.formation) ? r.formation : fallback.formation,
    squad,
    bench: typeof r.bench === "string" ? r.bench.slice(0, 600) : "",
  };
}

/** Le um JSON salvo com tolerancia: qualquer campo invalido volta ao padrao. */
export function parseMatch(json: string | null): MatchSheet {
  const base = defaultMatch();
  if (!json) return base;
  try {
    const raw = JSON.parse(json) as Partial<Record<keyof MatchSheet, unknown>>;
    const text = (v: unknown) => (typeof v === "string" ? v.slice(0, 80) : "");
    return {
      competition: text(raw.competition),
      venue: text(raw.venue),
      date: text(raw.date),
      home: cleanTeam(raw.home, base.home),
      away: cleanTeam(raw.away, base.away),
    };
  } catch {
    return base;
  }
}