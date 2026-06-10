import { useState } from "react";
import { UtensilsCrossed, Clock, UserCheck } from "lucide-react";
import { useRegistryStore } from "../../stores/registryStore";
import { useAppStore } from "../../stores/appStore";
import type { FoodType } from "../../types/food";

const FOOD_TYPES: { value: FoodType; label: string }[] = [
  { value: "pellet", label: "Pellet" },
  { value: "casera", label: "Comida casera" },
  { value: "mix", label: "Mix" },
];

export default function FoodForm() {
  const submitFood = useRegistryStore((s) => s.submitFood);
  const addToast = useAppStore((s) => s.addToast);
  const currentUser = useAppStore((s) => s.currentCaregiver());

  const [foodType, setFoodType] = useState<FoodType>("pellet");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity.trim() || !currentUser) return;
    await submitFood({
      timestamp: new Date().toISOString(),
      foodType,
      quantity: quantity.trim(),
      caregiverId: currentUser.id,
      caregiverName: currentUser.name,
      notes: notes || undefined,
    });
    addToast({ message: "Comida registrada", type: "success" });
    setQuantity("");
    setNotes("");
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
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-700">
          <Clock size={14} />
          <span>{new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}</span>
          <span className="text-gray-400">(automática)</span>
        </div>
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
        className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        Registrar comida
      </button>
    </form>
  );
}
