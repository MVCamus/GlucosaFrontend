import type { Medication, MedicationLog } from "../types/medication";

export const MOCK_MEDICATIONS: Medication[] = [
  {
    id: "m-001",
    name: "Enalapril",
    dose: "0.5 mg · 1 comprimido",
    frequency: "twice",
    scheduledTimes: ["08:00", "20:00"],
    notifyMinutesBefore: 30,
    active: true,
    createdAt: "2026-05-01T00:00:00Z",
    startDate: "2026-05-01",
    endDate: "2026-12-31",
  },
  {
    id: "m-002",
    name: "Vitamina E",
    dose: "200 UI · 1 cápsula",
    frequency: "once",
    scheduledTimes: ["08:00"],
    notifyMinutesBefore: 0,
    active: true,
    createdAt: "2026-05-01T00:00:00Z",
    startDate: "2026-05-01",
  },
  {
    id: "m-003",
    name: "Omega 3",
    dose: "1000 mg · 1 cápsula",
    frequency: "once",
    scheduledTimes: ["08:00"],
    notifyMinutesBefore: 0,
    active: true,
    createdAt: "2026-05-15T00:00:00Z",
    startDate: "2026-05-15",
  },
];

export const MOCK_MEDICATION_LOGS: MedicationLog[] = [
  {
    id: "ml-001",
    medicationId: "m-001",
    medicationName: "Enalapril",
    scheduledTime: "08:00",
    givenAt: "2026-06-03T08:12:00Z",
    caregiverId: "c-001",
    caregiverName: "Carlos",
  },
  {
    id: "ml-002",
    medicationId: "m-002",
    medicationName: "Vitamina E",
    scheduledTime: "08:00",
    givenAt: "2026-06-03T08:15:00Z",
    caregiverId: "c-001",
    caregiverName: "Carlos",
  },
  {
    id: "ml-003",
    medicationId: "m-003",
    medicationName: "Omega 3",
    scheduledTime: "08:00",
    givenAt: "2026-06-03T08:15:00Z",
    caregiverId: "c-001",
    caregiverName: "Carlos",
  },
];