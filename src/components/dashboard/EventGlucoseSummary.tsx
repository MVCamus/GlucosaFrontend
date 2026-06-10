import { useMemo } from "react";
import { Syringe, UtensilsCrossed } from "lucide-react";
import { useGlucoseStore } from "../../stores/glucoseStore";
import { useRegistryStore } from "../../stores/registryStore";
import { formatTime } from "../../utils/date";
import { getInsulinLabel } from "../../types/insulin";
import { MOCK_INSULIN_RECORDS } from "../../mocks/insulin";
import { MOCK_FOOD_RECORDS } from "../../mocks/food";
import { MOCK_GLUCOSE_READINGS } from "../../mocks/glucose";
import type { GlucoseReading } from "../../types/glucose";

const MOCK_DATA_DATE = "2026-06-03";

interface EventRow {
  icon: React.ReactNode;
  eventTime: string;
  eventDetail: string;
  lastGlucose: number | null;
  lastGlucoseTime: string | null;
}

function getLastReadingBefore(
  eventTimestamp: string,
  readings: GlucoseReading[]
): { value: number; time: string } | null {
  const eventMs = new Date(eventTimestamp).getTime();
  const before = readings
    .filter((r) => new Date(r.timestamp).getTime() < eventMs)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  if (before.length === 0) return null;
  return { value: before[0].value, time: formatTime(before[0].timestamp) };
}

export default function EventGlucoseSummary() {
  const selectedDate = useGlucoseStore((s) => s.selectedDate);
  const uReadings = useRegistryStore((s) => s.glucoseRecords);
  const uInsulin = useRegistryStore((s) => s.insulinRecords);
  const uFood = useRegistryStore((s) => s.foodRecords);

  const rows = useMemo(() => {
    const result: EventRow[] = [];
    const allReadings = [
      ...uReadings.filter((r) => r.timestamp.startsWith(selectedDate)),
      ...(selectedDate === MOCK_DATA_DATE ? MOCK_GLUCOSE_READINGS : []),
    ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const insulinEvts = [
      ...uInsulin.filter((r) => r.timestamp.startsWith(selectedDate)),
      ...(selectedDate === MOCK_DATA_DATE ? MOCK_INSULIN_RECORDS : []),
    ];
    const foodEvts = [
      ...uFood.filter((r) => r.timestamp.startsWith(selectedDate)),
      ...(selectedDate === MOCK_DATA_DATE ? MOCK_FOOD_RECORDS : []),
    ];

    insulinEvts.forEach((e) => {
      const last = getLastReadingBefore(e.timestamp, allReadings);
      result.push({
        icon: <Syringe size={14} className="text-blue-500" />,
        eventTime: formatTime(e.timestamp),
        eventDetail: `${e.units}U ${getInsulinLabel(e.insulinType)} — ${e.caregiverName}`,
        lastGlucose: last?.value ?? null,
        lastGlucoseTime: last?.time ?? null,
      });
    });

    foodEvts.forEach((e) => {
      const last = getLastReadingBefore(e.timestamp, allReadings);
      result.push({
        icon: <UtensilsCrossed size={14} className="text-green-500" />,
        eventTime: formatTime(e.timestamp),
        eventDetail: `${e.foodType} — ${e.quantity} — ${e.caregiverName}`,
        lastGlucose: last?.value ?? null,
        lastGlucoseTime: last?.time ?? null,
      });
    });

    result.sort((a, b) => a.eventTime.localeCompare(b.eventTime));
    return result;
  }, [selectedDate, uReadings, uInsulin, uFood]);

  if (rows.length === 0) return null;

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 mx-4 mb-3 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-600 mb-3">Glucosa antes de cada evento</h3>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
            <div className="flex-shrink-0">{r.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-gray-700">{r.eventTime}</span>
                <span className="text-gray-500 truncate">{r.eventDetail}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              {r.lastGlucose !== null ? (
                <>
                  <span className={`text-sm font-bold ${r.lastGlucose < 60 || r.lastGlucose > 250 ? "text-red-500" : r.lastGlucose > 180 ? "text-amber-500" : "text-green-600"}`}>
                    {r.lastGlucose}
                  </span>
                  <span className="text-xs text-gray-400 ml-1">mg/dL</span>
                  {r.lastGlucoseTime && (
                    <div className="text-[10px] text-gray-400">{r.lastGlucoseTime}</div>
                  )}
                </>
              ) : (
                <span className="text-xs text-gray-400">Sin lectura previa</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
