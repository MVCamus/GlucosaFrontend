import { Settings, LogOut, UserCheck, Shield, WifiOff, RefreshCw } from "lucide-react";
import { useGlucoseStore } from "../../stores/glucoseStore";
import { useAppStore } from "../../stores/appStore";
import { useSync } from "../../hooks/useSync";

interface Props {
  onSettingsClick: () => void;
}

export default function DashboardHeader({ onSettingsClick }: Props) {
  const selectedDate = useGlucoseStore((s) => s.selectedDate);
  const loadDay = useGlucoseStore((s) => s.loadDay);
  const currentUser = useAppStore((s) => s.currentCaregiver());
  const logout = useAppStore((s) => s.logout);
  const isAdmin = useAppStore((s) => s.isAdminLoggedIn);
  const hasToken = useAppStore((s) => s.hasToken);
  const { syncNow, syncing } = useSync();

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
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={syncNow}
          disabled={syncing || !hasToken}
          className={`p-2 rounded-xl transition-colors shrink-0 ${
            syncing
              ? "bg-orange-100 text-orange-500 animate-spin"
              : "bg-gray-100 text-gray-500 hover:text-orange-500 hover:bg-orange-50"
          }`}
          title="Sincronizar datos del sensor"
        >
          <RefreshCw size={16} />
        </button>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => loadDay(e.target.value)}
          className="text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 min-w-[130px] focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-gray-700 font-medium shadow-sm"
        />
        <button onClick={logout} className="p-2 rounded-xl bg-gray-100 text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0" title="Cerrar sesión">
          <LogOut size={16} />
        </button>
        <button id="tour-settings-button" onClick={onSettingsClick} className="p-2 rounded-xl bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors shrink-0">
          <Settings size={18} />
        </button>
      </div>
    </div>
  );
}
