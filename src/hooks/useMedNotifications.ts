import { useEffect, useRef } from "react";
import { useMedicationStore } from "../stores/medicationStore";
import { useAppStore } from "../stores/appStore";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { LocalNotificationSchema } from "@capacitor/local-notifications";
import type { Medication } from "../types/medication";
import { getTodayStr, getLocalDateStr } from "../utils/date";

const MED_CHANNEL_ID = "medication-reminders";
// Si un tratamiento tiene fecha de término, se agendan recordatorios uno a uno.
// El límite evita llenar el sistema de alarmas; al abrir la app se renueva.
const MAX_FINITE_DAYS = 60;

function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getScheduledDate(
  dateStr: string,
  hours: number,
  minutes: number,
  notifyMinutesBefore: number
): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(
    year,
    month - 1,
    day,
    hours,
    minutes - notifyMinutesBefore,
    0,
    0
  );
}

function getNextOccurrence(
  startDate: string,
  hours: number,
  minutes: number,
  notifyMinutesBefore: number,
  now: Date
): Date {
  const at = getScheduledDate(
    startDate,
    hours,
    minutes,
    notifyMinutesBefore
  );
  if (at <= now) {
    at.setDate(at.getDate() + 1);
  }
  return at;
}

/** ID estable para que reprogramar no duplique la misma alarma. */
function getNotificationId(medicationId: string, scheduledTime: string): number {
  const input = `${medicationId}:${scheduledTime}`;
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 2_000_000_000) + 1;
}

function isMedicationSchedulable(med: Medication, today: string): boolean {
  if (!med || !med.active) return false;
  if (!Array.isArray(med.scheduledTimes) || med.scheduledTimes.length === 0) {
    return false;
  }
  if (med.endDate && med.endDate < today) return false;
  return true;
}

function getNotifyMinutesBefore(med: Medication): number {
  const value = Number(med.notifyMinutesBefore);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function useMedNotifications() {
  const medications = useMedicationStore((s) => s.medications);
  const logs = useMedicationStore((s) => s.logs);
  const notificationPermission = useAppStore((s) => s.notificationPermission);
  const currentPet = useAppStore((s) => s.currentPet);

  const scheduleGeneration = useRef(0);
  const scheduleQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    const petName = currentPet?.name || "tu mascota";
    const today = getTodayStr();
    const petId = currentPet?.id;
    const now = new Date();

    const medicationsList = Array.isArray(medications) ? medications : [];
    const petMedications = medicationsList.filter(
      (med) => !petId || !med.petId || med.petId === petId
    );
    const schedulableMeds = petMedications.filter((med) =>
      isMedicationSchedulable(med, today)
    );

    if (Capacitor.isNativePlatform()) {
      const generation = ++scheduleGeneration.current;

      const cancelMedicationNotifications = async () => {
        const pending = await LocalNotifications.getPending();
        const medicationNotifications = pending.notifications.filter(
          (n: any) => n.channelId === MED_CHANNEL_ID || !n.channelId
        );
        if (medicationNotifications.length > 0) {
          await LocalNotifications.cancel({
            notifications: medicationNotifications,
          });
        }
      };

      // Serializa cancelar/reprogramar para evitar que dos ejecuciones
      // del efecto dejen alarmas antiguas vivas.
      const enqueue = (task: () => Promise<void>) => {
        scheduleQueue.current = scheduleQueue.current
          .then(async () => {
            if (generation !== scheduleGeneration.current) return;
            await task();
          })
          .catch((error) => {
            console.error("Error scheduling native notifications:", error);
          });
      };

      if (notificationPermission !== "granted") {
        enqueue(cancelMedicationNotifications);
        return;
      }

      enqueue(async () => {
        await LocalNotifications.createChannel({
          id: MED_CHANNEL_ID,
          name: "Recordatorios de Remedios",
          description: "Canal para recordatorios de medicamentos",
          importance: 5, // IMPORTANCE_HIGH (banner + sound + vibration)
          vibration: true,
          visibility: 1,
        });

        // Siempre se reconstruye desde la lista canónica. Esto elimina
        // alarmas de remedios que ya no existen o que fueron desactivados.
        await cancelMedicationNotifications();

        if (generation !== scheduleGeneration.current) return;

        const notificationsToSchedule: LocalNotificationSchema[] = [];

        for (const med of schedulableMeds) {
          const notifyMinutesBefore = getNotifyMinutesBefore(med);

          for (const time of med.scheduledTimes) {
            if (typeof time !== "string" || !time.includes(":")) continue;

            const [hours, minutes] = time.split(":").map(Number);
            if (!Number.isFinite(hours) || !Number.isFinite(minutes)) continue;

            const isGivenToday = logs.some(
              (l) =>
                l.medicationId === med.id &&
                l.scheduledTime === time &&
                getLocalDateStr(l.givenAt) === today
            );

            const startDate =
              med.startDate && med.startDate > today
                ? med.startDate
                : today;

            if (med.endDate) {
              // Tratamiento con fecha de término: alarmas únicas por día.
              // Así no quedan repeticiones infinitas después de terminar.
              if (med.endDate < startDate) continue;

              let dateStr = startDate;
              let scheduledDays = 0;

              while (
                dateStr <= med.endDate &&
                scheduledDays < MAX_FINITE_DAYS
              ) {
                const at = getScheduledDate(
                  dateStr,
                  hours,
                  minutes,
                  notifyMinutesBefore
                );

                if (at > now && !(dateStr === today && isGivenToday)) {
                  notificationsToSchedule.push({
                    title: `Hora del remedio de ${petName} · ${med.name}`,
                    body: `${med.name} — ${med.dose}`,
                    id: getNotificationId(
                      `${med.id}|${dateStr}`,
                      time
                    ),
                    channelId: MED_CHANNEL_ID,
                    schedule: {
                      at,
                      allowWhileIdle: true,
                    },
                    extra: {
                      medId: med.id,
                      time,
                      date: dateStr,
                    },
                  });
                }

                dateStr = addDays(dateStr, 1);
                scheduledDays++;
              }
            } else {
              // Tratamiento indefinido: repetición diaria.
              const firstOccurrence = isGivenToday
                ? getNextOccurrence(
                    addDays(today, 1),
                    hours,
                    minutes,
                    notifyMinutesBefore,
                    now
                  )
                : getNextOccurrence(
                    startDate,
                    hours,
                    minutes,
                    notifyMinutesBefore,
                    now
                  );

              notificationsToSchedule.push({
                title: `Hora del remedio de ${petName} · ${med.name}`,
                body: `${med.name} — ${med.dose}`,
                id: getNotificationId(med.id, time),
                channelId: MED_CHANNEL_ID,
                schedule: {
                  at: firstOccurrence,
                  repeats: true,
                  every: "day" as const,
                  allowWhileIdle: true,
                },
                extra: {
                  medId: med.id,
                  time,
                },
              });
            }
          }
        }

        if (notificationsToSchedule.length > 0) {
          await LocalNotifications.schedule({
            notifications: notificationsToSchedule,
          });
        }
      });

      return;
    }

    // Web fallback: solo programa lo que queda del día actual.
    if (notificationPermission !== "granted") return;
    if (!("Notification" in window)) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const todayLogs = logs;

    for (const med of schedulableMeds) {
      const notifyMinutesBefore = getNotifyMinutesBefore(med);

      for (const time of med.scheduledTimes) {
        if (typeof time !== "string" || !time.includes(":")) continue;

        const [hours, minutes] = time.split(":").map(Number);
        if (!Number.isFinite(hours) || !Number.isFinite(minutes)) continue;

        const isGivenToday = todayLogs.some(
          (l) =>
            l.medicationId === med.id &&
            l.scheduledTime === time &&
            getLocalDateStr(l.givenAt) === today
        );
        if (isGivenToday) continue;

        const startDate =
          med.startDate && med.startDate > today ? med.startDate : today;
        if (startDate !== today) continue;

        const scheduled = getScheduledDate(
          today,
          hours,
          minutes,
          notifyMinutesBefore
        );
        if (scheduled <= now) continue;

        const delay = scheduled.getTime() - now.getTime();
        const timer = setTimeout(() => {
          new Notification(`Hora del remedio de ${petName} · ${med.name}`, {
            body: `${med.name} — ${med.dose}`,
            icon: "/pwa-192x192.png",
            tag: `med-${med.id}-${time}`,
          });
        }, delay);
        timers.push(timer);
      }
    }

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [medications, logs, notificationPermission, currentPet]);
}
