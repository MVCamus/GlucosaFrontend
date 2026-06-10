import { useState } from "react";
import { Plus } from "lucide-react";
import { useMedicationStore } from "../stores/medicationStore";
import MedProgressBar from "../components/medications/MedProgressBar";
import MedOverdueAlert from "../components/medications/MedOverdueAlert";
import MedicationCard from "../components/medications/MedicationCard";
import MedicationForm from "../components/medications/MedicationForm";
import { computeDailySlots, groupSlotsByMedication, type MedicationWithSlots } from "../utils/medSlots";

export default function MedicationsPage() {
  const [showForm, setShowForm] = useState(false);
  const medications = useMedicationStore((s: any) => s.medications);
  const logs = useMedicationStore((s: any) => s.logs);
  const openForm = useMedicationStore((s: any) => s.openForm);

  const today = new Date().toISOString().split("T")[0];
  const slots = computeDailySlots(medications, logs, today);
  const grouped = groupSlotsByMedication(slots);

  const pendingGroups = grouped.filter((g: MedicationWithSlots) => g.slots.some((s: any) => s.status !== "given"));
  const givenGroups = grouped.filter((g: MedicationWithSlots) => g.slots.every((s: any) => s.status === "given"));

  return (
    <div className="px-4 py-4">
      <MedProgressBar />
      <MedOverdueAlert />

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">Pendientes</h2>
        <button
          onClick={() => { openForm(); setShowForm(true); }}
          className="flex items-center gap-1 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus size={16} /> Agregar
        </button>
      </div>

      {pendingGroups.length === 0 ? (
        <div className="text-center text-gray-400 py-8">No hay remedios pendientes</div>
      ) : (
        <div className="space-y-3">
          {pendingGroups.map((group: MedicationWithSlots) => (
            <MedicationCard
              key={group.medication.id}
              group={group}
              isAllGiven={false}
              onEdit={() => { openForm(group.medication); setShowForm(true); }}
            />
          ))}
        </div>
      )}

      {givenGroups.length > 0 && (
        <>
          <h2 className="text-lg font-bold text-gray-800 mt-6 mb-4">Dados hoy</h2>
          <div className="space-y-3">
            {givenGroups.map((group: MedicationWithSlots) => (
              <MedicationCard
                key={group.medication.id}
                group={group}
                isAllGiven={true}
                onEdit={() => { openForm(group.medication); setShowForm(true); }}
              />
            ))}
          </div>
        </>
      )}

      {showForm && <MedicationForm onClose={() => { setShowForm(false); useMedicationStore.getState().closeForm(); }} />}
    </div>
  );
}
