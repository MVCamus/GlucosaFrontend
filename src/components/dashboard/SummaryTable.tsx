import { useState, useMemo } from "react";
import { Droplets, UtensilsCrossed, Pill, Syringe, Trash2 } from "lucide-react";
import { useGlucoseStore } from "../../stores/glucoseStore";
import { useRegistryStore } from "../../stores/registryStore";
import { useMedicationStore } from "../../stores/medicationStore";
import { formatTime, getLocalDateStr } from "../../utils/date";
import { getInsulinLabel } from "../../types/insulin";

type FilterType = "all" | "glucose" | "insulin" | "food" | "meds";

const filters: { key: FilterType; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "glucose", label: "Glucosa" },
  { key: "insulin", label: "Insulina" },
  { key: "food", label: "Comida" },
  { key: "meds", label: "Remedios" },
];

interface TableRow {
  id: string;
  time: string;
  timestamp: string;
  type: string;
  value: string;
  caregiver: string;
  icon: React.ReactNode;
  filterType: FilterType;
  deletable: boolean;
}

export default function SummaryTable() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const selectedDate = useGlucoseStore((s) => s.selectedDate);
  const allLogs = useMedicationStore((s) => s.logs);
  const rGlucose = useRegistryStore((s) => s.glucoseRecords);
  const rInsulin = useRegistryStore((s) => s.insulinRecords);
  const rFood = useRegistryStore((s) => s.foodRecords);
  const deleteInsulin = useRegistryStore((s) => s.deleteInsulin);
  const deleteFood = useRegistryStore((s) => s.deleteFood);
  const medLogs = allLogs.filter((l) => getLocalDateStr(l.givenAt) === selectedDate);

  const rows = useMemo(() => {
    const result: TableRow[] = [];

    rGlucose
      .filter((r) => getLocalDateStr(r.timestamp) === selectedDate)
      .forEach((r) => {
        result.push({
          id: r.id,
          time: formatTime(r.timestamp),
          timestamp: r.timestamp,
          type: "Glucosa",
          value: `${r.value} ${r.unit || "mg/dL"}`,
          caregiver: r.source === "sensor" ? "Sensor Abbott" : "Manual",
          icon: <Droplets size={14} className="text-orange-500" />,
          filterType: "glucose",
          deletable: false,
        });
      });

    rInsulin
      .filter((r) => getLocalDateStr(r.timestamp) === selectedDate)
      .forEach((r) => {
        result.push({
          id: r.id,
          time: formatTime(r.timestamp),
          timestamp: r.timestamp,
          type: `Insulina (${getInsulinLabel(r.insulinType)})`,
          value: `${r.units} U`,
          caregiver: r.caregiverName || "—",
          icon: <Syringe size={14} className="text-blue-500" />,
          filterType: "insulin",
          deletable: true,
        });
      });

    rFood
      .filter((r) => getLocalDateStr(r.timestamp) === selectedDate)
      .forEach((r) => {
        result.push({
          id: r.id,
          time: formatTime(r.timestamp),
          timestamp: r.timestamp,
          type: `Comida (${r.foodType})`,
          value: r.quantity,
          caregiver: r.caregiverName || "—",
          icon: <UtensilsCrossed size={14} className="text-green-500" />,
          filterType: "food",
          deletable: true,
        });
      });

    medLogs.forEach((l) => {
      result.push({
        id: l.id,
        time: l.scheduledTime,
        timestamp: `${selectedDate}T${l.scheduledTime}:00`,
        type: `Remedio (${l.medicationName})`,
        value: l.scheduledTime,
        caregiver: l.caregiverName || "—",
        icon: <Pill size={14} className="text-purple-500" />,
        filterType: "meds",
        deletable: false,
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
        <div className="flex flex-col gap-2">
          {filtered.map((row, i) => (
            <div key={i} className="bg-white rounded-lg p-3 border border-gray-100 flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">{row.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-800 break-words">{row.type}</span>
                  <span className="text-base font-bold text-orange-600 flex-shrink-0 ml-2">{row.time}</span>
                </div>
                <p className="text-sm text-gray-600 mt-0.5">{row.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{row.caregiver}</p>
              </div>
              {row.deletable && (
                <button
                  onClick={() => {
                    if (confirm("¿Eliminar este registro?")) {
                      if (row.filterType === "insulin") deleteInsulin(row.id);
                      else if (row.filterType === "food") deleteFood(row.id);
                    }
                  }}
                  className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-0.5"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
