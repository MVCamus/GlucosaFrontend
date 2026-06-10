import { useState } from "react";
import { Syringe, Clock, UserCheck } from "lucide-react";
import { useRegistryStore } from "../../stores/registryStore";
import { useAppStore } from "../../stores/appStore";
import { getInsulinLabel } from "../../types/insulin";

export default function InsulinForm() {
  const submitInsulin = useRegistryStore((s) => s.submitInsulin);
  const addToast = useAppStore((s) => s.addToast);
  const customTypes = useAppStore((s) => s.customInsulinTypes);
  const currentUser = useAppStore((s) => s.currentCaregiver());

  const allTypes = ["insulatard", ...customTypes];

  const [units, setUnits] = useState(0.3);
  const [insulinType, setInsulinType] = useState("insulatard");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const result = await submitInsulin({
      timestamp: new Date().toISOString(),
      units,
      insulinType,
      caregiverId: currentUser.id,
      caregiverName: currentUser.name,
      notes: notes || undefined,
    });

    if (result.success) {
      addToast({ message: "Dosis de insulina registrada", type: "success" });
      setUnits(0.3);
      setNotes("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-blue-100 rounded-full p-2">
          <Syringe size={20} className="text-blue-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-800">Registrar Insulina</h3>
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
        <label className="text-sm font-medium text-gray-600 block mb-1">Unidades (U)</label>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setUnits(Math.round(Math.max(0.1, units - 0.1) * 10) / 10)} className="w-10 h-10 rounded-lg bg-gray-100 text-gray-600 font-bold text-lg hover:bg-gray-200 transition-colors">-</button>
          <input
            type="number"
            value={units}
            onChange={(e) => setUnits(Number(e.target.value))}
            step={0.1}
            min={0.1}
            max={20}
            className="flex-1 text-center text-xl font-bold py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <button type="button" onClick={() => setUnits(Math.round(Math.min(20, units + 0.1) * 10) / 10)} className="w-10 h-10 rounded-lg bg-gray-100 text-gray-600 font-bold text-lg hover:bg-gray-200 transition-colors">+</button>
        </div>
        <p className="text-xs text-gray-400 mt-1">Rango: 0.1 — 20 U</p>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-600 block mb-1">Tipo de insulina</label>
        <p className="text-xs text-gray-400 mb-1.5">Puedes agregar más tipos desde Ajustes</p>
        <select
          value={insulinType}
          onChange={(e) => setInsulinType(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          {allTypes.map((t) => (
            <option key={t} value={t}>{getInsulinLabel(t)}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-600 block mb-1">Notas (opcional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ej: Dosis matutina habitual"
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
          rows={2}
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        Registrar dosis
      </button>
    </form>
  );
}
