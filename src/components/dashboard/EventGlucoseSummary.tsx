import { useMemo } from "react";
import { Syringe, UtensilsCrossed, Trash2 } from "lucide-react";
import { useGlucoseStore } from "../../stores/glucoseStore";
import { useRegistryStore } from "../../stores/registryStore";
import { formatTime, getLocalDateStr } from "../../utils/date";
import { getInsulinLabel } from "../../types/insulin";
import type { GlucoseReading } from "../../types/glucose";

interface EventRow {
  id: string;
  icon: React.ReactNode;
  eventTime: string;
  eventDetail: string;
  caregiver: string;
  lastGlucose: number | null;
  lastGlucoseTime: string | null;
  deletable: boolean;
  deleteFn: () => void;
}

function extractGlucoseFromNotes(notes?: string | null): number | null {
  if (!notes) return null;
  const match = notes.match(/\[Glucosa:\s*(\d+)\s*mg\/dL\]/);
  return match ? parseInt(match[1], 10) : null;
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
  const deleteInsulin = useRegistryStore((s) => s.deleteInsulin);
  const deleteFood = useRegistryStore((s) => s.deleteFood);

  const rows = useMemo(() => {
    const result: EventRow[] = [];
    const allReadings = uReadings
      .filter((r) => getLocalDateStr(r.timestamp) === selectedDate)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const insulinEvts = uInsulin.filter((r) => getLocalDateStr(r.timestamp) === selectedDate);
    const foodEvts = uFood.filter((r) => getLocalDateStr(r.timestamp) === selectedDate);

    insulinEvts.forEach((e) => {
      const manualGlucose = extractGlucoseFromNotes(e.notes);
      const last = manualGlucose !== null
        ? { value: manualGlucose, time: formatTime(e.timestamp) }
        : getLastReadingBefore(e.timestamp, allReadings);
      result.push({
        id: e.id,
        icon: <Syringe size={14} className="text-blue-500" />,
        eventTime: formatTime(e.timestamp),
        eventDetail: `${e.units}U ${getInsulinLabel(e.insulinType)}`,
        caregiver: e.caregiverName || "—",
        lastGlucose: last?.value ?? null,
        lastGlucoseTime: last?.time ?? null,
        deletable: true,
        deleteFn: () => { if (confirm("¿Eliminar esta dosis de insulina?")) deleteInsulin(e.id); },
      });
    });

    foodEvts.forEach((e) => {
      const manualGlucose = extractGlucoseFromNotes(e.notes);
      const last = manualGlucose !== null
        ? { value: manualGlucose, time: formatTime(e.timestamp) }
        : getLastReadingBefore(e.timestamp, allReadings);
      result.push({
        id: e.id,
        icon: <UtensilsCrossed size={14} className="text-green-500" />,
        eventTime: formatTime(e.timestamp),
        eventDetail: `${e.foodType} — ${e.quantity}`,
        caregiver: e.caregiverName || "—",
        lastGlucose: last?.value ?? null,
        lastGlucoseTime: last?.time ?? null,
        deletable: true,
        deleteFn: () => { if (confirm("¿Eliminar esta comida?")) deleteFood(e.id); },
      });
    });

    result.sort((a, b) => a.eventTime.localeCompare(b.eventTime));
    return result;
  }, [selectedDate, uReadings, uInsulin, uFood]);

  if (rows.length === 0) {
    return (
      <div id="tour-event-summary" className="bg-white border border-gray-100 rounded-xl p-4 mx-4 mb-3 shadow-sm text-center py-6 text-gray-400">
        <h3 className="text-sm font-semibold text-gray-500 mb-1">Eventos del día</h3>
        <p className="text-xs text-gray-400">Aún no hay comidas ni dosis de insulina registradas hoy.</p>
      </div>
    );
  }

  return (
    <div id="tour-event-summary" className="bg-white border border-gray-100 rounded-xl p-4 mx-4 mb-3 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-600 mb-3">Glucosa antes de cada evento</h3>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
            <div className="flex-shrink-0">{r.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <span className="font-semibold text-gray-700">{r.eventTime}</span>
                <span className="text-gray-500 break-words">{r.eventDetail}</span>
              </div>
              <p className="text-xs text-gray-400">{r.caregiver}</p>
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
                <span className="text-xs text-gray-400">Sin lectura</span>
              )}
            </div>
            {r.deletable && (
              <button
                onClick={r.deleteFn}
                className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
