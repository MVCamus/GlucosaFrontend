import type { GlucoseReading } from "./glucose";
import type { InsulinRecord } from "./insulin";
import type { FoodRecord } from "./food";

export interface DailySummary {
  date: string;
  sensorId: string;
  glucoseReadings: GlucoseReading[];
  insulinRecords: InsulinRecord[];
  foodRecords: FoodRecord[];
  nadir: NadirResult | null;
}

export interface NadirResult {
  value: number;
  timestamp: string;
  referenceInjectionId: string;
  timeAfterInjectionMinutes: number;
}