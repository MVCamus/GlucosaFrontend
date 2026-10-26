import type { Medication } from "../types/medication";
import { getTodayStr } from "./date";

/**
 * Normaliza un medicamento que viene del backend.
 * `getTodayStr()` trabaja en America/Santiago, igual que el cron del backend.
 */
export function mapServerMedication(raw: any, petId: string): Medication {
  const notifyMinutesBefore = Number(raw?.notifyMinutesBefore);

  return {
    id: String(raw.id),
    petId: raw.petId || petId,
    name: raw.name,
    dose: raw.dose,
    frequency: raw.frequency,
    scheduledTimes: Array.isArray(raw.scheduledTimes)
      ? raw.scheduledTimes.filter((t: unknown) => typeof t === "string")
      : [],
    notifyMinutesBefore: Number.isFinite(notifyMinutesBefore)
      ? notifyMinutesBefore
      : 0,
    active: raw.active !== false,
    isStrict: raw.isStrict ?? false,
    createdAt: raw.createdAt || new Date().toISOString(),
    startDate: raw.startDate
      ? String(raw.startDate).slice(0, 10)
      : getTodayStr(),
    endDate: raw.endDate ? String(raw.endDate).slice(0, 10) : undefined,
    synced: true,
  };
}
