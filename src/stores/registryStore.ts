import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GlucoseReading } from "../types/glucose";
import type { InsulinRecord } from "../types/insulin";
import type { FoodRecord } from "../types/food";
import type { CriticalAlert } from "../types/alerts";

type SubmitResult = { success: true } | { success: false; alert: CriticalAlert };

interface RegistryState {
  insulinRecords: InsulinRecord[];
  foodRecords: FoodRecord[];
  glucoseRecords: GlucoseReading[];
  pendingInsulin: Omit<InsulinRecord, "id"> | null;
  pendingFood: Omit<FoodRecord, "id"> | null;
  alerts: CriticalAlert[];
  isAlertModalOpen: boolean;
  currentAlert: CriticalAlert | null;
  submitInsulin: (record: Omit<InsulinRecord, "id">) => Promise<SubmitResult>;
  submitFood: (record: Omit<FoodRecord, "id">) => Promise<void>;
  submitGlucose: (record: Omit<GlucoseReading, "id">) => void;
  checkDoubleDose: () => boolean;
  resolveAlert: (alertId: string, resolution: "cancelled" | "forced") => void;
  getLastInsulinInRange: (hours: number) => InsulinRecord | null;
  addServerGlucoseReadings: (readings: GlucoseReading[]) => void;
  addServerInsulinRecords: (records: InsulinRecord[]) => void;
  addServerFoodRecords: (records: FoodRecord[]) => void;
}

let alertCounter = 0;
let glucoseCounter = 0;

export const useRegistryStore = create<RegistryState>()(
  persist(
    (set, get) => ({
      insulinRecords: [],
      foodRecords: [],
      glucoseRecords: [],
      pendingInsulin: null,
      pendingFood: null,
      alerts: [],
      isAlertModalOpen: false,
      currentAlert: null,

      submitInsulin: async (record) => {
        const state = get();
        const hasDoubleDose = state.checkDoubleDose();
        if (hasDoubleDose) {
          const lastDose = state.getLastInsulinInRange(8)!;
          const alert: CriticalAlert = {
            id: `alert-${++alertCounter}`,
            type: "double_dose",
            timestamp: new Date().toISOString(),
            lastDose,
            attemptedDose: record,
            resolved: false,
          };
          set({
            alerts: [...state.alerts, alert],
            isAlertModalOpen: true,
            currentAlert: alert,
            pendingInsulin: record,
          });
          return { success: false, alert };
        }
        
        const tempId = crypto.randomUUID();
        const newRecord: InsulinRecord = { ...record, id: tempId };
        set({ insulinRecords: [...state.insulinRecords, newRecord] });

        // Intentar guardar en backend
        const petId = localStorage.getItem('active_pet_id');
        if (petId && localStorage.getItem('jwt_token')) {
          try {
            const { apiRequest } = await import("../utils/api");
            const saved = await apiRequest(`/pets/${petId}/insulin`, {
              method: "POST",
              body: JSON.stringify({
                units: record.units,
                insulinType: record.insulinType,
                caregiverId: record.caregiverId,
                notes: record.notes,
                administeredAt: record.timestamp,
                clientId: tempId
              })
            });
            if (saved?.id) {
              set((s) => ({
                insulinRecords: s.insulinRecords.map((r) => r.id === tempId ? { ...r, id: saved.id } : r)
              }));
            }
          } catch (err) {
            console.error("Failed to push insulin to backend:", err);
          }
        }

        return { success: true };
      },

      submitFood: async (record) => {
        const tempId = crypto.randomUUID();
        const newRecord: FoodRecord = { ...record, id: tempId };
        set((state) => ({ foodRecords: [...state.foodRecords, newRecord] }));

        const petId = localStorage.getItem('active_pet_id');
        if (petId && localStorage.getItem('jwt_token')) {
          try {
            const { apiRequest } = await import("../utils/api");
            const saved = await apiRequest(`/pets/${petId}/food`, {
              method: "POST",
              body: JSON.stringify({
                foodType: record.foodType,
                quantity: record.quantity,
                caregiverId: record.caregiverId,
                notes: record.notes,
                fedAt: record.timestamp,
                clientId: tempId
              })
            });
            if (saved?.id) {
              set((s) => ({
                foodRecords: s.foodRecords.map((r) => r.id === tempId ? { ...r, id: saved.id } : r)
              }));
            }
          } catch (err) {
            console.error("Failed to push food to backend:", err);
          }
        }
      },

      submitGlucose: (record) => {
        const newRecord: GlucoseReading = { ...record, id: `g-${++glucoseCounter}` };
        set((state) => ({ glucoseRecords: [...state.glucoseRecords, newRecord] }));
      },

      checkDoubleDose: () => {
        const state = get();
        const now = Date.now();
        const eightHoursAgo = now - 8 * 60 * 60 * 1000;
        return state.insulinRecords.some(
          (r) => new Date(r.timestamp).getTime() > eightHoursAgo
        );
      },

      resolveAlert: (alertId, resolution) => {
        const state = get();
        const updatedAlerts = state.alerts.map((a) =>
          a.id === alertId ? { ...a, resolved: true, resolution } : a
        );
        if (resolution === "forced" && state.pendingInsulin) {
          const newRecord: InsulinRecord = { ...state.pendingInsulin, id: `i-${Date.now()}` };
          set({
            alerts: updatedAlerts,
            isAlertModalOpen: false,
            currentAlert: null,
            pendingInsulin: null,
            insulinRecords: [...state.insulinRecords, newRecord],
          });
        } else {
          set({
            alerts: updatedAlerts,
            isAlertModalOpen: false,
            currentAlert: null,
            pendingInsulin: null,
          });
        }
      },

      getLastInsulinInRange: (hours) => {
        const state = get();
        const now = Date.now();
        const rangeStart = now - hours * 60 * 60 * 1000;
        const inRange = state.insulinRecords.filter(
          (r) => new Date(r.timestamp).getTime() > rangeStart
        );
        if (inRange.length === 0) return null;
        return inRange[inRange.length - 1];
      },

      addServerGlucoseReadings: (readings) => {
        set((state) => {
          const existingIds = new Set(state.glucoseRecords.map((r) => r.id));
          const newReadings = readings.filter((r) => !existingIds.has(r.id));
          if (newReadings.length === 0) return {};
          return {
            glucoseRecords: [...state.glucoseRecords, ...newReadings].sort(
              (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            ),
          };
        });
      },

      addServerInsulinRecords: (records) => {
        set((state) => {
          const existingIds = new Set(state.insulinRecords.map((r) => r.id));
          const newRecords = records.filter((r) => !existingIds.has(r.id));
          if (newRecords.length === 0) return {};
          return {
            insulinRecords: [...state.insulinRecords, ...newRecords].sort(
              (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            ),
          };
        });
      },

      addServerFoodRecords: (records) => {
        set((state) => {
          const existingIds = new Set(state.foodRecords.map((r) => r.id));
          const newRecords = records.filter((r) => !existingIds.has(r.id));
          if (newRecords.length === 0) return {};
          return {
            foodRecords: [...state.foodRecords, ...newRecords].sort(
              (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            ),
          };
        });
      },
    }),
    {
      name: "registry-storage",
      partialize: (state) => ({
        insulinRecords: state.insulinRecords,
        foodRecords: state.foodRecords,
        glucoseRecords: state.glucoseRecords,
      }),
    }
  )
);
