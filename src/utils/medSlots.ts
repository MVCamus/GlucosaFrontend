import type { Medication, MedicationLog, MedDailySlot } from "../types/medication";
import { getLocalDateStr } from "./date";

export interface MedicationWithSlots {
  medication: Medication;
  slots: MedDailySlot[];
}

export function getMinutesLate(scheduledTime: string, dateStr: string): number {
  const [sh, sm] = scheduledTime.split(":").map(Number);
  const now = new Date();
  const [year, month, day] = dateStr.split("-").map(Number);
  const scheduledDate = new Date(year, month - 1, day, sh, sm);
  const diffMin = Math.floor((now.getTime() - scheduledDate.getTime()) / 60000);
  return diffMin > 0 ? diffMin : 0;
}

export function formatMinutesLate(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}


// Helper to parse "HH:MM" to minutes of day
export function timeToMins(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

// Helper to format minutes of day back to "HH:MM"
export function minsToTime(mins: number): string {
  const normalized = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Get sorted scheduled times
export function getSortedTimes(scheduledTimes: string[]): string[] {
  return [...scheduledTimes].sort((a, b) => timeToMins(a) - timeToMins(b));
}

// Get interval in minutes between two scheduled times
export function getIntervalMins(fromTime: string, toTime: string): number {
  const fromMins = timeToMins(fromTime);
  const toMins = timeToMins(toTime);
  if (toMins >= fromMins) {
    return toMins - fromMins;
  } else {
    return toMins + 1440 - fromMins; // wraps to next day
  }
}

function getShiftedTimeForSlotInternal(
  med: Medication,
  sortedTimes: string[],
  slotTime: string,
  targetDateStr: string,
  logs: MedicationLog[],
  depth: number
): Date {
  const originalDate = new Date(`${targetDateStr}T${slotTime}:00`);
  if (depth > 6) {
    return originalDate;
  }

  // Check if there is a log for this slot on targetDateStr
  const logForThisSlot = logs.find(
    (l) =>
      l.medicationId === med.id &&
      l.scheduledTime === slotTime &&
      getLocalDateStr(l.givenAt) === targetDateStr
  );
  if (logForThisSlot) {
    return new Date(logForThisSlot.givenAt);
  }

  // Calculate previous slot
  const idx = sortedTimes.indexOf(slotTime);
  const prevIdx = (idx - 1 + sortedTimes.length) % sortedTimes.length;
  const prevSlotTime = sortedTimes[prevIdx];

  let prevSlotDateStr = targetDateStr;
  if (idx === 0) {
    const d = new Date(targetDateStr + "T12:00:00"); // Use noon to avoid timezone issues
    d.setDate(d.getDate() - 1);
    prevSlotDateStr = d.toISOString().split("T")[0];
  }

  if (new Date(prevSlotDateStr) < new Date(med.startDate)) {
    return originalDate;
  }

  const intervalMins = getIntervalMins(prevSlotTime, slotTime);
  const prevShiftedDate = getShiftedTimeForSlotInternal(
    med,
    sortedTimes,
    prevSlotTime,
    prevSlotDateStr,
    logs,
    depth + 1
  );

  return new Date(prevShiftedDate.getTime() + intervalMins * 60 * 1000);
}

/**
 * Calculates the shifted scheduled time for a given slot on a target date.
 */
export function getShiftedTimeForSlot(
  med: Medication,
  slotTime: string,
  targetDateStr: string,
  logs: MedicationLog[]
): Date {
  const sortedTimes = getSortedTimes(med.scheduledTimes);
  return getShiftedTimeForSlotInternal(med, sortedTimes, slotTime, targetDateStr, logs, 1);
}

/**
 * Checks if the dose for a strict medication slot is being administered too close to the last one.
 */
export function getMedicationWarning(
  med: Medication,
  slotTime: string,
  logs: MedicationLog[]
): { isTooClose: boolean; message: string; elapsedHours: number; expectedHours: number } | null {
  if (!med.isStrict) return null;

  const medLogs = logs
    .filter((l) => l.medicationId === med.id)
    .sort((a, b) => new Date(b.givenAt).getTime() - new Date(a.givenAt).getTime());

  if (medLogs.length === 0) return null;

  const lastLog = medLogs[0];
  const lastGivenTime = new Date(lastLog.givenAt).getTime();
  const nowTime = Date.now();

  const sortedTimes = getSortedTimes(med.scheduledTimes);
  const lastIdx = sortedTimes.indexOf(lastLog.scheduledTime);
  const currentIdx = sortedTimes.indexOf(slotTime);

  if (lastIdx === -1 || currentIdx === -1) return null;

  const intervalMins = getIntervalMins(lastLog.scheduledTime, slotTime);
  const elapsedMins = (nowTime - lastGivenTime) / (60 * 1000);

  // If elapsed time is less than 80% of the scheduled interval, warn the user
  const thresholdMins = intervalMins * 0.8;
  if (elapsedMins < thresholdMins) {
    const elapsedHours = Math.round((elapsedMins / 60) * 10) / 10;
    const expectedHours = Math.round((intervalMins / 60) * 10) / 10;
    return {
      isTooClose: true,
      message: `La dosis anterior se administró hace solo ${elapsedHours} hrs. El intervalo recomendado es de ${expectedHours} hrs.`,
      elapsedHours,
      expectedHours,
    };
  }

  return null;
}

export function computeDailySlots(
  medications: Medication[],
  logs: MedicationLog[],
  date: string
): MedDailySlot[] {
  const activeMeds = medications.filter((m) => {
    if (!m.active) return false;
    if (m.startDate && date < m.startDate) return false;
    if (m.endDate && date > m.endDate) return false;
    return true;
  });

  const getLogsForDate = (d: string) => logs.filter((l) => getLocalDateStr(l.givenAt) === d);
  const dayLogs = getLogsForDate(date);
  const now = new Date();
  const [todayYear, todayMonth, todayDay] = date.split("-").map(Number);
  
  return activeMeds.flatMap((med) => {
    const sortedTimes = getSortedTimes(med.scheduledTimes);
    return sortedTimes.map((scheduledTime) => {
      const log = dayLogs.find(
        (l) => l.medicationId === med.id && l.scheduledTime === scheduledTime
      );
      let status: "pending" | "given" | "overdue" = "pending";
      
      let slotDate: Date;
      let shiftedTime: string | undefined;

      if (med.isStrict) {
        slotDate = getShiftedTimeForSlot(med, scheduledTime, date, logs);
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
    });
  });
}

export function groupSlotsByMedication(slots: MedDailySlot[]): MedicationWithSlots[] {
  const map = new Map<string, MedicationWithSlots>();
  for (const slot of slots) {
    const medId = slot.medication.id;
    if (!map.has(medId)) {
      map.set(medId, {
        medication: slot.medication,
        slots: [],
      });
    }
    map.get(medId)!.slots.push(slot);
  }
  return Array.from(map.values());
}