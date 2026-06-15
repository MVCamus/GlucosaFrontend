import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Medication, MedicationLog, MedDailySlot, MedSlotStatus } from "../types/medication";
import { getShiftedTimeForSlot } from "../utils/medSlots";
import { useAppStore } from "./appStore";
import { getLocalDateStr } from "../utils/date";

interface MedicationState {
  medications: Medication[];
  logs: MedicationLog[];
  isFormOpen: boolean;
  editingMedication: Medication | null;
  addMedication: (med: Omit<Medication, "id" | "createdAt">) => Promise<void>;
  updateMedication: (id: string, changes: Partial<Medication>) => Promise<void>;
  deactivateMedication: (id: string) => Promise<void>;
  markGiven: (medicationId: string, scheduledTime: string, caregiverId: string, caregiverName: string) => Promise<void>;
  unmarkGiven: (logId: string) => Promise<void>;
  getDailySlots: (date: string) => MedDailySlot[];
  getTodayProgress: () => { given: number; total: number };
  getLogsForDate: (date: string) => MedicationLog[];
  openForm: (medication?: Medication) => void;
  closeForm: () => void;
  addServerMedications: (meds: Medication[]) => void;
  addServerMedicationLogs: (logs: MedicationLog[]) => void;
}

export const useMedicationStore = create<MedicationState>()(
  persist(
    (set, get) => ({
      medications: [],
      logs: [],
      isFormOpen: false,
      editingMedication: null,

      addMedication: async (med) => {
        const tempId = crypto.randomUUID();
        const newMed: Medication = {
          ...med,
          id: tempId,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ medications: [...state.medications, newMed] }));

        const petId = useAppStore.getState().currentPet?.id;
        if (petId && localStorage.getItem('jwt_token')) {
          try {
            const { apiRequest } = await import("../utils/api");
            const saved = await apiRequest(`/pets/${petId}/medications`, {
              method: "POST",
              body: JSON.stringify({
                name: med.name,
                dose: med.dose,
                frequency: med.frequency,
                scheduledTimes: med.scheduledTimes,
                notifyMinutesBefore: med.notifyMinutesBefore,
                active: med.active,
                isStrict: med.isStrict,
                startDate: med.startDate,
                endDate: med.endDate,
                clientId: tempId
              })
            });
            if (saved?.id) {
              set((s) => ({
                medications: s.medications.map((m) => m.id === tempId ? { ...m, id: saved.id } : m)
              }));
            }
          } catch (err) {
            console.error("Failed to push medication to backend:", err);
          }
        }
      },

      updateMedication: async (id, changes) => {
        set((state) => ({
          medications: state.medications.map((m) =>
            m.id === id ? { ...m, ...changes } : m
          ),
        }));

        const petId = useAppStore.getState().currentPet?.id || 'any';
        if (localStorage.getItem('jwt_token') && !id.startsWith("m-")) {
          try {
            const { apiRequest } = await import("../utils/api");
            await apiRequest(`/pets/${petId}/medications/${id}`, {
              method: "PUT",
              body: JSON.stringify(changes)
            });
          } catch (err) {
            console.error("Failed to update medication on backend:", err);
          }
        }
      },

      deactivateMedication: async (id) => {
        set((state) => ({
          medications: state.medications.filter((m) => m.id !== id),
        }));

        const petId = useAppStore.getState().currentPet?.id || 'any';
        if (localStorage.getItem('jwt_token') && !id.startsWith("m-")) {
          try {
            const { apiRequest } = await import("../utils/api");
            await apiRequest(`/pets/${petId}/medications/${id}`, {
              method: "DELETE"
            });
          } catch (err) {
            console.error("Failed to delete medication on backend:", err);
          }
        }
      },

      markGiven: async (medicationId, scheduledTime, caregiverId, caregiverName) => {
        const state = get();
        const med = state.medications.find((m) => m.id === medicationId);
        if (!med) return;
        const tempId = crypto.randomUUID();
        const newLog: MedicationLog = {
          id: tempId,
          medicationId,
          medicationName: med.name,
          scheduledTime,
          givenAt: new Date().toISOString(),
          caregiverId,
          caregiverName,
        };
        set((state) => ({ logs: [...state.logs, newLog] }));

        const petId = useAppStore.getState().currentPet?.id || 'any';
        if (localStorage.getItem('jwt_token') && !medicationId.startsWith("m-")) {
          try {
            const { apiRequest } = await import("../utils/api");
            const saved = await apiRequest(`/pets/${petId}/medications/${medicationId}/logs`, {
              method: "POST",
              body: JSON.stringify({
                caregiverId,
                medicationName: med.name,
                scheduledTime,
                givenAt: newLog.givenAt,
                clientId: tempId
              })
            });
            if (saved?.id) {
              set((s) => ({
                logs: s.logs.map((l) => l.id === tempId ? { ...l, id: saved.id } : l)
              }));
            }
          } catch (err) {
            console.error("Failed to push medication log to backend:", err);
          }
        }
      },

      unmarkGiven: async (logId) => {
        const state = get();
        const log = state.logs.find((l) => l.id === logId);
        set((state) => ({
          logs: state.logs.filter((l) => l.id !== logId),
        }));

        const petId = useAppStore.getState().currentPet?.id || 'any';
        if (log && localStorage.getItem('jwt_token') && !logId.startsWith("ml-")) {
          try {
            const { apiRequest } = await import("../utils/api");
            await apiRequest(`/pets/${petId}/medications/logs/${logId}`, {
              method: "DELETE"
            });
          } catch (err) {
            console.error("Failed to delete medication log on backend:", err);
          }
        }
      },

      getDailySlots: (date) => {
        const state = get();
        const activeMeds = state.medications.filter((m) => {
          if (!m.active) return false;
          if (m.startDate && date < m.startDate) return false;
          if (m.endDate && date > m.endDate) return false;
          return true;
        });
        const dayLogs = state.getLogsForDate(date);
        const now = new Date();
        const [todayYear, todayMonth, todayDay] = date.split("-").map(Number);
        
        return activeMeds.flatMap((med) =>
          med.scheduledTimes.map((scheduledTime) => {
            const log = dayLogs.find(
              (l) => l.medicationId === med.id && l.scheduledTime === scheduledTime
            );
            let status: MedSlotStatus = "pending";
            
            let slotDate: Date;
            let shiftedTime: string | undefined;

            if (med.isStrict) {
              slotDate = getShiftedTimeForSlot(med, scheduledTime, date, state.logs);
              const h = String(slotDate.getHours()).padStart(2, "0");
              const m = String(slotDate.getMinutes()).padStart(2, "0");
              shiftedTime = `${h}:${m}`;
            } else {
              const [hours, minutes] = scheduledTime.split(":").map(Number);
              slotDate = new Date(todayYear, todayMonth - 1, todayDay, hours, minutes);
            }

            if (log) {
              status = "given";
            } else {
              const diff = now.getTime() - slotDate.getTime();
              if (diff > 30 * 60 * 1000) {
                status = "overdue";
              }
            }
            return { medication: med, scheduledTime, shiftedTime, status, log: log || null };
          })
        );
      },

      getTodayProgress: () => {
        const today = new Date().toISOString().split("T")[0];
        const slots = get().getDailySlots(today);
        const given = slots.filter((s) => s.status === "given").length;
        return { given, total: slots.length };
      },

      getLogsForDate: (date) => {
        return get().logs.filter((l) => getLocalDateStr(l.givenAt) === date);
      },

      openForm: (medication) => {
        set({ isFormOpen: true, editingMedication: medication || null });
      },

      closeForm: () => {
        set({ isFormOpen: false, editingMedication: null });
      },

      addServerMedications: (meds) => {
        set((state) => {
          const existingIds = new Set(state.medications.map((m) => m.id));
          const newMeds = meds.filter((m) => !existingIds.has(m.id));
          if (newMeds.length === 0) return {};
          return {
            medications: [...state.medications, ...newMeds],
          };
        });
      },

      addServerMedicationLogs: (newLogs) => {
        set((state) => {
          const existingIds = new Set(state.logs.map((l) => l.id));
          const filteredLogs = newLogs.filter((l) => !existingIds.has(l.id));
          if (filteredLogs.length === 0) return {};
          return {
            logs: [...state.logs, ...filteredLogs],
          };
        });
      },
    }),
    {
      name: "medication-storage",
      partialize: (state) => ({
        medications: state.medications,
        logs: state.logs,
      }),
    }
  )
);