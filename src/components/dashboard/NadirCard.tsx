import { TrendingDown } from "lucide-react";
import { useGlucoseStore } from "../../stores/glucoseStore";
import { formatTime } from "../../utils/date";

export default function NadirCard() {
  const dailySummary = useGlucoseStore((s) => s.dailySummary);

  if (!dailySummary?.nadir) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl p-4 mx-4 mb-3 shadow-sm">
        <div className="flex items-center gap-2 text-gray-400">
          <TrendingDown size={18} />
          <span className="text-sm">Esperando datos para calcular el nadir</span>
        </div>
      </div>
    );
  }

  const nadir = dailySummary.nadir;
  const hours = Math.floor(nadir.timeAfterInjectionMinutes / 60);
  const mins = nadir.timeAfterInjectionMinutes % 60;

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 mx-4 mb-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 rounded-full p-2">
            <TrendingDown size={18} className="text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Nadir estimado</p>
            <p className="text-2xl font-bold text-gray-800">{nadir.value} <span className="text-sm font-normal text-gray-400">mg/dL</span></p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Hora</p>
          <p className="text-sm font-semibold text-gray-700">{formatTime(nadir.timestamp)}</p>
          <p className="text-xs text-gray-400 mt-1">{hours}h {mins}m post-inyección</p>
        </div>
      </div>
    </div>
  );
}