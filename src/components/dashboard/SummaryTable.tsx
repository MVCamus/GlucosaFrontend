import { useState, useMemo } from "react";
import { Droplets, UtensilsCrossed, Pill, Syringe } from "lucide-react";
import { useGlucoseStore } from "../../stores/glucoseStore";
import { useRegistryStore } from "../../stores/registryStore";
import { useMedicationStore } from "../../stores/medicationStore";
import { formatTime, getLocalDateStr } from "../../utils/date";
import { getInsulinLabel } from "../../types/insulin";
import { MOCK_INSULIN_RECORDS } from "../../mocks/insulin";
import { MOCK_FOOD_RECORDS } from "../../mocks/food";
import { MOCK_GLUCOSE_READINGS } from "../../mocks/glucose";

type FilterType = "all" | "glucose" | "insulin" | "food" | "meds";

const filters: { key: FilterType; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "glucose", label: "Glucosa" },
  { key: "insulin", label: "Insulina" },
  { key: "food", label: "Comida" },
  { key: "meds", label: "Remedios" },
];

const MOCK_DATA_DATE = "2026-06-03";

export default function SummaryTable() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const selectedDate = useGlucoseStore((s) => s.selectedDate);
  const allLogs = useMedicationStore((s) => s.logs);
  const rGlucose = useRegistryStore((s) => s.glucoseRecords);
  const rInsulin = useRegistryStore((s) => s.insulinRecords);
  const rFood = useRegistryStore((s) => s.foodRecords);
  const medLogs = allLogs.filter((l) => getLocalDateStr(l.givenAt) === selectedDate);

  const rows = useMemo(() => {
    const result: { time: string; timestamp: string; type: string; value: string; caregiver: string; icon: React.ReactNode; filterType: FilterType }[] = [];

    const userG = rGlucose.filter((r) => getLocalDateStr(r.timestamp) === selectedDate);
    const mockG = selectedDate === MOCK_DATA_DATE ? MOCK_GLUCOSE_READINGS : [];
    [...userG, ...mockG].forEach((r) => {
      result.push({
        time: formatTime(r.timestamp),
        timestamp: r.timestamp,
        type: "Glucosa",
        value: `${r.value} ${r.unit}`,
        caregiver: "Sensor",
        icon: <Droplets size={14} className="text-orange-500" />,
        filterType: "glucose",
      });
    });

    const userI = rInsulin.filter((r) => getLocalDateStr(r.timestamp) === selectedDate);
    const mockI = selectedDate === MOCK_DATA_DATE ? MOCK_INSULIN_RECORDS : [];
    [...userI, ...mockI].forEach((r) => {
      result.push({
        time: formatTime(r.timestamp),
        timestamp: r.timestamp,
        type: `Insulina (${getInsulinLabel(r.insulinType)})`,
        value: `${r.units} U`,
        caregiver: r.caregiverName,
        icon: <Syringe size={14} className="text-blue-500" />,
        filterType: "insulin",
      });
    });

    const userF = rFood.filter((r) => getLocalDateStr(r.timestamp) === selectedDate);
    const mockF = selectedDate === MOCK_DATA_DATE ? MOCK_FOOD_RECORDS : [];
    [...userF, ...mockF].forEach((r) => {
      result.push({
        time: formatTime(r.timestamp),
        timestamp: r.timestamp,
        type: `Comida (${r.foodType})`,
        value: r.quantity,
        caregiver: r.caregiverName,
        icon: <UtensilsCrossed size={14} className="text-green-500" />,
        filterType: "food",
      });
    });

    medLogs.forEach((l) => {
      result.push({
        time: l.scheduledTime,
        timestamp: `${selectedDate}T${l.scheduledTime}:00`,
        type: `Remedio (${l.medicationName})`,
        value: l.scheduledTime,
        caregiver: l.caregiverName,
        icon: <Pill size={14} className="text-purple-500" />,
        filterType: "meds",
      });
    });

    result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return result;
  }, [selectedDate, rGlucose, rInsulin, rFood, medLogs]);

  const filtered = activeFilter === "all" ? rows : rows.filter((r) => r.filterType === activeFilter);

  return (
    <div className="px-4">
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeFilter === f.key
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-gray-400 py-8">Sin registros para esta fecha</div>
      ) : (
        <>
          <div className="hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-gray-100">
                  <th className="pb-2">Hora</th>
                  <th className="pb-2">Tipo</th>
                  <th className="pb-2">Valor</th>
                  <th className="pb-2">Cuidador</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 flex items-center gap-2 text-base font-bold text-gray-800">{row.icon}{row.time}</td>
                    <td className="py-2">{row.type}</td>
                    <td className="py-2 font-medium">{row.value}</td>
                    <td className="py-2 text-gray-500">{row.caregiver}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden flex flex-col gap-2">
            {filtered.map((row, i) => (
              <div key={i} className="bg-white rounded-lg p-3 border border-gray-100 flex items-start gap-3">
                <div className="mt-0.5">{row.icon}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-800">{row.type}</span>
                    <span className="text-base font-bold text-orange-600">{row.time}</span>
                  </div>
                  <p className="text-sm text-gray-600">{row.value}</p>
                  <p className="text-xs text-gray-400">{row.caregiver}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}