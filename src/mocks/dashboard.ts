import type { DailySummary } from "../types/dashboard";
import { MOCK_GLUCOSE_READINGS } from "./glucose";
import { MOCK_INSULIN_RECORDS } from "./insulin";
import { MOCK_FOOD_RECORDS } from "./food";

export const MOCK_DAILY_SUMMARY: DailySummary = {
  date: "2026-06-03",
  sensorId: "s-001",
  glucoseReadings: MOCK_GLUCOSE_READINGS,
  insulinRecords: MOCK_INSULIN_RECORDS,
  foodRecords: MOCK_FOOD_RECORDS,
  nadir: {
    value: 78,
    timestamp: "2026-06-03T13:00:00Z",
    referenceInjectionId: "i-001",
    timeAfterInjectionMinutes: 300,
  },
};