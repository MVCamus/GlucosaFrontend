import { useState } from "react";
import InsulinForm from "../components/forms/InsulinForm";
import FoodForm from "../components/forms/FoodForm";
import GlucoseForm from "../components/forms/GlucoseForm";
import CriticalAlertModal from "../components/forms/CriticalAlertModal";

type Tab = "glucose" | "insulin" | "food";

export default function RegisterPage() {
  const [activeTab, setActiveTab] = useState<Tab>("glucose");

  return (
    <div id="tour-register-page" className="px-4 py-4">
      <CriticalAlertModal />
      <div id="tour-register-tabs" className="flex gap-2 mb-6">
        <button
          id="tour-tab-glucose"
          onClick={() => setActiveTab("glucose")}
          className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
            activeTab === "glucose"
              ? "bg-orange-500 text-white"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          🩸 Glucosa
        </button>
        <button
          id="tour-tab-insulin"
          onClick={() => setActiveTab("insulin")}
          className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
            activeTab === "insulin"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          💉 Insulina
        </button>
        <button
          id="tour-tab-food"
          onClick={() => setActiveTab("food")}
          className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
            activeTab === "food"
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          🍖 Comida
        </button>
      </div>
      <div id="tour-register-form-container">
        {activeTab === "glucose" && <GlucoseForm />}
        {activeTab === "insulin" && <InsulinForm />}
        {activeTab === "food" && <FoodForm />}
      </div>
    </div>
  );
}
