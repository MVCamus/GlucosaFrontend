import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { useMedicationStore } from "../../stores/medicationStore";
import { computeDailySlots } from "../../utils/medSlots";

export default function MedOverdueAlert() {
  const medications = useMedicationStore((s: any) => s.medications);
  const logs = useMedicationStore((s: any) => s.logs);

  const overdueSlots = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const slots = computeDailySlots(medications, logs, today);
    return slots.filter((s) => s.status === "overdue");
  }, [medications, logs]);

  if (overdueSlots.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mx-4 mb-3 flex items-center gap-3">
      <div className="bg-amber-100 rounded-full p-2">
        <AlertTriangle size={18} className="text-amber-500" />
      </div>
      <div>
        <p className="text-sm font-semibold text-amber-800">
          {overdueSlots.length} remedio{overdueSlots.length > 1 ? "s" : ""} vencido{overdueSlots.length > 1 ? "s" : ""}
        </p>
        <p className="text-xs text-amber-600">
          {overdueSlots.map((s) => s.medication.name).join(", ")}
        </p>
      </div>
    </div>
  );
}
