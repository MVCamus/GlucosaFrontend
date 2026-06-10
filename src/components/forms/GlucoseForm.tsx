import { useState } from "react";
import { Droplets, Clock, UserCheck } from "lucide-react";
import { useRegistryStore } from "../../stores/registryStore";
import { useAppStore } from "../../stores/appStore";

export default function GlucoseForm() {
  const submitGlucose = useRegistryStore((s) => s.submitGlucose);
  const addToast = useAppStore((s) => s.addToast);
  const currentUser = useAppStore((s) => s.currentCaregiver());

  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(value);
    if (isNaN(val) || val < 20 || val > 500) {
      addToast({ message: "Ingresa un valor entre 20 y 500 mg/dL", type: "warning" });
      return;
    }
    if (!currentUser) return;
    submitGlucose({
      timestamp: new Date().toISOString(),
      value: val,
      unit: "mg/dL",
      trend: "stable",
      isHigh: val > 250,
      isLow: val < 60,
    });
    addToast({ message: `Glucosa: ${val} mg/dL registrada`, type: "success" });
    setValue("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-orange-100 rounded-full p-2">
          <Droplets size={20} className="text-orange-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-800">Registrar Glucosa</h3>
        <div className="ml-auto flex items-center gap-1 bg-gray-100 rounded-full px-2.5 py-1 text-xs text-gray-600">
          <UserCheck size={12} />
          {currentUser?.name || "—"}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-600 block mb-1">Hora</label>
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-700">
          <Clock size={14} />
          <span>{new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}</span>
          <span className="text-gray-400">(automática)</span>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-600 block mb-1">Valor (mg/dL)</label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ej: 120"
            min={20}
            max={500}
            className="flex-1 text-center text-2xl font-bold py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
            required
            autoFocus
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">Rango: 20 — 500 mg/dL</p>
      </div>

      {value && (
        <div className={`rounded-xl p-3 text-center text-sm font-semibold ${
          parseFloat(value) > 250 || parseFloat(value) < 60
            ? "bg-red-50 text-red-600"
            : parseFloat(value) > 180
            ? "bg-amber-50 text-amber-600"
            : "bg-green-50 text-green-600"
        }`}>
          {parseFloat(value) > 250 ? "⚠️ Alto"
            : parseFloat(value) < 60 ? "⚠️ Bajo"
            : parseFloat(value) > 180 ? "⚡ Elevado"
            : "✅ Normal"}
        </div>
      )}

      <button
        type="submit"
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        Registrar glucosa
      </button>
    </form>
  );
}
