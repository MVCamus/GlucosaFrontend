import { Settings, Eye, EyeOff, LogOut, UserCheck, Shield, WifiOff } from "lucide-react";
import { useGlucoseStore } from "../../stores/glucoseStore";
import { useAppStore } from "../../stores/appStore";

interface Props {
  onSettingsClick: () => void;
}

export default function DashboardHeader({ onSettingsClick }: Props) {
  const selectedDate = useGlucoseStore((s) => s.selectedDate);
  const loadDay = useGlucoseStore((s) => s.loadDay);
  const showEvents = useAppStore((s) => s.showEventsOnChart);
  const toggleEvents = useAppStore((s) => s.toggleEvents);
  const currentUser = useAppStore((s) => s.currentCaregiver());
  const logout = useAppStore((s) => s.logout);
  const isAdmin = useAppStore((s) => s.isAdminLoggedIn);
  const hasToken = useAppStore((s) => s.hasToken);

  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-gray-100">
      {currentUser && (
        <div className="flex items-center gap-1 bg-orange-50 rounded-full px-2.5 py-1 text-xs text-orange-700 font-medium">
          <UserCheck size={12} />
          {currentUser.name}
        </div>
      )}
      {isAdmin && (
        <div className="flex items-center gap-1 bg-purple-50 rounded-full px-2.5 py-1 text-xs text-purple-700 font-medium">
          <Shield size={12} />
          Admin
        </div>
      )}
      {!hasToken && (
        <div className="flex items-center gap-1 bg-red-50 text-red-600 rounded-full px-2.5 py-1 text-xs font-semibold animate-pulse" title="Sin conexión al servidor (Modo Local)">
          <WifiOff size={12} />
          Modo Local
        </div>
      )}
      <div className="flex-1" />
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => loadDay(e.target.value)}
        className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400"
      />
      <button
        onClick={toggleEvents}
        className={`p-2 rounded-lg transition-colors ${showEvents ? "bg-orange-100 text-orange-500" : "bg-gray-100 text-gray-400"}`}
        title={showEvents ? "Ocultar eventos" : "Mostrar eventos"}
      >
        {showEvents ? <Eye size={18} /> : <EyeOff size={18} />}
      </button>
      <button onClick={logout} className="p-2 rounded-lg bg-gray-100 text-gray-400 hover:text-red-500 transition-colors" title="Cerrar sesión">
        <LogOut size={16} />
      </button>
      <button onClick={onSettingsClick} className="p-2 rounded-lg bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
        <Settings size={18} />
      </button>
    </div>
  );
}
