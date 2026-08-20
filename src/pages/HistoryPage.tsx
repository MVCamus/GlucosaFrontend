import SummaryTable from "../components/dashboard/SummaryTable";
import { useGlucoseStore } from "../stores/glucoseStore";
import { CalendarDays } from "lucide-react";
import { useRegistryStore } from "../stores/registryStore";
import { getInsulinLabel } from "../types/insulin";
import { formatDateTime } from "../utils/date";

export default function HistoryPage() {
  const selectedDate = useGlucoseStore((s) => s.selectedDate);
  const loadDay = useGlucoseStore((s) => s.loadDay);
  const alerts = useRegistryStore((s) => s.alerts);

  return (
    <div className="py-4">
      <div className="px-4 mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays size={20} className="text-orange-500" />
          <h2 className="text-lg font-bold text-gray-800">Historial</h2>
        </div>
        <div className="mt-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => loadDay(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
      </div>

      <SummaryTable />

      {alerts.length > 0 && (
        <div className="px-4 mt-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Alertas de doble dosis</h3>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div key={alert.id} className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                <p className="font-semibold text-red-700">⚠️ Alerta de doble dosis</p>
                <p className="text-red-600 text-xs">
                  {formatDateTime(alert.timestamp)} — {alert.lastDose.units}U {getInsulinLabel(alert.lastDose.insulinType)} por {alert.lastDose.caregiverName}
                </p>
                <p className="text-red-500 text-xs mt-1">
                  Resolución: {alert.resolution === "cancelled" ? "Cancelada" : "Forzada"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}