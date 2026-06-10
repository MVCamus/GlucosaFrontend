import type { GlucoseReading } from "../types/glucose";
import type { InsulinRecord } from "../types/insulin";
import type { NadirResult } from "../types/dashboard";

export function calculateNadir(
  readings: GlucoseReading[],
  insulinRecords: InsulinRecord[]
): NadirResult | null {
  if (insulinRecords.length === 0 || readings.length === 0) return null;

  const lastInjection = insulinRecords[insulinRecords.length - 1];
  const injectionTime = new Date(lastInjection.timestamp).getTime();
  const twoHoursAfter = injectionTime + 2 * 60 * 60 * 1000;
  const eightHoursAfter = injectionTime + 8 * 60 * 60 * 1000;

  const readingsInWindow = readings.filter((r) => {
    const t = new Date(r.timestamp).getTime();
    return t >= twoHoursAfter && t <= eightHoursAfter;
  });

  if (readingsInWindow.length === 0) return null;

  const nadirReading = readingsInWindow.reduce((min, r) =>
    r.value < min.value ? r : min
  );

  return {
    value: nadirReading.value,
    timestamp: nadirReading.timestamp,
    referenceInjectionId: lastInjection.id,
    timeAfterInjectionMinutes: Math.round(
      (new Date(nadirReading.timestamp).getTime() - injectionTime) / (1000 * 60)
    ),
  };
}