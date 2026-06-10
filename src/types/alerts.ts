import type { InsulinRecord } from "./insulin";

export interface CriticalAlert {
  id: string;
  type: "double_dose";
  timestamp: string;
  lastDose: InsulinRecord;
  attemptedDose: Omit<InsulinRecord, "id">;
  resolved: boolean;
  resolution?: "cancelled" | "forced";
}