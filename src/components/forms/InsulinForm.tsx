import { useState, useMemo, useRef } from "react";
import { Syringe, Clock, UserCheck, Droplets } from "lucide-react";
import { useRegistryStore } from "../../stores/registryStore";
import { useAppStore } from "../../stores/appStore";
import { getInsulinLabel } from "../../types/insulin";
import { formatChile } from "../../utils/date";

export default function InsulinForm() {
  const submitInsulin = useRegistryStore((s) => s.submitInsulin);
  const addToast = useAppStore((s) => s.addToast);
  const customTypes = useAppStore((s) => s.customInsulinTypes);
  const currentUser = useAppStore((s) => s.currentCaregiver());
  const glucoseRecords = useRegistryStore((s) => s.glucoseRecords);

  const allTypes = ["insulatard", ...customTypes];

  const latestGlucose = useMemo(() => {
    if (glucoseRecords.length === 0) return null;
    const sorted = [...glucoseRecords].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return sorted[0];
  }, [glucoseRecords]);

  const [units, setUnits] = useState(0.3);
  const [insulinType, setInsulinType] = useState("insulatard");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [useManualTime, setUseManualTime] = useState(false);
  const [manualTime, setManualTime] = useState(
    new Date().toTimeString().slice(0, 5)
  );
  const glucoseInputRef = useRef<HTMLInputElement>(null);
  const [recordGlucose, setRecordGlucose] = useState(false);
  const [glucoseValue, setGlucoseValue] = useState<number | null>(null);
  const [useAutoGlucose, setUseAutoGlucose] = useState(true);

  const getAdministeredAt = () => {
    if (!useManualTime) return new Date().toISOString();
    const today = new Date();
    const [h, m] = manualTime.split(":").map(Number);
    today.setHours(h, m, 0, 0);
    return today.toISOString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSubmitting(true);

    try {
      const administeredAt = getAdministeredAt();
      const manualValue = glucoseInputRef.current ? Number(glucoseInputRef.current.value) : 0;
      const gValue = recordGlucose
        ? (manualValue > 0 ? manualValue : (glucoseValue ?? latestGlucose?.value ?? 0))
        : 0;
      const glucoseNote = gValue > 0 ? `[Glucosa: ${gValue} mg/dL]` : '';
      const finalNotes = [notes, glucoseNote].filter(Boolean).join(' ') || undefined;

      const result = await submitInsulin({
        timestamp: administeredAt,
        units,
        insulinType,
        caregiverId: currentUser.id,
        caregiverName: currentUser.name,
        notes: finalNotes,
      });

      if (result?.success) {
        addToast({ message: "Dosis de insulina registrada", type: "success" });
        setUnits(0.3);
        setNotes("");
        setRecordGlucose(false);
      }
    } catch (err: any) {
      const msg = err?.message || "Error al registrar insulina";
      addToast({ message: msg, type: "error" });
    } finally {
      setSubmitting(false);
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
        {!useManualTime ? (
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5">
            <Clock size={14} className="text-gray-500" />
            <span className="text-sm text-gray-700">
              {formatChile(new Date(), "HH:mm")}
            </span>
            <span className="text-gray-400 text-xs">(automática)</span>
            <button
              type="button"
              onClick={() => setUseManualTime(true)}
              className="ml-auto text-xs text-orange-500 hover:text-orange-600 font-medium"
            >
              Cambiar
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={manualTime}
              onChange={(e) => setManualTime(e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button
              type="button"
              onClick={() => setUseManualTime(false)}
              className="text-xs text-gray-400 hover:text-gray-600 px-2"
            >
              Auto
            </button>
          </div>
        )}
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

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="recordGlucose"
          checked={recordGlucose}
          onChange={(e) => {
            setRecordGlucose(e.target.checked);
            if (e.target.checked && useAutoGlucose && latestGlucose) {
              setGlucoseValue(latestGlucose.value);
            }
          }}
          className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-400"
        />
        <label htmlFor="recordGlucose" className="text-sm text-gray-600 font-medium cursor-pointer flex items-center gap-1">
          <Droplets size={14} className="text-orange-500" /> Registrar glucosa también
        </label>
      </div>

      {recordGlucose && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => {
                setUseAutoGlucose(true);
                if (latestGlucose) setGlucoseValue(latestGlucose.value);
              }}
              className={`text-xs px-2 py-1 rounded-full transition-colors ${useAutoGlucose ? "bg-orange-500 text-white" : "bg-white text-gray-500 border border-gray-200"}`}
            >
              Auto
            </button>
            <button
              type="button"
              onClick={() => setUseAutoGlucose(false)}
              className={`text-xs px-2 py-1 rounded-full transition-colors ${!useAutoGlucose ? "bg-orange-500 text-white" : "bg-white text-gray-500 border border-gray-200"}`}
            >
              Manual
            </button>
            {useAutoGlucose && latestGlucose && (
              <span className="text-xs text-gray-400">
                Última: {latestGlucose.value} mg/dL ({formatChile(latestGlucose.timestamp, "HH:mm")})
              </span>
            )}
          </div>
          {useAutoGlucose ? (
            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2.5 text-sm text-gray-700 border border-gray-200">
              <Droplets size={14} className="text-orange-500" />
              <span className="font-bold">{latestGlucose?.value ?? "—"}</span>
              <span className="text-gray-400">mg/dL</span>
              <span className="text-gray-400 text-xs">(última lectura)</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setGlucoseValue(Math.max(10, (glucoseValue ?? 100) - 5))} className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200">-5</button>
              <input
                ref={glucoseInputRef}
                type="number"
                value={glucoseValue ?? ""}
                onChange={(e) => {
                  setUseAutoGlucose(false);
                  setGlucoseValue(Number(e.target.value) || null);
                }}
                placeholder="Ej: 250"
                min={10}
                max={600}
                className="flex-1 text-center text-lg font-bold py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <button type="button" onClick={() => setGlucoseValue(Math.min(600, (glucoseValue ?? 100) + 5))} className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200">+5</button>
            </div>
          )}
        </div>
      )}

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
        disabled={submitting}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {submitting ? "Registrando..." : "Registrar dosis"}
      </button>
    </form>
  );
}
