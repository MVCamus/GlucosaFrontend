import { create } from "zustand";
import type { DailySummary, NadirResult } from "../types/dashboard";
import type { GlucoseReading } from "../types/glucose";
import { useRegistryStore } from "./registryStore";
import { getTodayStr, getLocalDateStr } from "../utils/date";

const today = getTodayStr();

interface GlucoseState {
  dailySummary: DailySummary | null;
  isLoading: boolean;
  selectedDate: string;
  loadDay: (date: string) => void;
  getReadingsForChart: () => { time: string; glucose: number }[];
  calculateNadir: () => NadirResult | null;
}

function buildSummary(date: string): DailySummary {
  const registry = useRegistryStore.getState();
  const userReadings = registry.glucoseRecords.filter((r) => getLocalDateStr(r.timestamp) === date);
  const userInsulin = registry.insulinRecords.filter((r) => getLocalDateStr(r.timestamp) === date);
  const userFood = registry.foodRecords.filter((r) => getLocalDateStr(r.timestamp) === date);
  const allReadings = [...userReadings].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  return {
    date,
    sensorId: "active-sensor",
    glucoseReadings: allReadings,
    insulinRecords: userInsulin,
    foodRecords: userFood,
    nadir: null,
  };
}

export const useGlucoseStore = create<GlucoseState>((set, get) => ({
  dailySummary: buildSummary(today),
  isLoading: false,
  selectedDate: today,

  loadDay: (date: string) => {
    set({ isLoading: true });
    set({
      dailySummary: buildSummary(date),
      isLoading: false,
      selectedDate: date,
    });
  },

  getReadingsForChart: () => {
    const state = get();
    if (!state.dailySummary) return [];
    return state.dailySummary.glucoseReadings.map((r: GlucoseReading) => ({
      time: new Date(r.timestamp).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }),
      glucose: r.value,
    }));
  },

  calculateNadir: () => {
    const state = get();
    if (!state.dailySummary) return null;
    return state.dailySummary.nadir;
  },
}));
