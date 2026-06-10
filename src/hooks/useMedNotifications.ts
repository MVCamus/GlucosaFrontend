import { useEffect } from "react";
import { useMedicationStore } from "../stores/medicationStore";
import { useAppStore } from "../stores/appStore";

export function useMedNotifications() {
  const medications = useMedicationStore((s) => s.medications);
  const notificationPermission = useAppStore((s) => s.notificationPermission);

  useEffect(() => {
    if (notificationPermission !== "granted") return;
    if (!("Notification" in window)) return;

    const activeMeds = medications.filter((m) => m.active && m.notifyMinutesBefore >= 0);

    const timers: ReturnType<typeof setTimeout>[] = [];

    activeMeds.forEach((med) => {
      med.scheduledTimes.forEach((time) => {
        const [hours, minutes] = time.split(":").map(Number);
        const now = new Date();
        const scheduled = new Date();
        scheduled.setHours(hours, minutes - med.notifyMinutesBefore, 0, 0);

        if (scheduled > now) {
          const delay = scheduled.getTime() - now.getTime();
          const timer = setTimeout(() => {
            new Notification(`Hora del remedio de Toby · ${med.name}`, {
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
  }, [medications, notificationPermission]);
}