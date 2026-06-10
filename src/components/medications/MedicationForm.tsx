import { useState } from "react";
import { X, Plus, Minus } from "lucide-react";
import { useMedicationStore } from "../../stores/medicationStore";
import { useAppStore } from "../../stores/appStore";
import type { MedFrequency } from "../../types/medication";

interface Props {
  onClose: () => void;
}

const FREQUENCY_OPTIONS: { value: MedFrequency; label: string; times: number }[] = [
  { value: "once", label: "1 vez al día", times: 1 },
  { value: "twice", label: "2 veces al día", times: 2 },
  { value: "three_times", label: "3 veces al día", times: 3 },
  { value: "custom", label: "Personalizado", times: 0 },
];

const DEFAULT_TIMES: Record<string, string[]> = {
  once: ["08:00"],
  twice: ["08:00", "20:00"],
  three_times: ["08:00", "14:00", "20:00"],
};

const NOTIFY_OPTIONS = [
  { value: 30, label: "30 min antes" },
  { value: 0, label: "En el horario exacto" },
  { value: -1, label: "Sin notificación" },
];

export default function MedicationForm({ onClose }: Props) {
  const editingMedication = useMedicationStore((s) => s.editingMedication);
  const addMedication = useMedicationStore((s) => s.addMedication);
  const updateMedication = useMedicationStore((s) => s.updateMedication);
  const addToast = useAppStore((s) => s.addToast);

  const [name, setName] = useState(editingMedication?.name || "");
  const [dose, setDose] = useState(editingMedication?.dose || "");
  const [frequency, setFrequency] = useState<MedFrequency>(editingMedication?.frequency || "once");
  const [scheduledTimes, setScheduledTimes] = useState<string[]>(
    editingMedication?.scheduledTimes || DEFAULT_TIMES.once
  );
  const [notifyMinutesBefore, setNotifyMinutesBefore] = useState<number>(
    editingMedication?.notifyMinutesBefore ?? 0
  );
  const [startDate, setStartDate] = useState<string>(
    editingMedication?.startDate || new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    editingMedication?.endDate || ""
  );
  const [isStrict, setIsStrict] = useState<boolean>(editingMedication?.isStrict || false);

  const handleFrequencyChange = (freq: MedFrequency) => {
    setFrequency(freq);
    if (freq !== "custom") {
      setScheduledTimes(DEFAULT_TIMES[freq] || ["08:00"]);
    }
  };

  const handleTimeChange = (index: number, value: string) => {
    const newTimes = [...scheduledTimes];
    newTimes[index] = value;
    setScheduledTimes(newTimes);
  };

  const addTimeSlot = () => setScheduledTimes([...scheduledTimes, "08:00"]);
  const removeTimeSlot = (index: number) => setScheduledTimes(scheduledTimes.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dose.trim() || scheduledTimes.length === 0) return;

    if (editingMedication) {
      await updateMedication(editingMedication.id, { name, dose, frequency, scheduledTimes, notifyMinutesBefore, isStrict, startDate, endDate: endDate || undefined });
      addToast({ message: "Remedio actualizado", type: "success" });
    } else {
      await addMedication({ name, dose, frequency, scheduledTimes, notifyMinutesBefore, active: true, isStrict, startDate, endDate: endDate || undefined });
      addToast({ message: "Remedio agregado", type: "success" });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[calc(100dvh-80px)] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">
            {editingMedication ? "Editar remedio" : "Agregar remedio"}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">Nombre del remedio</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Enalapril"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">Dosis / Presentación</label>
            <input
              type="text"
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              placeholder="Ej: 0.5 mg · 1 comprimido"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">Frecuencia</label>
            <div className="grid grid-cols-2 gap-2">
              {FREQUENCY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleFrequencyChange(opt.value)}
                  className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                    frequency === opt.value
                      ? "bg-purple-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">Horarios</label>
            <div className="space-y-2">
              {scheduledTimes.map((time, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => handleTimeChange(i, e.target.value)}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  {scheduledTimes.length > 1 && (
                    <button type="button" onClick={() => removeTimeSlot(i)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                      <Minus size={16} />
                    </button>
                  )}
                </div>
              ))}
              {frequency === "custom" && (
                <button type="button" onClick={addTimeSlot} className="flex items-center gap-1 text-sm text-purple-500 hover:text-purple-600">
                  <Plus size={14} /> Agregar horario
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">Notificación</label>
            <select
              value={notifyMinutesBefore}
              onChange={(e) => setNotifyMinutesBefore(Number(e.target.value))}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              {NOTIFY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">Período del tratamiento</label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <span className="text-xs text-gray-400 block mb-0.5">Inicio</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  required
                />
              </div>
              <span className="text-gray-300 mt-5">→</span>
              <div className="flex-1">
                <span className="text-xs text-gray-400 block mb-0.5">Fin (opcional)</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>
            {endDate && endDate < new Date().toISOString().split("T")[0] && (
              <p className="text-xs text-amber-500 mt-1">Este remedio ya finalizó. No aparecerá como pendiente.</p>
            )}
          </div>

          <div className="flex items-start justify-between p-3.5 bg-purple-50 border border-purple-100 rounded-xl">
            <div className="flex-1 pr-3">
              <label className="text-sm font-semibold text-purple-950 block">Intervalo Estricto</label>
              <span className="text-xs text-purple-700/80 block mt-0.5">
                Si se atrasa una dosis, el resto del día se ajustará según el atraso y advertirá si se administra muy pronto.
              </span>
            </div>
            <input
              type="checkbox"
              checked={isStrict}
              onChange={(e) => setIsStrict(e.target.checked)}
              className="w-5 h-5 mt-1 accent-purple-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="flex-1 py-3 rounded-xl bg-purple-500 text-white font-semibold hover:bg-purple-600 transition-colors">
              {editingMedication ? "Guardar cambios" : "Agregar remedio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}