import { create } from "zustand";
import { demoPlayers, type Player } from "../tactics/engine";
import { createMatch, type FormationName } from "../tactics/formations";

interface TacticalState {
  players: Player[];
  draggingId: string | null;
  showZones: boolean;
  showPasses: boolean;
  targetFound: boolean;
  setPlayerPosition: (id: string, x: number, y: number) => void;
  startDrag: (id: string) => void;
  endDrag: () => void;
  toggleZones: () => void;
  togglePasses: () => void;
  setTargetFound: (found: boolean) => void;
  resetFormation: () => void;
  loadMatch: (a: FormationName, b: FormationName) => void;
}

export const useTacticalStore = create<TacticalState>((set) => ({
  players: demoPlayers(),
  draggingId: null,
  showZones: true,
  showPasses: true,
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
  startDrag: (id) => set({ draggingId: id }),
  endDrag: () => set({ draggingId: null }),
  toggleZones: () => set((state) => ({ showZones: !state.showZones })),
  togglePasses: () => set((state) => ({ showPasses: !state.showPasses })),
  setTargetFound: (found) => set({ targetFound: found }),
  resetFormation: () => set({ players: demoPlayers() }),
  loadMatch: (a, b) => set({ players: createMatch(a, b) }),
}));
