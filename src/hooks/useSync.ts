import { useEffect, useState, useCallback, useRef } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { useRegistryStore } from '../stores/registryStore';
import { useAppStore } from '../stores/appStore';
import { useMedicationStore } from '../stores/medicationStore';
import { useGlucoseStore } from '../stores/glucoseStore';
import { apiRequest } from '../utils/api';
import { getTodayStr } from '../utils/date';

// Lock singleton a nivel de módulo: evita llamadas múltiples a /sync/pull en paralelo
// (causa del error EMAXCONNSESSION reportado por el backend).
let syncInProgress = false;
let syncQueuePending = false;
const SYNC_INTERVAL_MS = 5000;
const SYNC_DEBOUNCE_MS = 500; // Retraso antes de lanzar sync — primero cargar UI
const DEFAULT_SINCE_HOURS = 24; // Default: 24h atrás (NO 1970)

function getDefaultSince(): string {
  return new Date(Date.now() - DEFAULT_SINCE_HOURS * 60 * 60 * 1000).toISOString();
}

function getLastSyncForPet(petId: string): string {
  const key = `last_sync_time_${petId}`;
  return localStorage.getItem(key) || getDefaultSince();
}

function setLastSyncForPet(petId: string, iso: string): void {
  localStorage.setItem(`last_sync_time_${petId}`, iso);
}

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
        source: r.source || 'manual',
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
  };

  const syncData = useCallback(async () => {
    if (!isOnline) return;

    const token = localStorage.getItem('jwt_token');
    if (!token) return; // No sincronizar si no está autenticado

    // LOCK singleton: si ya hay un sync en curso, marcamos pendiente y salimos.
    // El sync en curso reintentará al terminar si hay pendientes.
    if (syncInProgress) {
      syncQueuePending = true;
      return;
    }
    syncInProgress = true;
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

      // 1. Empujar datos pendientes al servidor
      pushPendingData(petId!).catch(err => console.error('Error pushing pending data:', err));

      // 2. Obtener lastSyncAt guardado (default 24h atrás si no existe)
      const since = getLastSyncForPet(petId!);

      // 3. Descargar datos nuevos del servidor (serializado: nunca en paralelo con otros pulls)
      const response = await apiRequest(`/sync/pull?petId=${petId}&since=${encodeURIComponent(since)}`);

      if (response) {
        const { glucoseReadings, insulinRecords, foodRecords, medications, medicationLogs } = response;

        // El backend entrega fechas en UTC con sufijo Z. Las pasamos directas al store:
        // el display en pantalla ya se formatea forzando zona America/Santiago (ver utils/date.ts).
        const toTimestamp = (val: string) => val;

        if (glucoseReadings && glucoseReadings.length > 0) {
          const mappedReadings = glucoseReadings.map((r: any) => ({
            id: r.id,
            timestamp: toTimestamp(r.recordedAt),
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
            timestamp: toTimestamp(r.administeredAt),
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
            timestamp: toTimestamp(r.fedAt),
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

        // Guardar la marca de tiempo ACTUAL como nuevo lastSyncAt para la próxima vez
        setLastSyncForPet(petId!, new Date().toISOString());
      }
    } catch (error) {
      console.error('Error durante la sincronización:', error);
    } finally {
      syncInProgress = false;
      setSyncing(false);
      // Si llegaron más requests mientras sincronizábamos, lanzar uno final
      if (syncQueuePending) {
        syncQueuePending = false;
        // Pequeño debounce para no spammear
        setTimeout(() => { syncData(); }, SYNC_DEBOUNCE_MS);
      }
    }
  }, [isOnline, currentPetId]);

  const syncNow = useCallback(() => {
    // Forzar pull completo: usar default 24h atrás (no 1970)
    const petId = currentPetId;
    if (petId) {
      localStorage.setItem(`last_sync_time_${petId}`, getDefaultSince());
    }
    syncData();
  }, [syncData, currentPetId]);

  // Serialización UI primero: la primera sincronización se lanza tras 500ms,
  // no inmediatamente, para que la UI ya tenga los datos de fetchInitialData cargados.
  const initialTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (currentCaregiverId === null && !isAdminLoggedIn) return;
    // Lanzar sync tras 500ms (no en paralelo con fetchInitialData/login)
    initialTimerRef.current = setTimeout(() => {
      syncData();
    }, SYNC_DEBOUNCE_MS);

    const interval = setInterval(() => {
      // El guard interno del lock evita llamadas paralelas
      syncData();
    }, SYNC_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        // Re-sync al volver a la app, con debounce
        setTimeout(() => syncData(), 100);
        useGlucoseStore.getState().loadDay(getTodayStr());
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (initialTimerRef.current) clearTimeout(initialTimerRef.current);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isOnline, currentCaregiverId, currentPetId, isAdminLoggedIn, syncData]);

  return { syncNow, syncing };
}