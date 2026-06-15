import { useEffect } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { useRegistryStore } from '../stores/registryStore';
import { useAppStore } from '../stores/appStore';
import { useMedicationStore } from '../stores/medicationStore';
import { apiRequest } from '../utils/api';

export function useSync() {
  const isOnline = useOnlineStatus();
  const currentCaregiverId = useAppStore((s) => s.currentCaregiverId);
  const currentPetId = useAppStore((s) => s.currentPet?.id);
  const isAdminLoggedIn = useAppStore((s) => s.isAdminLoggedIn);

  const syncData = async () => {
    if (!isOnline) return;

    const token = localStorage.getItem('jwt_token');
    if (!token) return; // No sincronizar si no está autenticado en el backend

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

      // 2. Obtener última marca de tiempo de sincronización local
      const lastSync = localStorage.getItem('last_sync_time') || new Date(0).toISOString();

      // 3. Descargar datos nuevos del servidor
      const response = await apiRequest(`/sync/pull?petId=${petId}&since=${lastSync}`);
      
      if (response) {
        const { glucoseReadings, insulinRecords, foodRecords, medications, medicationLogs } = response;

        if (glucoseReadings && glucoseReadings.length > 0) {
          // Mapear recordedAt de la BD al campo timestamp que espera el frontend
          const mappedReadings = glucoseReadings.map((r: any) => ({
            id: r.id,
            timestamp: r.recordedAt,
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
            timestamp: r.administeredAt,
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
            timestamp: r.fedAt,
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
        
        localStorage.setItem('last_sync_time', new Date().toISOString());
      }
    } catch (error) {
      console.error('Error durante la sincronización:', error);
    }
  };

  useEffect(() => {
    syncData();
    const interval = setInterval(syncData, 30000); // Sincronizar cada 30 segundos si está online
    return () => clearInterval(interval);
  }, [isOnline, currentCaregiverId, currentPetId, isAdminLoggedIn]);
}
