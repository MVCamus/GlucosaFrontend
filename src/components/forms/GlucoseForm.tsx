import { useState } from "react";
import { Droplets, Clock, UserCheck } from "lucide-react";
import { useRegistryStore } from "../../stores/registryStore";
import { useAppStore } from "../../stores/appStore";
import { getTodayStr, formatChile } from "../../utils/date";
import type { GlucoseTrend } from "../../types/glucose";

const TRENDS: { value: GlucoseTrend; label: string }[] = [
  { value: "stable", label: "Estable ➡️" },
  { value: "rising", label: "Subiendo ↗️" },
  { value: "rising_quickly", label: "Subiendo Rápido ⬆️" },
  { value: "falling", label: "Bajando ↘️" },
  { value: "falling_quickly", label: "Bajando Rápido ⬇️" },
];

export default function GlucoseForm() {
  const submitGlucose = useRegistryStore((s) => s.submitGlucose);
  const addToast = useAppStore((s) => s.addToast);
  const currentUser = useAppStore((s) => s.currentCaregiver());

  const [value, setValue] = useState<number>(100);
  const [trend, setTrend] = useState<GlucoseTrend>("stable");
  const [useCurrentTime, setUseCurrentTime] = useState(true);
  
  // Custom date/time states
  const [customDate, setCustomDate] = useState(getTodayStr());
  const [customTime, setCustomTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || value <= 0) return;
    setSubmitting(true);

    let timestamp: string;
    if (useCurrentTime) {
      timestamp = new Date().toISOString();
    } else {
      // Parse custom local date & time
      const localDateTime = new Date(`${customDate}T${customTime}:00`);
      if (isNaN(localDateTime.getTime())) {
        addToast({ message: "Fecha u hora inválida", type: "error" });
        setSubmitting(false);
        return;
      }
      timestamp = localDateTime.toISOString();
    }

    const lowLimit = useAppStore.getState().currentPet?.targetLow ?? 70;
    const highLimit = useAppStore.getState().currentPet?.targetHigh ?? 250;

    try {
      await submitGlucose({
        timestamp,
        value,
        unit: "mg/dL",
        trend,
        isHigh: value > highLimit,
        isLow: value < lowLimit,
        source: "manual",
      });

      addToast({ message: "Glucosa registrada manualmente", type: "success" });
      
      // Reset form states except date
      if (useCurrentTime) {
        const now = new Date();
        setCustomTime(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
      }
    } catch (err) {
      addToast({ message: "Error al registrar glucosa", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-orange-100 rounded-full p-2">
          <Droplets size={20} className="text-orange-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-800">Registrar Glucosa Manual</h3>
        <div className="ml-auto flex items-center gap-1 bg-gray-100 rounded-full px-2.5 py-1 text-xs text-gray-600">
          <UserCheck size={12} />
          {currentUser?.name || "—"}
        </div>
      </div>

      {/* Checkbox to choose current or custom time */}
      <div className="flex items-center gap-2 mb-2">
        <input
          type="checkbox"
          id="useCurrentTime"
          checked={useCurrentTime}
          onChange={(e) => setUseCurrentTime(e.target.checked)}
          className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-400"
        />
        <label htmlFor="useCurrentTime" className="text-sm text-gray-600 font-medium cursor-pointer">
          Usar fecha y hora actual
        </label>
      </div>

      {/* Date and Time Fields if custom time is selected */}
      {!useCurrentTime ? (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Fecha</label>
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Hora</label>
            <input
              type="time"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              required
            />
          </div>
        </div>
      ) : (
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">Hora</label>
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-700">
            <Clock size={14} />
            <span>{formatChile(new Date(), "dd/MM/yyyy HH:mm")}</span>
            <span className="text-gray-400">(automática)</span>
          </div>
        </div>
      )}

      {/* Glucose Value Input */}
      <div>
        <label className="text-sm font-medium text-gray-600 block mb-1">Valor de Glucosa (mg/dL)</label>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setValue(Math.max(10, value - 5))} className="w-10 h-10 rounded-lg bg-gray-100 text-gray-600 font-bold text-lg hover:bg-gray-200 transition-colors">-5</button>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            min={10}
            max={600}
            className="flex-1 text-center text-xl font-bold py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
            required
          />
          <button type="button" onClick={() => setValue(Math.min(600, value + 5))} className="w-10 h-10 rounded-lg bg-gray-100 text-gray-600 font-bold text-lg hover:bg-gray-200 transition-colors">+5</button>
        </div>
        <p className="text-xs text-gray-400 mt-1">Rango habitual: 70 — 250 mg/dL</p>
      </div>

      {/* Trend Selection */}
      <div>
        <label className="text-sm font-medium text-gray-600 block mb-1">Tendencia de Glucosa</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {TRENDS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTrend(t.value)}
              className={`py-2 px-1 rounded-lg text-xs font-medium transition-colors border ${
                trend === t.value
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors mt-4"
      >
        {submitting ? "Registrando..." : "Registrar Glucosa"}
      </button>
    </form>
  );
}
