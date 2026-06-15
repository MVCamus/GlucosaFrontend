import { useEffect } from "react";
import { useMedicationStore } from "../stores/medicationStore";
import { useAppStore } from "../stores/appStore";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { LocalNotificationSchema } from "@capacitor/local-notifications";

export function useMedNotifications() {
  const medications = useMedicationStore((s) => s.medications);
  const logs = useMedicationStore((s) => s.logs);
  const notificationPermission = useAppStore((s) => s.notificationPermission);
  const currentPet = useAppStore((s) => s.currentPet);

  useEffect(() => {
    const petName = currentPet?.name || "tu mascota";

    if (Capacitor.isNativePlatform()) {
      if (notificationPermission !== "granted") {
        LocalNotifications.getPending().then((pending) => {
          if (pending.notifications.length > 0) {
            LocalNotifications.cancel(pending);
          }
        });
        return;
      }

      const medicationsList = Array.isArray(medications) ? medications : [];
      const activeMeds = medicationsList.filter((m) => m && m.active && m.notifyMinutesBefore >= 0);

      const scheduleNativeNotifications = async () => {
        try {
          // Ensure the high-importance channel exists for medications
          await LocalNotifications.createChannel({
            id: "medication-reminders",
            name: "Recordatorios de Remedios",
            description: "Canal para recordatorios de medicamentos",
            importance: 5, // IMPORTANCE_HIGH (banner + sound + vibration)
            vibration: true,
            visibility: 1,
          });

          const pending = await LocalNotifications.getPending();
          if (pending && pending.notifications && pending.notifications.length > 0) {
            await LocalNotifications.cancel(pending);
          }

          const notificationsToSchedule: LocalNotificationSchema[] = [];
          let idCounter = 1;

          activeMeds.forEach((med) => {
            if (!med || !Array.isArray(med.scheduledTimes)) return;
            med.scheduledTimes.forEach((time) => {
              if (typeof time !== "string" || !time.includes(":")) return;
              const [hours, minutes] = time.split(":").map(Number);
              const now = new Date();
              const scheduled = new Date();
              scheduled.setHours(hours, minutes - med.notifyMinutesBefore, 0, 0);

              const todayStr = now.toISOString().split("T")[0];
              const isAlreadyGivenToday = logs.some(
                (l) => l.medicationId === med.id && l.scheduledTime === time && l.givenAt.startsWith(todayStr)
              );

              // If it already passed or was given today, start from tomorrow
              // But if it is within the last 60 seconds (e.g. current minute) and not given, trigger in 1 second for instant testing
              if (isAlreadyGivenToday) {
                scheduled.setDate(scheduled.getDate() + 1);
              } else if (scheduled < now) {
                const diffMs = now.getTime() - scheduled.getTime();
                if (diffMs < 60 * 1000) {
                  scheduled.setTime(now.getTime() + 1000);
                } else {
                  scheduled.setDate(scheduled.getDate() + 1);
                }
              }

              notificationsToSchedule.push({
                title: `Hora del remedio de ${petName} · ${med.name}`,
                body: `${med.name} — ${med.dose}`,
                id: idCounter++,
                channelId: "medication-reminders",
                schedule: {
                  at: scheduled,
                  repeats: true,
                  every: "day" as const,
                  allowWhileIdle: true,
                },
                extra: {
                  medId: med.id,
                  time: time,
                },
              });
            });
          });

          if (notificationsToSchedule.length > 0) {
            await LocalNotifications.schedule({
              notifications: notificationsToSchedule,
            });
            console.log("Scheduled native notifications:", notificationsToSchedule);
          }
        } catch (error) {
          console.error("Error scheduling native notifications:", error);
        }
      };

      scheduleNativeNotifications();
      return;
    }

    // Web Fallback
    if (notificationPermission !== "granted") return;
    if (!("Notification" in window)) return;

    const medicationsListWeb = Array.isArray(medications) ? medications : [];
    const activeMeds = medicationsListWeb.filter((m) => m && m.active && m.notifyMinutesBefore >= 0);
    const timers: ReturnType<typeof setTimeout>[] = [];

    activeMeds.forEach((med) => {
      if (!med || !Array.isArray(med.scheduledTimes)) return;
      med.scheduledTimes.forEach((time) => {
        if (typeof time !== "string" || !time.includes(":")) return;
        const [hours, minutes] = time.split(":").map(Number);
        const now = new Date();
        const scheduled = new Date();
        scheduled.setHours(hours, minutes - med.notifyMinutesBefore, 0, 0);

        const todayStr = now.toISOString().split("T")[0];
        const isAlreadyGivenToday = logs.some(
          (l) => l.medicationId === med.id && l.scheduledTime === time && l.givenAt.startsWith(todayStr)
        );

        if (isAlreadyGivenToday) return;

        if (scheduled > now) {
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
      });
    });

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [medications, logs, notificationPermission, currentPet]);
}