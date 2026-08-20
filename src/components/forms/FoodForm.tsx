import { useState, useMemo, useRef } from "react";
import { UtensilsCrossed, Clock, UserCheck, Droplets } from "lucide-react";
import { useRegistryStore } from "../../stores/registryStore";
import { useAppStore } from "../../stores/appStore";
import type { FoodType } from "../../types/food";
import { formatChile } from "../../utils/date";

const FOOD_TYPES: { value: FoodType; label: string }[] = [
  { value: "pellet", label: "Pellet" },
  { value: "casera", label: "Comida casera" },
  { value: "mix", label: "Mix" },
];

export default function FoodForm() {
  const submitFood = useRegistryStore((s) => s.submitFood);
  const addToast = useAppStore((s) => s.addToast);
  const currentUser = useAppStore((s) => s.currentCaregiver());
  const glucoseRecords = useRegistryStore((s) => s.glucoseRecords);

  const latestGlucose = useMemo(() => {
    if (glucoseRecords.length === 0) return null;
    const sorted = [...glucoseRecords].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return sorted[0];
  }, [glucoseRecords]);

  const [foodType, setFoodType] = useState<FoodType>("pellet");
  const [quantity, setQuantity] = useState("");
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

  const getFedAt = () => {
    if (!useManualTime) return new Date().toISOString();
    const today = new Date();
    const [h, m] = manualTime.split(":").map(Number);
    today.setHours(h, m, 0, 0);
    return today.toISOString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity.trim() || !currentUser) return;
    setSubmitting(true);

    try {
      const fedAt = getFedAt();
      const manualValue = glucoseInputRef.current ? Number(glucoseInputRef.current.value) : 0;
      const gValue = recordGlucose
        ? (manualValue > 0 ? manualValue : (glucoseValue ?? latestGlucose?.value ?? 0))
        : 0;
      const glucoseNote = gValue > 0 ? `[Glucosa: ${gValue} mg/dL]` : '';
      const finalNotes = [notes, glucoseNote].filter(Boolean).join(' ') || undefined;

      await submitFood({
        timestamp: fedAt,
        foodType,
        quantity: quantity.trim(),
        caregiverId: currentUser.id,
        caregiverName: currentUser.name,
        notes: finalNotes,
      });

      addToast({ message: "Comida registrada", type: "success" });
      setQuantity("");
      setNotes("");
      setRecordGlucose(false);
    } catch (err) {
      addToast({ message: "Error al registrar comida", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-green-100 rounded-full p-2">
          <UtensilsCrossed size={20} className="text-green-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-800">Registrar Comida</h3>
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
        <label className="text-sm font-medium text-gray-600 block mb-1">Tipo de comida</label>
        <div className="grid grid-cols-2 gap-2">
          {FOOD_TYPES.map((ft) => (
            <button
              key={ft.value}
              type="button"
              onClick={() => setFoodType(ft.value)}
              className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                foodType === ft.value
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {ft.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-600 block mb-1">Cantidad</label>
        <input
          type="text"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Ej: 1 taza, 200 g, 1 lata"
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          required
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="recordGlucoseFood"
          checked={recordGlucose}
          onChange={(e) => {
            setRecordGlucose(e.target.checked);
            if (e.target.checked && useAutoGlucose && latestGlucose) {
              setGlucoseValue(latestGlucose.value);
            }
          }}
          className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-400"
        />
        <label htmlFor="recordGlucoseFood" className="text-sm text-gray-600 font-medium cursor-pointer flex items-center gap-1">
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
                Última: {latestGlucose.value} mg/dL
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
          placeholder="Ej: Comió todo, dejó la mitad..."
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
          rows={2}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {submitting ? "Registrando..." : "Registrar comida"}
      </button>
    </form>
  );
}
