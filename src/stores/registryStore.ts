import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GlucoseReading } from "../types/glucose";
import type { InsulinRecord } from "../types/insulin";
import type { FoodRecord } from "../types/food";
import type { CriticalAlert } from "../types/alerts";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { useAppStore } from "./appStore";

async function checkAndNotifyGlucose(value: number) {
  const registryState = useRegistryStore.getState();
  const appState = useAppStore.getState();
  if (appState.notificationPermission !== "granted") return;
  
  const currentPet = appState.currentPet;
  if (!currentPet) return;
  
  const lowLimit = currentPet.targetLow ?? 70;
  const highLimit = currentPet.targetHigh ?? 250;
  const petName = currentPet.name;
  
  let title = "";
  let body = "";
  let isLow = false;
  let isHigh = false;
  
  if (value < lowLimit) {
    isLow = true;
    title = `⚠️ Alerta de Glucosa Baja: ${petName}`;
    body = `La glucosa de ${petName} está en ${value} mg/dL, por debajo del límite de ${lowLimit} mg/dL.`;
  } else if (value > highLimit) {
    isHigh = true;
    title = `⚠️ Alerta de Glucosa Alta: ${petName}`;
    body = `La glucosa de ${petName} está en ${value} mg/dL, por encima del límite de ${highLimit} mg/dL.`;
  } else {
    return;
  }
  
  const now = Date.now();
  if (isLow) {
    // 30 min cooldown
    const cooldown = 30 * 60 * 1000;
    if (now - registryState.lastLowAlertTime < cooldown) {
      console.log("Glucose low alert skipped due to cooldown");
      return;
    }
    useRegistryStore.setState({ lastLowAlertTime: now });
  } else if (isHigh) {
    // 60 min cooldown
    const cooldown = 60 * 60 * 1000;
    if (now - registryState.lastHighAlertTime < cooldown) {
      console.log("Glucose high alert skipped due to cooldown");
      return;
    }
    useRegistryStore.setState({ lastHighAlertTime: now });
  }
  
  if (Capacitor.isNativePlatform()) {
    try {
      // Ensure the high-importance channel exists
      await LocalNotifications.createChannel({
        id: "critical-alerts",
        name: "Alertas Críticas",
        description: "Canal para alertas de glucosa alta y baja",
        importance: 5, // IMPORTANCE_HIGH (banner + sound + vibration)
        vibration: true,
        visibility: 1,
      });

      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: isLow ? 20001 : 20002, // Keep one notification per type to overwrite
            channelId: "critical-alerts",
            schedule: {
              at: new Date(Date.now() + 500),
              allowWhileIdle: true,
            },
          },
        ],
      });
    } catch (e) {
      console.error("Error sending native glucose notification:", e);
    }
  } else if ("Notification" in window) {
    new Notification(title, {
      body,
      icon: "/pwa-192x192.png",
    });
  }
}

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
  lastLowAlertTime: number;
  lastHighAlertTime: number;
  submitInsulin: (record: Omit<InsulinRecord, "id">) => Promise<SubmitResult>;
  submitFood: (record: Omit<FoodRecord, "id">) => Promise<void>;
  checkDoubleDose: () => boolean;
  resolveAlert: (alertId: string, resolution: "cancelled" | "forced") => void;
  getLastInsulinInRange: (hours: number) => InsulinRecord | null;
  submitGlucose: (record: Omit<GlucoseReading, "id">) => Promise<void>;
  addServerGlucoseReadings: (readings: GlucoseReading[]) => void;
  addServerInsulinRecords: (records: InsulinRecord[]) => void;
  addServerFoodRecords: (records: FoodRecord[]) => void;
}

let alertCounter = 0;

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
      lastLowAlertTime: 0,
      lastHighAlertTime: 0,

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
        const petId = useAppStore.getState().currentPet?.id;
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

        const petId = useAppStore.getState().currentPet?.id;
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

      submitGlucose: async (record) => {
        const tempId = crypto.randomUUID();
        const newRecord: GlucoseReading = { ...record, id: tempId };
        set((state) => ({
          glucoseRecords: [...state.glucoseRecords, newRecord].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          ),
        }));

        const petId = useAppStore.getState().currentPet?.id;
        if (petId && localStorage.getItem('jwt_token')) {
          try {
            const { apiRequest } = await import("../utils/api");
            const saved = await apiRequest(`/pets/${petId}/glucose`, {
              method: "POST",
              body: JSON.stringify({
                value: record.value,
                trend: record.trend,
                isHigh: record.isHigh,
                isLow: record.isLow,
                source: "manual",
                recordedAt: record.timestamp,
                clientId: tempId
              })
            });
            if (saved?.id) {
              set((s) => ({
                glucoseRecords: s.glucoseRecords.map((r) => r.id === tempId ? { ...r, id: saved.id } : r)
              }));
            }
          } catch (err) {
            console.error("Failed to push glucose to backend:", err);
          }
        }
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

          // Check if the most recent new reading is very recent and out of range
          const sortedNew = [...newReadings].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          if (sortedNew.length > 0) {
            const mostRecent = sortedNew[0];
            const readingTime = new Date(mostRecent.timestamp).getTime();
            const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
            if (readingTime > tenMinutesAgo) {
              checkAndNotifyGlucose(mostRecent.value);
            }
          }

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
        lastLowAlertTime: state.lastLowAlertTime,
        lastHighAlertTime: state.lastHighAlertTime,
      }),
    }
  )
);
