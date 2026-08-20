import { create } from 'zustand';
import { apiRequest } from '../utils/api';
import type {
  LibreLinkStatus,
  LibreLinkConnectResponse,
  LibreLinkDisconnectResponse,
} from '../types/librelink';

interface LibreLinkState {
  status: LibreLinkStatus | null;
  loading: boolean;
  connecting: boolean;
  error: string | null;

  fetchStatus: (petId: string) => Promise<void>;
  connect: (petId: string, email: string, password: string) => Promise<boolean>;
  disconnect: (petId: string) => Promise<boolean>;
  clear: () => void;
}

const emptyStatus: LibreLinkStatus = {
  connected: false,
  email: null,
  patientId: null,
  status: null,
  lastError: null,
  lastPollAt: null,
  sensorActive: false,
  sensorExpiresAt: null,
  lastReadingValue: null,
  lastReadingTrend: null,
  lastReadingAt: null,
};

export const useLibreLinkStore = create<LibreLinkState>((set) => ({
  status: null,
  loading: false,
  connecting: false,
  error: null,

  fetchStatus: async (petId: string) => {
    if (!petId) return;
    set({ loading: true, error: null });
    try {
      const data = await apiRequest<LibreLinkStatus>(`/pets/${petId}/librelink/status`);
      set({ status: data ?? emptyStatus, loading: false });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al consultar estado LibreLink';
      set({ loading: false, error: msg });
    }
  },

  connect: async (petId: string, email: string, password: string) => {
    if (!petId) return false;
    set({ connecting: true, error: null });
    try {
      const data = await apiRequest<LibreLinkConnectResponse>(`/pets/${petId}/librelink`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      set({
        connecting: false,
        status: {
          connected: true,
          email: data?.email ?? email,
          patientId: data?.patientId ?? null,
          status: 'active',
          lastError: null,
          lastPollAt: new Date().toISOString(),
          sensorActive: true,
          sensorExpiresAt: null,
          lastReadingValue: null,
          lastReadingTrend: null,
          lastReadingAt: null,
        },
      });
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      let friendly = 'No se pudo conectar el sensor LibreLink';
      if (msg.includes('400')) friendly = 'Credenciales de LibreLink inválidas';
      else if (msg.includes('403')) friendly = 'Solo el dueño o admin puede conectar el sensor';
      else if (msg.includes('404')) friendly = 'Mascota no encontrada';
      set({ connecting: false, error: friendly });
      return false;
    }
  },

  disconnect: async (petId: string) => {
    if (!petId) return false;
    set({ loading: true, error: null });
    try {
      await apiRequest<LibreLinkDisconnectResponse>(`/pets/${petId}/librelink`, {
        method: 'DELETE',
      });
      set({ status: { ...emptyStatus }, loading: false });
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al desconectar el sensor';
      set({ loading: false, error: msg });
      return false;
    }
  },

  clear: () => set({ status: null, loading: false, connecting: false, error: null }),
}));