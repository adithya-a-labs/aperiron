import { create } from "zustand";
import { engine, catalog } from "../frontend/engine";
import { INITIAL_WORLD_STATE, type WorldState } from "../shared/contracts";

interface AppState {
  passport: string;
  comparison: string;
  destination: string;
  world: WorldState;
  notice: string;
  selectionRevision: number;
  selectionKey: string | null;
  setPassport: (id: string) => void;
  setComparison: (id: string) => void;
  setDestination: (id: string) => void;
  purchase: (id: string) => void;
  reset: () => void;
}
export const useAppStore = create<AppState>((set, get) => ({
  passport: "IN",
  comparison: "DE",
  destination: "JP",
  world: INITIAL_WORLD_STATE,
  notice: "",
  selectionRevision: 0,
  selectionKey: null,
  setPassport: (id) => {
    if (catalog.passports.some((p) => p.id === id)) set({ passport: id, selectionKey: null });
  },
  setComparison: (id) => {
    if (catalog.passports.some((p) => p.id === id)) set({ comparison: id });
  },
  setDestination: (id) => {
    if (catalog.destinations.some((p) => p.id === id)) set({ destination: id, selectionRevision: get().selectionRevision + 1, selectionKey: `${get().passport}:${id}` });
  },
  purchase: (id) => {
    const result = engine.purchaseTreaty(get().world, id);
    if (result.success)
      set({
        world: result.data.nextState,
        notice: `${result.data.purchasedTreaty.name} added to your world.`,
      });
    else set({ notice: result.error.message });
  },
  reset: () =>
    set({
      world: INITIAL_WORLD_STATE,
      notice: "Your world is back to the beginning.",
    }),
}));
