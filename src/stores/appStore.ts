import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Caregiver } from "../types/caregiver";
import type { SensorStatus } from "../types/sensor";
import type { DogProfile } from "../types/dog";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { PushNotifications } from "@capacitor/push-notifications";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
}

interface AppState {
  showEventsOnChart: boolean;
  isChartFullscreen: boolean;
  isExportModalOpen: boolean;
  isOnline: boolean;
  showInstallPrompt: boolean;
  notificationPermission: NotificationPermission;
  toastQueue: Toast[];
  customInsulinTypes: string[];
  caregivers: Caregiver[];
  pets: DogProfile[];
  currentPet: DogProfile | null;
  currentCaregiverId: string | null;
  isAdminLoggedIn: boolean;
  adminPassword: string;
  sensorStatus: SensorStatus | null;
  hasToken: boolean;
  toggleEvents: () => void;
  setChartFullscreen: (val: boolean) => void;
  openExportModal: () => void;
  closeExportModal: () => void;
  setOnline: (status: boolean) => void;
  setInstallPrompt: (val: boolean) => void;
  requestNotificationPermission: () => Promise<NotificationPermission>;
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  addCustomInsulinType: (name: string) => void;
  removeCustomInsulinType: (name: string) => void;
  login: (caregiverIdOrName: string, password: string) => Promise<boolean>;
  logout: () => void;
  currentCaregiver: () => Caregiver | null;
  addCaregiver: (caregiver: Omit<Caregiver, "id"> & { petId?: string }) => Promise<void>;
  updateCaregiver: (id: string, changes: Partial<Caregiver> & { petId?: string }) => Promise<void>;
  removeCaregiver: (id: string) => Promise<void>;
  adminLogin: (password: string) => Promise<boolean>;
  changeAdminPassword: (newPass: string) => void;
  registerNewSensor: (model: string, serial: string) => Promise<void>;
  addPet: (pet: Omit<DogProfile, "id">) => Promise<DogProfile | null>;
  updatePet: (id: string, changes: Partial<DogProfile>) => Promise<void>;
  loadPets: () => Promise<void>;
  loadCaregivers: () => Promise<void>;
  fetchInitialData: () => Promise<void>;
  registerPushNotifications: () => Promise<void>;
  setCurrentPet: (pet: DogProfile | null) => void;
  onboardingCompleted: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

let toastCounter = 0;

const ADMIN_CAREGIVER: Caregiver = { id: "admin", name: "Administrador", role: "admin", password: "" };
let cachedFallbackCaregiver: Caregiver | null = null;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      showEventsOnChart: true,
      isChartFullscreen: false,
      isExportModalOpen: false,
      isOnline: true,
      showInstallPrompt: false,
      notificationPermission: "default" as NotificationPermission,
      toastQueue: [],
      customInsulinTypes: [],
      caregivers: [],
      pets: [],
      currentPet: null,
      currentCaregiverId: null,
      isAdminLoggedIn: false,
      adminPassword: "admin",
      sensorStatus: null,
      hasToken: !!localStorage.getItem("jwt_token"),
      onboardingCompleted: false,
      completeOnboarding: () => set({ onboardingCompleted: true }),
      resetOnboarding: () => set({ onboardingCompleted: false }),

      toggleEvents: () => set((s) => ({ showEventsOnChart: !s.showEventsOnChart })),
      setChartFullscreen: (val) => set({ isChartFullscreen: val }),
      openExportModal: () => set({ isExportModalOpen: true }),
      closeExportModal: () => set({ isExportModalOpen: false }),
      setOnline: (status) => set({ isOnline: status }),
      setInstallPrompt: (val) => set({ showInstallPrompt: val }),

      requestNotificationPermission: async () => {
        if (Capacitor.isNativePlatform()) {
          try {
            const status = await LocalNotifications.requestPermissions();
            const permission = status.display === "granted" ? "granted" : "denied";
            set({ notificationPermission: permission });
            return permission;
          } catch (e) {
            console.error("Error requesting native notifications permission:", e);
            return "denied";
          }
        }
        if (!("Notification" in window)) return "denied" as NotificationPermission;
        const permission = await Notification.requestPermission();
        set({ notificationPermission: permission });
        return permission;
      },

      registerPushNotifications: async () => {
        if (!Capacitor.isNativePlatform()) return;

        try {
          let permStatus = await PushNotifications.checkPermissions();
          if (permStatus.receive === "prompt") {
            permStatus = await PushNotifications.requestPermissions();
          }

          if (permStatus.receive !== "granted") {
            console.warn("User denied push notifications permission");
            return;
          }

          await PushNotifications.register();

          PushNotifications.addListener("registration", async (token) => {
            console.log("Push registration success, token: " + token.value);
            const jwtToken = localStorage.getItem("jwt_token");
            if (jwtToken) {
              const { apiRequest } = await import("../utils/api");
              await apiRequest("/caregivers/fcm-token", {
                method: "POST",
                body: JSON.stringify({ fcmToken: token.value }),
              }).catch((err) => console.error("Failed to upload FCM token to backend", err));
            }
          });

          PushNotifications.addListener("registrationError", (error) => {
            console.error("Error on push registration: " + JSON.stringify(error));
          });

          PushNotifications.addListener("pushNotificationReceived", (notification) => {
            console.log("Push received: " + JSON.stringify(notification));
          });

          PushNotifications.addListener("pushNotificationActionPerformed", (notification) => {
            console.log("Push action performed: " + JSON.stringify(notification));
          });
        } catch (e) {
          console.error("Error setting up push notifications:", e);
        }
      },

      addToast: (toast) => {
        const id = `toast-${++toastCounter}`;
        set((s) => ({ toastQueue: [...s.toastQueue, { ...toast, id }] }));
        setTimeout(() => get().removeToast(id), 4000);
      },

      removeToast: (id) =>
        set((s) => ({ toastQueue: s.toastQueue.filter((t) => t.id !== id) })),

      addCustomInsulinType: (name) =>
        set((s) => ({
          customInsulinTypes: s.customInsulinTypes.includes(name)
            ? s.customInsulinTypes
            : [...s.customInsulinTypes, name],
        })),

      removeCustomInsulinType: (name) =>
        set((s) => ({
          customInsulinTypes: s.customInsulinTypes.filter((t) => t !== name),
        })),

      login: async (caregiverIdOrName, password) => {
        try {
          const { apiRequest } = await import("../utils/api");
          // Intenta buscar localmente
          let name = caregiverIdOrName;
          const local = get().caregivers.find(c => c.id === caregiverIdOrName || c.name.toLowerCase() === caregiverIdOrName.toLowerCase());
          if (local) {
            name = local.name;
          }

          const response = await apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify({ name, password }),
          });

          if (response?.accessToken) {
            localStorage.setItem("jwt_token", response.accessToken);
            
            // Guardar o actualizar la info del cuidador en el estado local
            const caregiverData = response.caregiver;
            const currentList = [...get().caregivers];
            const idx = currentList.findIndex(c => c.id === caregiverData.id);
            const caregiverObj = {
              id: caregiverData.id,
              name: caregiverData.name,
              role: caregiverData.role,
              petId: caregiverData.petId,
              password
            };
            if (idx >= 0) {
              currentList[idx] = caregiverObj;
            } else {
              currentList.push(caregiverObj);
            }

            set({
              currentCaregiverId: caregiverData.id,
              caregivers: currentList,
              isAdminLoggedIn: false,
              hasToken: true
            });

            await get().fetchInitialData();
            await get().registerPushNotifications();
            return true;
          }
        } catch (error) {
          console.error("Backend login failed:", error);
        }

        // Fallback local
        const state = get();
        const caregiver = state.caregivers.find((c) => c.id === caregiverIdOrName || c.name.toLowerCase() === caregiverIdOrName.toLowerCase());
        if (caregiver && caregiver.password === password) {
          set({ currentCaregiverId: caregiver.id, isAdminLoggedIn: false, hasToken: false });
          return true;
        }
        return false;
      },

      logout: () => {
        localStorage.removeItem("jwt_token");
        localStorage.removeItem("app-storage");
        localStorage.removeItem("medication-storage");
        localStorage.removeItem("registry-storage");
        localStorage.removeItem("glucose-storage");
        localStorage.removeItem("active_pet_id");
        localStorage.removeItem("last_sync_time");
        window.location.href = "/";
      },

      currentCaregiver: () => {
        const state = get();
        if (state.isAdminLoggedIn) {
          return ADMIN_CAREGIVER;
        }
        if (!state.currentCaregiverId) return null;
        const caregiversList = Array.isArray(state.caregivers) ? state.caregivers : [];
        const found = caregiversList.find((c) => c.id === state.currentCaregiverId);
        if (found) return found;
        if (!cachedFallbackCaregiver || cachedFallbackCaregiver.id !== state.currentCaregiverId) {
          cachedFallbackCaregiver = { id: state.currentCaregiverId, name: "Cuidador", role: "family", password: "" };
        }
        return cachedFallbackCaregiver;
      },

      addCaregiver: async (caregiver) => {
        try {
          const { apiRequest } = await import("../utils/api");
          const response = await apiRequest("/caregivers", {
            method: "POST",
            body: JSON.stringify({
              name: caregiver.name,
              password: caregiver.password,
              role: caregiver.role,
              petId: caregiver.petId || undefined
            }),
          });
          if (response?.id) {
            set((s) => ({
              caregivers: [
                ...s.caregivers,
                {
                  id: response.id,
                  name: response.name,
                  role: response.role,
                  password: caregiver.password,
                  petId: response.petId
                },
              ],
            }));
            return;
          }
        } catch (error) {
          console.error("Failed to add caregiver on backend:", error);
          throw error;
        }
      },

      updateCaregiver: async (id, changes) => {
        try {
          const { apiRequest } = await import("../utils/api");
          const response = await apiRequest(`/caregivers/${id}`, {
            method: "PUT",
            body: JSON.stringify(changes),
          });
          if (response) {
            set((s) => ({
              caregivers: s.caregivers.map((c) => (c.id === id ? { ...c, ...changes } : c)),
            }));
          }
        } catch (error) {
          console.error("Failed to update caregiver:", error);
          throw error;
        }
      },

      removeCaregiver: async (id) => {
        try {
          const { apiRequest } = await import("../utils/api");
          await apiRequest(`/caregivers/${id}`, {
            method: "DELETE",
          });
          const state = get();
          if (state.currentCaregiverId === id) {
            set({ caregivers: state.caregivers.filter((c) => c.id !== id), currentCaregiverId: null });
          } else {
            set((s) => ({ caregivers: s.caregivers.filter((c) => c.id !== id) }));
          }
        } catch (error) {
          console.error("Failed to delete caregiver:", error);
          throw error;
        }
      },

      adminLogin: async (password) => {
        try {
          const { apiRequest } = await import("../utils/api");
          const response = await apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify({ name: "admin", password }),
          });

          if (response?.accessToken && response?.caregiver?.role === "admin") {
            localStorage.setItem("jwt_token", response.accessToken);
            set({ isAdminLoggedIn: true, currentCaregiverId: null, hasToken: true });
            await get().fetchInitialData();
            return true;
          }
        } catch (error) {
          console.error("Admin backend login failed:", error);
        }

        const state = get();
        if (state.adminPassword === password) {
          set({ isAdminLoggedIn: true, currentCaregiverId: null, hasToken: false });
          return true;
        }
        return false;
      },

      changeAdminPassword: (newPass) => set({ adminPassword: newPass }),

      registerNewSensor: async (model, serial) => {
        const pet = get().currentPet;
        if (!pet) {
          get().addToast({ message: "No hay una mascota activa seleccionada", type: "error" });
          return;
        }

        try {
          const { apiRequest } = await import("../utils/api");
          const now = new Date();
          const activatedAt = now.toISOString();
          const expiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
          
          const response = await apiRequest(`/pets/${pet.id}/sensors`, {
            method: "POST",
            body: JSON.stringify({
              sensorModel: model,
              serialNumber: serial,
              activatedAt,
              expiresAt
            })
          });

          if (response) {
            set({
              sensorStatus: {
                id: response.id,
                activatedAt: response.activatedAt,
                expiresAt: response.expiresAt,
                sensorModel: response.sensorModel,
                serialNumber: response.serialNumber,
                status: response.status,
                daysRemaining: 14
              }
            });
            get().addToast({ message: "Sensor registrado en el servidor", type: "success" });
          }
        } catch (error) {
          console.error("Failed to register sensor on backend:", error);
          get().addToast({ message: "Error al registrar el sensor en el servidor", type: "error" });
        }
      },

      addPet: async (pet) => {
        try {
          const { apiRequest } = await import("../utils/api");
          const response = await apiRequest("/pets", {
            method: "POST",
            body: JSON.stringify(pet),
          });
          if (response) {
            set((s) => ({
              pets: [...s.pets, response],
              currentPet: s.currentPet ? s.currentPet : response
            }));
            return response;
          }
        } catch (e) {
          console.error("Failed to add pet:", e);
          throw e;
        }
        return null;
      },

      updatePet: async (id, changes) => {
        try {
          const { apiRequest } = await import("../utils/api");
          const response = await apiRequest(`/pets/${id}`, {
            method: "PUT",
            body: JSON.stringify(changes),
          });
          if (response) {
            set((s) => {
              const updatedPets = s.pets.map((p) => (p.id === id ? { ...p, ...changes } : p));
              const updatedCurrent = s.currentPet?.id === id ? { ...s.currentPet, ...changes } : s.currentPet;
              return { pets: updatedPets, currentPet: updatedCurrent };
            });
          }
        } catch (error) {
          console.error("Failed to update pet:", error);
          throw error;
        }
      },

      loadPets: async () => {
        try {
          const { apiRequest } = await import("../utils/api");
          const list = await apiRequest("/pets");
          const verifiedList = Array.isArray(list) ? list : [];
          set({ pets: verifiedList });
          if (verifiedList.length > 0) {
            const petToSet = get().currentPet || verifiedList[0];
            get().setCurrentPet(petToSet);
          }
        } catch (e) {
          console.error("Failed to load pets:", e);
        }
      },

      loadCaregivers: async () => {
        try {
          const { apiRequest } = await import("../utils/api");
          const list = await apiRequest("/caregivers");
          set({ caregivers: Array.isArray(list) ? list : [] });
        } catch (e) {
          console.error("Failed to load caregivers:", e);
        }
      },

      setCurrentPet: (pet) => {
        set({ currentPet: pet });
        if (pet) {
          // Intentar recargar sensor para esta mascota
          import("../utils/api").then(({ apiRequest }) => {
            apiRequest(`/pets/${pet.id}/sensors/current`)
              .then(sensor => {
                set({
                  sensorStatus: {
                    id: sensor.id,
                    activatedAt: sensor.activatedAt,
                    expiresAt: sensor.expiresAt,
                    sensorModel: sensor.sensorModel,
                    serialNumber: sensor.serialNumber,
                    status: sensor.status,
                    daysRemaining: Math.max(0, Math.ceil((new Date(sensor.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                  }
                });
              })
              .catch(err => {
                console.warn("No active sensor for selected pet:", err);
                set({ sensorStatus: null });
              });
          });
        } else {
          set({ sensorStatus: null });
        }
      },

      fetchInitialData: async () => {
        if (Capacitor.isNativePlatform()) {
          try {
            const status = await LocalNotifications.checkPermissions();
            const permission = status.display === "granted" ? "granted" : 
                               status.display === "denied" ? "denied" : "default";
            if (get().notificationPermission !== permission) {
              set({ notificationPermission: permission });
            }
          } catch (e) {
            console.error("Error checking native notifications permission:", e);
          }
        }

        const token = localStorage.getItem("jwt_token");
        if (!token) return;

        await get().registerPushNotifications();

        const state = get();
        if (state.isAdminLoggedIn) {
          await get().loadCaregivers();
          await get().loadPets();
        } else if (state.currentCaregiverId) {
          try {
            const { apiRequest } = await import("../utils/api");
            // Cargar cuidadores para poblar el dropdown de login localmente
            await get().loadCaregivers();
            
            const caregiver = get().caregivers.find(c => c.id === state.currentCaregiverId);
            if (caregiver && caregiver.petId) {
              const pet = await apiRequest(`/pets/${caregiver.petId}`);
              set({ currentPet: pet });

              try {
                const sensor = await apiRequest(`/pets/${caregiver.petId}/sensors/current`);
                set({
                  sensorStatus: {
                    id: sensor.id,
                    activatedAt: sensor.activatedAt,
                    expiresAt: sensor.expiresAt,
                    sensorModel: sensor.sensorModel,
                    serialNumber: sensor.serialNumber,
                    status: sensor.status,
                    daysRemaining: Math.max(0, Math.ceil((new Date(sensor.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                  }
                });
              } catch (sensorErr) {
                console.warn("No active sensor found for pet:", sensorErr);
                set({ sensorStatus: null });
              }
            } else {
              // Si no tiene petId o no se encuentra
              // Intentar usar la primera mascota registrada como fallback si existe alguna
              const petsList = await apiRequest("/pets").catch(() => []);
              if (petsList.length > 0) {
                set({ currentPet: petsList[0] });
                try {
                  const sensor = await apiRequest(`/pets/${petsList[0].id}/sensors/current`);
                  set({
                    sensorStatus: {
                      id: sensor.id,
                      activatedAt: sensor.activatedAt,
                      expiresAt: sensor.expiresAt,
                      sensorModel: sensor.sensorModel,
                      serialNumber: sensor.serialNumber,
                      status: sensor.status,
                      daysRemaining: Math.max(0, Math.ceil((new Date(sensor.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                    }
                  });
                } catch {
                  set({ sensorStatus: null });
                }
              } else {
                set({ currentPet: null, sensorStatus: null });
              }
            }
          } catch (e) {
            console.error("Failed to load initial data for caregiver:", e);
          }
        }
      }
    }),
    {
      name: "app-storage",
      partialize: (state) => ({
        showEventsOnChart: state.showEventsOnChart,
        notificationPermission: state.notificationPermission,
        customInsulinTypes: state.customInsulinTypes,
        caregivers: state.caregivers,
        currentCaregiverId: state.currentCaregiverId,
        isAdminLoggedIn: state.isAdminLoggedIn,
        adminPassword: state.adminPassword,
        sensorStatus: state.sensorStatus,
        pets: state.pets,
        currentPet: state.currentPet,
        hasToken: state.hasToken,
        onboardingCompleted: state.onboardingCompleted
      }),
    }
  )
);
