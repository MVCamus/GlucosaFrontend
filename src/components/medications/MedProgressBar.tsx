import { useMemo } from "react";
import { useMedicationStore } from "../../stores/medicationStore";
import { computeDailySlots } from "../../utils/medSlots";

export default function MedProgressBar() {
  const medications = useMedicationStore((s: any) => s.medications);
  const logs = useMedicationStore((s: any) => s.logs);

  const { given, total } = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const slots = computeDailySlots(medications, logs, today);
    return {
      given: slots.filter((s) => s.status === "given").length,
      total: slots.length,
    };
  }, [medications, logs]);

  if (total === 0) return null;

  const percentage = Math.round((given / total) * 100);

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 mx-4 mb-3 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-700">Progreso diario</span>
        <span className="text-sm font-bold text-orange-500">{given} de {total} dados</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3">
        <div
          className="bg-orange-500 h-3 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {given === total && total > 0 && (
        <p className="text-xs text-green-500 font-medium mt-1">✓ Todos los remedios dados hoy</p>
      )}
    </div>
  );
}
