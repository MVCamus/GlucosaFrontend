import type { InsulinRecord } from "../types/insulin";

export const MOCK_INSULIN_RECORDS: InsulinRecord[] = [
  {
    id: "i-001",
    timestamp: "2026-06-03T08:00:00Z",
    units: 5,
    insulinType: "insulatard",
    caregiverId: "c-001",
    caregiverName: "Carlos",
    notes: "Dosis matutina habitual"
  },
];