export interface SensorStatus {
  id: string;
  activatedAt: string;
  expiresAt: string;
  sensorModel: string;
  serialNumber: string;
  daysRemaining: number;
  status: SensorHealth;
}

export type SensorHealth = "active" | "expiring" | "expired";