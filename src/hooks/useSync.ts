import { useEffect, useState, useCallback } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { useRegistryStore } from '../stores/registryStore';
import { useAppStore } from '../stores/appStore';
import { useMedicationStore } from '../stores/medicationStore';
import { useGlucoseStore } from '../stores/glucoseStore';
import { apiRequest } from '../utils/api';
import { getTodayStr } from '../utils/date';

export function useSync() {
  const isOnline = useOnlineStatus();
  const currentCaregiverId = useAppStore((s) => s.currentCaregiverId);
  const currentPetId = useAppStore((s) => s.currentPet?.id);
  const isAdminLoggedIn = useAppStore((s) => s.isAdminLoggedIn);
  const [syncing, setSyncing] = useState(false);

  const pushPendingData = async (petId: string) => {
    const registryStore = useRegistryStore.getState();
    const medicationStore = useMedicationStore.getState();
    const unsynced = registryStore.getUnsyncedRecords();
    const unsyncedMeds = medicationStore.getUnsyncedMedications();
    const unsyncedLogs = medicationStore.getUnsyncedLogs();

    const hasPendingData =
      unsynced.insulin.length > 0 ||
      unsynced.food.length > 0 ||
      unsynced.glucose.length > 0 ||
      unsyncedMeds.length > 0 ||
      unsyncedLogs.length > 0;

    if (!hasPendingData) return;

    try {
      const payload: any = {
        petId,
        records: {} as any,
      };

      if (unsynced.glucose.length > 0) {
        payload.records.glucoseReadings = unsynced.glucose.map((r) => ({
          value: r.value,
          trend: r.trend,
          isHigh: r.isHigh,
          isLow: r.isLow,
          source: r.source || "manual",
          recordedAt: r.timestamp,
          clientId: r.id,
        }));
      }

      if (unsynced.insulin.length > 0) {
        payload.records.insulinRecords = unsynced.insulin.map((r) => ({
          units: r.units,
          insulinType: r.insulinType,
          caregiverId: r.caregiverId,
          caregiverName: r.caregiverName,
          notes: r.notes,
          administeredAt: r.timestamp,
          clientId: r.id,
        }));
      }

      if (unsynced.food.length > 0) {
        payload.records.foodRecords = unsynced.food.map((r) => ({
          foodType: r.foodType,
          quantity: r.quantity,
          caregiverId: r.caregiverId,
          caregiverName: r.caregiverName,
          notes: r.notes,
          fedAt: r.timestamp,
          clientId: r.id,
        }));
      }

      if (unsyncedMeds.length > 0) {
        payload.records.medications = unsyncedMeds.map((m) => ({
          name: m.name,
          dose: m.dose,
          frequency: m.frequency,
          scheduledTimes: m.scheduledTimes,
          notifyMinutesBefore: m.notifyMinutesBefore,
          active: m.active,
          isStrict: m.isStrict,
          startDate: m.startDate,
          clientId: m.id,
        }));
      }

      if (unsyncedLogs.length > 0) {
        payload.records.medicationLogs = unsyncedLogs.map((l) => ({
          medicationId: l.medicationId,
          medicationName: l.medicationName,
          scheduledTime: l.scheduledTime,
          givenAt: l.givenAt,
          caregiverId: l.caregiverId,
          caregiverName: l.caregiverName,
          clientId: l.id,
        }));
      }

      const result = await apiRequest("/sync/push", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (result?.mappings) {
        const { mappings } = result;

        (useRegistryStore as any).setState((state: any) => ({
          insulinRecords: state.insulinRecords.map((r: any) => {
            const serverId = mappings[r.id];
            return serverId ? { ...r, id: serverId, synced: true } : r;
          }),
          foodRecords: state.foodRecords.map((r: any) => {
            const serverId = mappings[r.id];
            return serverId ? { ...r, id: serverId, synced: true } : r;
          }),
          glucoseRecords: state.glucoseRecords.map((r: any) => {
            const serverId = mappings[r.id];
            return serverId ? { ...r, id: serverId, synced: true } : r;
          }),
        }));

        (useMedicationStore as any).setState((state: any) => ({
          medications: state.medications.map((m: any) => {
            const serverId = mappings[m.id];
            return serverId ? { ...m, id: serverId, synced: true } : m;
          }),
          logs: state.logs.map((l: any) => {
            const serverId = mappings[l.id];
            return serverId ? { ...l, id: serverId, synced: true } : l;
          }),
        }));
      }
    } catch (err) {
      console.error("Error pushing pending data:", err);
    }
  };

  const syncData = useCallback(async () => {
    if (!isOnline) return;

    const token = localStorage.getItem('jwt_token');
    if (!token) return; // No sincronizar si no está autenticado en el backend

    setSyncing(true);
    try {
      let petId = currentPetId;
      if (!petId) {
        const pets = await apiRequest('/pets');
        if (pets && pets.length > 0) {
          petId = pets[0].id;
          useAppStore.getState().setCurrentPet(pets[0]);
        } else {
          console.warn('No se encontraron mascotas en el servidor.');
          return;
        }
      }

      // 2. Empujar datos pendientes al servidor
      await pushPendingData(petId!);

      // 3. Obtener última marca de tiempo de sincronización local
      const lastSyncKey = `last_sync_time_${petId}`;
      const lastSync = localStorage.getItem(lastSyncKey) || new Date(0).toISOString();

      // 4. Descargar datos nuevos del servidor
      const response = await apiRequest(`/sync/pull?petId=${petId}&since=${lastSync}`);
      
      if (response) {
        const { glucoseReadings, insulinRecords, foodRecords, medications, medicationLogs } = response;

        const toLocalIso = (val: string) => new Date(val.replace(' ', 'T')).toISOString();

        if (glucoseReadings && glucoseReadings.length > 0) {
          // Mapear recordedAt de la BD al campo timestamp que espera el frontend
          const mappedReadings = glucoseReadings.map((r: any) => ({
            id: r.id,
            timestamp: toLocalIso(r.recordedAt),
            value: r.value,
            unit: r.unit || 'mg/dL',
            trend: r.trend,
            isHigh: r.isHigh,
            isLow: r.isLow,
            source: r.source
          }));

          useRegistryStore.getState().addServerGlucoseReadings(mappedReadings);
        }

        if (insulinRecords && insulinRecords.length > 0) {
          const mappedInsulin = insulinRecords.map((r: any) => ({
            id: r.id,
            timestamp: toLocalIso(r.administeredAt),
            units: r.units,
            insulinType: r.insulinType,
            caregiverId: r.caregiverId,
            caregiverName: r.caregiver?.name || 'Sistema',
            notes: r.notes || undefined,
          }));
          useRegistryStore.getState().addServerInsulinRecords(mappedInsulin);
        }

        if (foodRecords && foodRecords.length > 0) {
          const mappedFood = foodRecords.map((r: any) => ({
            id: r.id,
            timestamp: toLocalIso(r.fedAt),
            foodType: r.foodType,
            quantity: r.quantity,
            caregiverId: r.caregiverId,
            caregiverName: r.caregiver?.name || 'Sistema',
            notes: r.notes || undefined,
          }));
          useRegistryStore.getState().addServerFoodRecords(mappedFood);
        }

        if (medications && medications.length > 0) {
          const mappedMeds = medications.map((m: any) => ({
            id: m.id,
            name: m.name,
            dose: m.dose,
            frequency: m.frequency,
            scheduledTimes: m.scheduledTimes,
            notifyMinutesBefore: m.notifyMinutesBefore,
            active: m.active,
            isStrict: m.isStrict ?? false,
            createdAt: m.createdAt || new Date().toISOString(),
            startDate: m.startDate ? m.startDate.split('T')[0] : new Date().toISOString().split('T')[0],
            endDate: m.endDate ? m.endDate.split('T')[0] : undefined,
          }));
          useMedicationStore.getState().addServerMedications(mappedMeds);
        }

        if (medicationLogs && medicationLogs.length > 0) {
          const mappedLogs = medicationLogs.map((l: any) => ({
            id: l.id,
            medicationId: l.medicationId,
            medicationName: l.medicationName,
            scheduledTime: l.scheduledTime,
            givenAt: l.givenAt,
            caregiverId: l.caregiverId,
            caregiverName: l.caregiver?.name || 'Sistema',
          }));
          useMedicationStore.getState().addServerMedicationLogs(mappedLogs);
        }
        
        localStorage.setItem(lastSyncKey, new Date().toISOString());
      }
    } catch (error) {
      console.error('Error durante la sincronización:', error);
    } finally {
      setSyncing(false);
    }
  }, [isOnline, currentPetId]);

  const syncNow = useCallback(() => {
    // Force sync by clearing last_sync_time to pull all data
    const petId = currentPetId;
    if (petId) {
      localStorage.removeItem(`last_sync_time_${petId}`);
    }
    syncData();
  }, [syncData, currentPetId]);

  useEffect(() => {
    syncData();
    const interval = setInterval(syncData, 5000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncData();
        useGlucoseStore.getState().loadDay(getTodayStr());
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isOnline, currentCaregiverId, currentPetId, isAdminLoggedIn, syncData]);

  return { syncNow, syncing };
}
