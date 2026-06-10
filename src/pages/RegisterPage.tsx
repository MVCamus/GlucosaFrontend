import { useState } from "react";
import InsulinForm from "../components/forms/InsulinForm";
import FoodForm from "../components/forms/FoodForm";
import CriticalAlertModal from "../components/forms/CriticalAlertModal";

type Tab = "insulin" | "food";

export default function RegisterPage() {
  const [activeTab, setActiveTab] = useState<Tab>("insulin");

  return (
    <div className="px-4 py-4">
      <CriticalAlertModal />
      <div className="flex gap-2 mb-6">
        <button
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
      {activeTab === "insulin" && <InsulinForm />}
      {activeTab === "food" && <FoodForm />}
    </div>
  );
}
