import { Activity } from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import { daysRemaining } from "../../utils/date";
import { useState, useEffect } from "react";

export default function SensorBanner() {
  const sensor = useAppStore((s) => s.sensorStatus);
  const [remaining, setRemaining] = useState(sensor ? sensor.daysRemaining : 0);

  useEffect(() => {
    if (!sensor) return;
    const calc = daysRemaining(sensor.expiresAt);
    setRemaining(calc);
  }, [sensor]);

  if (!sensor) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl p-3 mx-4 mb-3 shadow-sm flex items-center gap-2">
        <Activity size={16} className="text-gray-400" />
        <span className="text-sm font-semibold text-gray-500">No hay un sensor activo registrado</span>
      </div>
    );
  }

  const totalDays = 14;
  const percentage = Math.min(100, (remaining / totalDays) * 100);
  const barColor = remaining > 3 ? "bg-green-500" : remaining > 1 ? "bg-amber-500" : "bg-red-500";
  const textColor = remaining > 3 ? "text-green-700" : remaining > 1 ? "text-amber-700" : "text-red-700";
  const statusText = remaining > 0 ? `${remaining} días restantes` : "Sensor caducado — reemplazar ahora";

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3 mx-4 mb-3 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <Activity size={16} className="text-orange-500" />
        <span className="text-sm font-semibold text-gray-700">Sensor activo</span>
        <span className="text-xs text-gray-400 ml-auto">{sensor.sensorModel}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className={`${barColor} h-2 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
          </div>
        </div>
        <span className={`text-sm font-bold ${textColor}`}>{statusText}</span>
      </div>
    </div>
  );
}
