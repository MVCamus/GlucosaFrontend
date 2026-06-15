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
    <div id="tour-header" className="flex items-center gap-1.5 px-3 py-2.5 bg-white border-b border-gray-100">
      {currentUser && !isAdmin && (
        <div className="flex items-center gap-1 bg-orange-50 rounded-full px-2 py-0.5 text-xs text-orange-700 font-medium shrink-0">
          <UserCheck size={12} className="shrink-0" />
          <span className="hide-xs truncate max-w-[80px]">{currentUser.name}</span>
        </div>
      )}
      {isAdmin && (
        <div className="flex items-center gap-1 bg-purple-50 rounded-full px-2 py-0.5 text-xs text-purple-700 font-medium shrink-0">
          <Shield size={12} className="shrink-0" />
          <span className="hide-xs">Admin</span>
        </div>
      )}
      {!hasToken && (
        <div className="flex items-center gap-1 bg-red-50 text-red-600 rounded-full px-2 py-0.5 text-xs font-semibold animate-pulse shrink-0" title="Sin conexión al servidor (Modo Local)">
          <WifiOff size={12} className="shrink-0" />
          <span className="hide-xs">Local</span>
        </div>
      )}
      <div className="flex-1" />
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => loadDay(e.target.value)}
          className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 max-w-[110px] xs:max-w-[125px] sm:max-w-none focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-700 font-medium"
        />
        <button
          onClick={toggleEvents}
          className={`p-1.5 rounded-lg transition-colors shrink-0 ${showEvents ? "bg-orange-100 text-orange-500" : "bg-gray-100 text-gray-400"}`}
          title={showEvents ? "Ocultar eventos" : "Mostrar eventos"}
        >
          {showEvents ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
        <button onClick={logout} className="p-1.5 rounded-lg bg-gray-100 text-gray-400 hover:text-red-500 transition-colors shrink-0" title="Cerrar sesión">
          <LogOut size={14} />
        </button>
        <button id="tour-settings-button" onClick={onSettingsClick} className="p-1.5 rounded-lg bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0">
          <Settings size={16} />
        </button>
      </div>
    </div>
  );
}
