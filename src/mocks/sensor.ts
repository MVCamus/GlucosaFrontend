import type { SensorStatus } from "../types/sensor";

export const MOCK_SENSOR_STATUS: SensorStatus = {
  id: "s-001",
  activatedAt: "2026-05-28T10:00:00Z",
  expiresAt: "2026-06-11T10:00:00Z",
  sensorModel: "FreeStyle Libre 2 Plus",
  serialNumber: "SN-AB-12345",
  daysRemaining: 8,
  status: "active",
};