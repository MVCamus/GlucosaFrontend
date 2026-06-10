import type { GlucoseReading } from "../types/glucose";
import type { InsulinRecord } from "../types/insulin";
import type { FoodRecord } from "../types/food";

export interface ChartDataPoint {
  time: string;
  glucose: number;
  timestamp: string;
}

export function formatReadingsForChart(readings: GlucoseReading[]): ChartDataPoint[] {
  return readings.map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }),
    glucose: r.value,
    timestamp: r.timestamp,
  }));
}

export function getInsulinMarkerPositions(insulinRecords: InsulinRecord[]) {
  return insulinRecords.map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }),
    timestamp: r.timestamp,
    units: r.units,
    caregiverName: r.caregiverName,
    type: "insulin" as const,
  }));
}

export function getFoodMarkerPositions(foodRecords: FoodRecord[]) {
  return foodRecords.map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }),
    timestamp: r.timestamp,
    foodType: r.foodType,
    quantity: r.quantity,
    caregiverName: r.caregiverName,
    type: "food" as const,
  }));
}

export function getGlucoseZoneColor(value: number): string {
  if (value < 60) return "#ef4444";
  if (value < 80) return "#f59e0b";
  if (value <= 180) return "#22c55e";
  if (value <= 250) return "#f59e0b";
  return "#ef4444";
}