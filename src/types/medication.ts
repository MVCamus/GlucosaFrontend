export interface Medication {
  id: string;
  name: string;
  dose: string;
  frequency: MedFrequency;
  scheduledTimes: string[];
  notifyMinutesBefore: number;
  active: boolean;
  isStrict?: boolean;
  createdAt: string;
  startDate: string;
  endDate?: string;
}

export type MedFrequency = "once" | "twice" | "three_times" | "custom";

export interface MedicationLog {
  id: string;
  medicationId: string;
  medicationName: string;
  scheduledTime: string;
  givenAt: string;
  caregiverId: string;
  caregiverName: string;
}

export interface MedDailySlot {
  medication: Medication;
  scheduledTime: string;
  shiftedTime?: string;
  status: MedSlotStatus;
  log: MedicationLog | null;
}

export type MedSlotStatus = "pending" | "given" | "overdue";