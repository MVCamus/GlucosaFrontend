import type { GlucoseReading } from "../types/glucose";

export const MOCK_GLUCOSE_READINGS: GlucoseReading[] = [
  {
    id: "g-001", timestamp: "2026-06-03T06:00:00Z", value: 145,
    unit: "mg/dL", trend: "stable", isHigh: false, isLow: false
  },
  {
    id: "g-002", timestamp: "2026-06-03T06:30:00Z", value: 152,
    unit: "mg/dL", trend: "rising", isHigh: false, isLow: false
  },
  {
    id: "g-003", timestamp: "2026-06-03T07:00:00Z", value: 168,
    unit: "mg/dL", trend: "rising", isHigh: false, isLow: false
  },
  {
    id: "g-004", timestamp: "2026-06-03T07:30:00Z", value: 175,
    unit: "mg/dL", trend: "stable", isHigh: false, isLow: false
  },
  {
    id: "g-005", timestamp: "2026-06-03T08:00:00Z", value: 190,
    unit: "mg/dL", trend: "rising_quickly", isHigh: false, isLow: false
  },
  {
    id: "g-006", timestamp: "2026-06-03T08:30:00Z", value: 210,
    unit: "mg/dL", trend: "rising", isHigh: false, isLow: false
  },
  {
    id: "g-007", timestamp: "2026-06-03T09:00:00Z", value: 245,
    unit: "mg/dL", trend: "rising", isHigh: false, isLow: false
  },
  {
    id: "g-008", timestamp: "2026-06-03T09:30:00Z", value: 260,
    unit: "mg/dL", trend: "rising", isHigh: true, isLow: false
  },
  {
    id: "g-009", timestamp: "2026-06-03T10:00:00Z", value: 240,
    unit: "mg/dL", trend: "stable", isHigh: false, isLow: false
  },
  {
    id: "g-010", timestamp: "2026-06-03T10:30:00Z", value: 195,
    unit: "mg/dL", trend: "falling", isHigh: false, isLow: false
  },
  {
    id: "g-011", timestamp: "2026-06-03T11:00:00Z", value: 150,
    unit: "mg/dL", trend: "falling", isHigh: false, isLow: false
  },
  {
    id: "g-012", timestamp: "2026-06-03T11:30:00Z", value: 118,
    unit: "mg/dL", trend: "falling_quickly", isHigh: false, isLow: false
  },
  {
    id: "g-013", timestamp: "2026-06-03T12:00:00Z", value: 95,
    unit: "mg/dL", trend: "falling", isHigh: false, isLow: false
  },
  {
    id: "g-014", timestamp: "2026-06-03T12:30:00Z", value: 82,
    unit: "mg/dL", trend: "falling", isHigh: false, isLow: false
  },
  {
    id: "g-015", timestamp: "2026-06-03T13:00:00Z", value: 78,
    unit: "mg/dL", trend: "stable", isHigh: false, isLow: false
  },
  {
    id: "g-016", timestamp: "2026-06-03T14:00:00Z", value: 85,
    unit: "mg/dL", trend: "rising", isHigh: false, isLow: false
  },
  {
    id: "g-017", timestamp: "2026-06-03T14:30:00Z", value: 100,
    unit: "mg/dL", trend: "rising", isHigh: false, isLow: false
  },
  {
    id: "g-018", timestamp: "2026-06-03T15:00:00Z", value: 120,
    unit: "mg/dL", trend: "rising", isHigh: false, isLow: false
  },
  {
    id: "g-019", timestamp: "2026-06-03T15:30:00Z", value: 135,
    unit: "mg/dL", trend: "stable", isHigh: false, isLow: false
  },
  {
    id: "g-020", timestamp: "2026-06-03T16:00:00Z", value: 140,
    unit: "mg/dL", trend: "stable", isHigh: false, isLow: false
  },
];