import { create } from "zustand";
import { computeBestPass, demoPlayers, type Player } from "../tactics/engine";
import { createMatch, type FormationName } from "../tactics/formations";
import { planStep } from "../tactics/play";

const PLAY_STEPS = 5;
const PLAY_STEP_MS = 1100;
const PLAY_FRAME_MS = 33;

/** Jogador do time A mais proximo do circulo central: comeca com a bola. */
export function defaultCarrier(players: Player[]): string | null {
  const team = players.filter((p) => p.team === "A");
  if (team.length === 0) return players[0]?.id ?? null;
  return team.reduce((best, p) =>
    Math.hypot(p.x - 0.5, p.y - 0.5) < Math.hypot(best.x - 0.5, best.y - 0.5)
      ? p
      : best
  ).id;
}

interface TacticalState {
  players: Player[];
  draggingId: string | null;
  ballCarrierId: string | null;
  showZones: boolean;
  showPasses: boolean;
  showOffside: boolean;
  playing: boolean;
  targetFound: boolean;
  setPlayerPosition: (id: string, x: number, y: number) => void;
  startDrag: (id: string) => void;
  endDrag: () => void;
  toggleZones: () => void;
  togglePasses: () => void;
  toggleOffside: () => void;
  setTargetFound: (found: boolean) => void;
  resetFormation: () => void;
  loadMatch: (a: FormationName, b: FormationName) => void;
  loadTactic: (players: Player[], ball: string | null) => void;
  /** Executa o melhor passe: a bola vai para o receptor. */
  passBall: () => void;
  startPlay: () => void;
  stopPlay: () => void;
}

let playTimer: ReturnType<typeof setTimeout> | null = null;

function clearPlayTimer() {
  if (playTimer !== null) {
    clearTimeout(playTimer);
    playTimer = null;
  }
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export const useTacticalStore = create<TacticalState>((set, get) => {
  const replace = (players: Player[], ball: string | null) => {
    clearPlayTimer();
    set({ players, ballCarrierId: ball, playing: false });
  };

  const runStep = (n: number) => {
    const state = get();
    if (!state.playing) return;
    if (n >= PLAY_STEPS) {
      set({ playing: false });
      return;
    }

    const { targets, pass } = planStep(state.players, state.ballCarrierId);
    const from = state.players;
    if (pass) set({ ballCarrierId: pass.to });
    const start = Date.now();

    const frame = () => {
      if (!get().playing) return;
      const raw = Math.min(1, (Date.now() - start) / PLAY_STEP_MS);
      const e = easeInOut(raw);
      set({
        players: from.map((p, i) => ({
          ...p,
          x: p.x + (targets[i].x - p.x) * e,
          y: p.y + (targets[i].y - p.y) * e,
        })),
      });
      if (raw < 1) {
        playTimer = setTimeout(frame, PLAY_FRAME_MS);
      } else {
        playTimer = null;
        runStep(n + 1);
      }
    };
    frame();
  };

  return {
    players: demoPlayers(),
    draggingId: null,
    ballCarrierId: "A4",
    showZones: true,
    showPasses: true,
    showOffside: true,
    playing: false,
    targetFound: false,
    setPlayerPosition: (id, x, y) =>
      set((state) => ({
        players: state.players.map((player) =>
          player.id === id
            ? {
                ...player,
                x: Math.min(1, Math.max(0, x)),
                y: Math.min(1, Math.max(0, y)),
              }
            : player
        ),
      })),
    // Quem voce pega fica com a bola; mexer manualmente interrompe a jogada.
    startDrag: (id) => {
      clearPlayTimer();
      set({ draggingId: id, ballCarrierId: id, playing: false });
    },
    endDrag: () => set({ draggingId: null }),
    toggleZones: () => set((state) => ({ showZones: !state.showZones })),
    togglePasses: () => set((state) => ({ showPasses: !state.showPasses })),
    toggleOffside: () => set((state) => ({ showOffside: !state.showOffside })),
    setTargetFound: (found) => set({ targetFound: found }),
    resetFormation: () => {
      const players = demoPlayers();
      replace(players, defaultCarrier(players));
    },
    loadMatch: (a, b) => {
      const players = createMatch(a, b);
      replace(players, defaultCarrier(players));
    },
    loadTactic: (players, ball) =>
      replace(players, ball ?? defaultCarrier(players)),
    passBall: () => {
      const { players, ballCarrierId, showOffside } = get();
      const best = computeBestPass(players, ballCarrierId, { offside: showOffside });
      if (best) set({ ballCarrierId: best.to });
    },
    startPlay: () => {
      if (get().playing) return;
      clearPlayTimer();
      set({ playing: true });
      runStep(0);
    },
    stopPlay: () => {
      clearPlayTimer();
      set({ playing: false });
    },
  };
});
