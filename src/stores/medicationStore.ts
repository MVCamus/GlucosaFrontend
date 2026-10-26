import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Medication, MedicationLog, MedDailySlot, MedSlotStatus } from "../types/medication";
import { getShiftedTimeForSlot } from "../utils/medSlots";
import { useAppStore } from "./appStore";
import { getLocalDateStr, getTodayStr } from "../utils/date";

function normalizeIncomingMedications(
  meds: Medication[],
  petId: string
): Medication[] {
  return meds.map((med) => ({
    ...med,
    petId: med.petId || petId,
    synced: true,
  }));
}

function mergeMedication(
  local: Medication,
  server: Medication | undefined,
  petId: string
): Medication {
  if (!server) {
    return local.petId ? local : { ...local, petId };
  }

  return {
    ...local,
    ...server,
    petId: server.petId || local.petId || petId,
    synced: true,
  };
}

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
  upsertServerMedications: (meds: Medication[], petId: string) => void;
  reconcileMedications: (meds: Medication[], petId: string) => void;
  addServerMedicationLogs: (logs: MedicationLog[]) => void;
  getUnsyncedMedications: () => Medication[];
  getUnsyncedLogs: () => MedicationLog[];
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
        const petId = useAppStore.getState().currentPet?.id;
        const newMed: Medication = {
          ...med,
          id: tempId,
          petId,
          createdAt: new Date().toISOString(),
          synced: false,
        };
        set((state) => ({ medications: [...state.medications, newMed] }));

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
                medications: s.medications.map((m) => m.id === tempId ? { ...m, id: saved.id, synced: true } : m)
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

        const petId = useAppStore.getState().currentPet?.id;
        if (!petId) return;

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
        const petId = useAppStore.getState().currentPet?.id;
        if (!petId) return;

        if (localStorage.getItem('jwt_token') && !id.startsWith("m-")) {
          try {
            const { apiRequest } = await import("../utils/api");
            await apiRequest(`/pets/${petId}/medications/${id}`, {
              method: "DELETE"
            });
            set((state) => ({
              medications: state.medications.filter((m) => m.id !== id),
            }));
          } catch (err) {
            console.error("Failed to delete medication on backend:", err);
            useAppStore.getState().addToast({ message: "Error al eliminar el remedio", type: "error" });
          }
        } else {
          set((state) => ({
            medications: state.medications.filter((m) => m.id !== id),
          }));
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
          synced: false,
        };
        set((state) => ({ logs: [...state.logs, newLog] }));

        const petId = useAppStore.getState().currentPet?.id;
        if (!petId) return;

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
                logs: s.logs.map((l) => l.id === tempId ? { ...l, id: saved.id, synced: true } : l)
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

        const petId = useAppStore.getState().currentPet?.id;
        if (!petId) return;

        if (log && localStorage.getItem('jwt_token') && !logId.startsWith("ml-")) {
          try {
            const { apiRequest } = await import("../utils/api");
            await apiRequest(`/pets/${petId}/medications/logs/${logId}`, {
              method: "DELETE"
            });
            set((state) => ({
              logs: state.logs.filter((l) => l.id !== logId),
            }));
          } catch (err) {
            console.error("Failed to delete medication log on backend:", err);
            useAppStore.getState().addToast({ message: "Error al desmarcar el remedio", type: "error" });
          }
        } else {
          set((state) => ({
            logs: state.logs.filter((l) => l.id !== logId),
          }));
        }
      },

      getDailySlots: (date) => {
        const state = get();
        const currentPetId = useAppStore.getState().currentPet?.id;
        const activeMeds = state.medications.filter((m) => {
          if (currentPetId && m.petId && m.petId !== currentPetId) return false;
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
        const today = getTodayStr();
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

      upsertServerMedications: (meds, petId) => {
        set((state) => {
          const incoming = normalizeIncomingMedications(meds, petId);
          const incomingById = new Map(incoming.map((m) => [m.id, m]));

          const merged = state.medications.map((local) =>
            mergeMedication(local, incomingById.get(local.id), petId)
          );

          const existingIds = new Set(merged.map((m) => m.id));
          for (const med of incoming) {
            if (!existingIds.has(med.id)) merged.push(med);
          }

          return { medications: merged };
        });
      },

      /**
       * Reconciliación completa contra el servidor.
       * - Actualiza los medicamentos existentes (incluido `active`/`endDate`).
       * - Elimina los medicamentos sincronizados que ya no existen en el servidor.
       * - Conserva los medicamentos locales que aún no se han sincronizado.
       */
      reconcileMedications: (meds, petId) => {
        set((state) => {
          const incoming = normalizeIncomingMedications(meds, petId);
          const incomingById = new Map(incoming.map((m) => [m.id, m]));

          const kept: Medication[] = [];
          for (const local of state.medications) {
            const belongsToPet = !local.petId || local.petId === petId;

            if (!belongsToPet) {
              kept.push(local);
              continue;
            }

            const server = incomingById.get(local.id);
            if (server) {
              kept.push(mergeMedication(local, server, petId));
              continue;
            }

            // Medicamento creado offline: no debe perderse.
            if (local.synced === false) {
              kept.push({ ...local, petId: local.petId || petId });
            }
            // Si estaba sincronizado y el servidor ya no lo devuelve, se elimina.
          }

          const keptIds = new Set(kept.map((m) => m.id));
          for (const med of incoming) {
            if (!keptIds.has(med.id)) kept.push(med);
          }

          return { medications: kept };
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

      getUnsyncedMedications: () => {
        const petId = useAppStore.getState().currentPet?.id;
        return get().medications.filter(
          (m) =>
            m.synced === false &&
            (!petId || !m.petId || m.petId === petId)
        );
      },

      getUnsyncedLogs: () => {
        return get().logs.filter((l) => l.synced === false);
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