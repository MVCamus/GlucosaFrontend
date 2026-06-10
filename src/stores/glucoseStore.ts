import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DailySummary, NadirResult } from "../types/dashboard";
import type { GlucoseReading } from "../types/glucose";
import { useRegistryStore } from "./registryStore";

const today = new Date().toISOString().split("T")[0];

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
  const userReadings = registry.glucoseRecords.filter((r) => r.timestamp.startsWith(date));
  const userInsulin = registry.insulinRecords.filter((r) => r.timestamp.startsWith(date));
  const userFood = registry.foodRecords.filter((r) => r.timestamp.startsWith(date));
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

export const useGlucoseStore = create<GlucoseState>()(
  persist(
    (set, get) => ({
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
    }),
    {
      name: "glucose-storage",
      partialize: (state) => ({
        dailySummary: state.dailySummary,
        selectedDate: state.selectedDate,
      }),
    }
  )
);
