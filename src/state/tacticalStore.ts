import { create } from "zustand";
import { computeBestPass, demoPlayers, type Player } from "../tactics/engine";
import { createMatch, type FormationName } from "../tactics/formations";
import { planStep, type PlayFrame } from "../tactics/play";

const PLAY_STEPS = 5;
const PLAY_STEP_MS = 1100;
const PLAY_FRAME_MS = 33;
const MAX_STEPS = 12;
/** Deslocamento abaixo disto num arrasto conta como "toque": passa a bola ao jogador. */
const TAP_DISTANCE = 0.012;

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
  /** Passos da jogada preparada na prancheta. */
  steps: PlayFrame[];
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
  loadTactic: (
    players: Player[],
    ball: string | null,
    steps?: PlayFrame[]
  ) => void;
  setBallCarrier: (id: string) => void;
  /** Salva as posicoes atuais (e a bola) como proximo passo da jogada. */
  addStep: () => void;
  removeLastStep: () => void;
  clearSteps: () => void;
  goToStep: (index: number) => void;
  /** Reproduz os passos salvos, com os jogadores e a bola se movendo. */
  playSteps: () => void;
  /** Executa o melhor passe: a bola vai para o receptor. */
  passBall: () => void;
  startPlay: () => void;
  stopPlay: () => void;
}

let playTimer: ReturnType<typeof setTimeout> | null = null;
let dragOrigin: { id: string; x: number; y: number } | null = null;

const cloneFrame = (players: Player[]) => players.map((p) => ({ ...p }));

function clearPlayTimer() {
  if (playTimer !== null) {
    clearTimeout(playTimer);
    playTimer = null;
  }
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export const useTacticalStore = create<TacticalState>((set, get) => {
  const replace = (
    players: Player[],
    ball: string | null,
    steps: PlayFrame[] = []
  ) => {
    clearPlayTimer();
    set({ players, ballCarrierId: ball, playing: false, steps });
  };

  /** Interpola as posicoes de `to` a partir do estado atual e chama onDone no fim. */
  const animate = (to: Player[], ms: number, onDone: () => void) => {
    const from = get().players;
    const target = new Map(to.map((p) => [p.id, p]));
    const start = Date.now();
    const frame = () => {
      if (!get().playing) return;
      const raw = Math.min(1, (Date.now() - start) / ms);
      const e = easeInOut(raw);
      set({
        players: from.map((p) => {
          const t = target.get(p.id) ?? p;
          return { ...p, x: p.x + (t.x - p.x) * e, y: p.y + (t.y - p.y) * e };
        }),
      });
      if (raw < 1) {
        playTimer = setTimeout(frame, PLAY_FRAME_MS);
      } else {
        playTimer = null;
        onDone();
      }
    };
    frame();
  };

  const runStep = (n: number) => {
    const state = get();
    if (!state.playing) return;
    if (n >= PLAY_STEPS) {
      set({ playing: false });
      return;
    }

    const { targets, pass } = planStep(state.players, state.ballCarrierId);
    if (pass) set({ ballCarrierId: pass.to });
    animate(targets, PLAY_STEP_MS, () => runStep(n + 1));
  };

  return {
    players: demoPlayers(),
    draggingId: null,
    ballCarrierId: "A4",
    showZones: true,
    showPasses: true,
    showOffside: true,
    playing: false,
    steps: [],
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
    // Arrastar move o jogador; so um toque (sem arrastar) passa a bola para ele.
    startDrag: (id) => {
      clearPlayTimer();
      const player = get().players.find((p) => p.id === id);
      dragOrigin = player ? { id, x: player.x, y: player.y } : null;
      set({ draggingId: id, playing: false });
    },
    endDrag: () => {
      const origin = dragOrigin;
      dragOrigin = null;
      const player = origin && get().players.find((p) => p.id === origin.id);
      if (
        origin &&
        player &&
        Math.hypot(player.x - origin.x, player.y - origin.y) < TAP_DISTANCE
      ) {
        set({ draggingId: null, ballCarrierId: origin.id });
      } else {
        set({ draggingId: null });
      }
    },
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
    loadTactic: (players, ball, steps = []) =>
      replace(players, ball ?? defaultCarrier(players), steps),
    setBallCarrier: (id) => set({ ballCarrierId: id }),
    addStep: () =>
      set((state) =>
        state.steps.length >= MAX_STEPS
          ? state
          : {
              steps: [
                ...state.steps,
                { players: cloneFrame(state.players), ball: state.ballCarrierId },
              ],
            }
      ),
    removeLastStep: () => set((state) => ({ steps: state.steps.slice(0, -1) })),
    clearSteps: () => {
      clearPlayTimer();
      set({ steps: [], playing: false });
    },
    goToStep: (index) => {
      const frame = get().steps[index];
      if (!frame) return;
      clearPlayTimer();
      set({
        players: cloneFrame(frame.players),
        ballCarrierId: frame.ball,
        playing: false,
      });
    },
    playSteps: () => {
      const { steps } = get();
      if (steps.length < 2) return;
      clearPlayTimer();
      set({
        playing: true,
        players: cloneFrame(steps[0].players),
        ballCarrierId: steps[0].ball,
      });
      const go = (i: number) => {
        if (!get().playing) return;
        if (i >= steps.length) {
          set({ playing: false });
          return;
        }
        const frame = steps[i];
        if (frame.ball) set({ ballCarrierId: frame.ball });
        animate(frame.players, PLAY_STEP_MS, () => go(i + 1));
      };
      go(1);
    },
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
