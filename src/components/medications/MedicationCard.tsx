import { Pencil, Trash2, Clock, Check, AlertCircle } from "lucide-react";
import { useMedicationStore } from "../../stores/medicationStore";
import { useAppStore } from "../../stores/appStore";
import MedCheckButton from "./MedCheckButton";
import type { MedicationWithSlots } from "../../utils/medSlots";
import { getMinutesLate, formatMinutesLate, getMedicationWarning } from "../../utils/medSlots";

interface Props {
  group: MedicationWithSlots;
  isAllGiven: boolean;
  onEdit: () => void;
}

const frequencyLabels: Record<string, string> = {
  once: "1 vez al día",
  twice: "2 veces al día",
  three_times: "3 veces al día",
  custom: "Personalizado",
};

export default function MedicationCard({ group, isAllGiven, onEdit }: Props) {
  const { medication, slots } = group;
  const markGiven = useMedicationStore((s) => s.markGiven);
  const unmarkGiven = useMedicationStore((s) => s.unmarkGiven);
  const deactivateMedication = useMedicationStore((s) => s.deactivateMedication);
  const logs = useMedicationStore((s) => s.logs);
  const addToast = useAppStore((s) => s.addToast);
  const currentUser = useAppStore((s) => s.currentCaregiver());

  const handleMark = async (scheduledTime: string) => {
    if (!currentUser) return;
    await markGiven(medication.id, scheduledTime, currentUser.id, currentUser.name);
    addToast({ message: `${medication.name} — ${scheduledTime} registrado`, type: "success" });
  };

  const handleUnmark = async (logId: string) => {
    await unmarkGiven(logId);
    addToast({ message: "Registro eliminado", type: "info" });
  };

  const handleDelete = async () => {
    if (confirm(`¿Eliminar ${medication.name}? Los registros históricos se conservarán.`)) {
      await deactivateMedication(medication.id);
      addToast({ message: `${medication.name} eliminado`, type: "info" });
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className={`bg-white border border-gray-100 rounded-xl p-4 shadow-sm transition-opacity ${isAllGiven ? "opacity-50" : ""}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            {medication.name}
            {medication.isStrict && (
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                Estricto
              </span>
            )}
          </h4>
          <p className="text-sm text-gray-500">{medication.dose}</p>
          <p className="text-xs text-gray-400">{frequencyLabels[medication.frequency]}</p>
          <p className="text-xs text-gray-400">
            {medication.startDate} → {medication.endDate || "indefinido"}
          </p>
        </div>
        <div className="flex gap-1">
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-orange-500 transition-colors">
            <Pencil size={16} />
          </button>
          <button onClick={handleDelete} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {slots.map((slot) => {
          const minutesLate = slot.status === "overdue" ? getMinutesLate(slot.scheduledTime, today) : 0;

          const givenTime = slot.log
            ? new Date(slot.log.givenAt).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })
            : null;

          const delayInfo = (() => {
            if (!slot.log) return null;
            const givenDate = new Date(slot.log.givenAt);
            const [sh, sm] = slot.scheduledTime.split(":").map(Number);
            const scheduledDate = new Date(givenDate);
            scheduledDate.setHours(sh, sm, 0, 0);
            const diffMin = Math.round((givenDate.getTime() - scheduledDate.getTime()) / 60000);
            if (diffMin <= 0) return null;
            if (diffMin < 60) return `(+${diffMin} min)`;
            const h = Math.floor(diffMin / 60);
            const m = diffMin % 60;
            return m > 0 ? `(+${h}h ${m})` : `(+${h}h)`;
          })();

          return (
            <div key={slot.scheduledTime} className="flex flex-col py-1.5 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                <MedCheckButton
                  status={slot.status}
                  onMark={() => handleMark(slot.scheduledTime)}
                  onUnmark={() => slot.log ? handleUnmark(slot.log.id) : void 0}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Clock size={13} className="text-gray-400" />
                    <span className={`font-bold ${slot.status === "overdue" ? "text-amber-600 text-base" : "text-gray-700 text-base"}`}>
                      {slot.shiftedTime || slot.scheduledTime}
                    </span>
                    {slot.shiftedTime && slot.shiftedTime !== slot.scheduledTime && (
                      <span className="text-xs text-purple-400 line-through">({slot.scheduledTime})</span>
                    )}
                    {slot.status === "given" && givenTime && (
                      <span className="text-sm text-gray-500">
                        → <span className="font-semibold">{givenTime}</span>
                        {delayInfo && <span className="text-amber-500 ml-1">{delayInfo}</span>}
                      </span>
                    )}
                    {slot.status === "overdue" && (
                      <span className="flex items-center gap-1 text-xs font-medium text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">
                        <AlertCircle size={12} />
                        Atrasado {formatMinutesLate(minutesLate)}
                      </span>
                    )}
                    {slot.status === "given" && !delayInfo && (
                      <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        <Check size={12} />
                        Dado
                      </span>
                    )}
                    {slot.status === "given" && delayInfo && (
                      <span className="flex items-center gap-1 text-xs font-medium text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">
                        <AlertCircle size={12} />
                        Tarde
                      </span>
                    )}
                  </div>
                  {slot.log && (
                    <p className="text-xs text-gray-400 ml-5">
                      por {slot.log.caregiverName}
                    </p>
                  )}
                  {slot.status === "overdue" && (
                    <p className="text-xs text-amber-400 ml-5">
                      Toca para marcar como dado (aunque esté atrasado)
                    </p>
                  )}
                </div>
              </div>
              
              {slot.status !== "given" && (() => {
                const warning = getMedicationWarning(medication, slot.scheduledTime, logs);
                if (!warning) return null;
                return (
                  <div className="mt-1.5 ml-9 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-start gap-1.5">
                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-amber-500" />
                    <span>{warning.message}</span>
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
