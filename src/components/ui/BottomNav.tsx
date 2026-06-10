import { useLocation, useNavigate } from "react-router-dom";
import { ChartLine, Plus, Pill, CalendarDays, FileBarChart } from "lucide-react";

const tabs = [
  { path: "/", label: "Inicio", Icon: ChartLine },
  { path: "/registrar", label: "Registrar", Icon: Plus },
  { path: "/remedios", label: "Remedios", Icon: Pill },
  { path: "/historial", label: "Historial", Icon: CalendarDays },
  { path: "/reportes", label: "Reportes", Icon: FileBarChart },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="max-w-lg md:max-w-xl lg:max-w-2xl mx-auto bg-white/95 backdrop-blur-sm border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-2xl">
        <div className="flex justify-around items-center h-[60px] px-4 md:px-6">
          {tabs.map(({ path, label, Icon }) => {
            const active = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ${
                  active ? "text-orange-500" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <div
                  className={`flex items-center justify-center rounded-xl transition-all duration-200 ${
                    active ? "bg-orange-50 p-1.5" : "p-1.5"
                  }`}
                >
                  <Icon
                    size={active ? 22 : 20}
                    strokeWidth={active ? 2.5 : 1.5}
                  />
                </div>
                <span
                  className={`text-[10px] leading-tight mt-0.5 transition-all duration-200 ${
                    active ? "font-semibold opacity-100" : "opacity-0 h-0 overflow-hidden"
                  }`}
                >
                  {label}
                </span>
                {active && (
                  <div className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-orange-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
