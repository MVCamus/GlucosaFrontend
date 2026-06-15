export interface GlucoseReading {
  id: string;
  timestamp: string;
  value: number;
  unit: "mg/dL";
  trend: GlucoseTrend;
  isHigh: boolean;
  isLow: boolean;
  source?: "sensor" | "manual";
}

export type GlucoseTrend =
  | "rising_quickly"
  | "rising"
  | "stable"
  | "falling"
  | "falling_quickly";