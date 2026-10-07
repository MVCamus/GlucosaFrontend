import { Activity, AlertTriangle } from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import { useLibreLinkStore } from "../../stores/librelinkStore";
import { daysRemaining, formatTime } from "../../utils/date";
import { useState, useEffect } from "react";

export default function SensorBanner() {
  const sensor = useAppStore((s) => s.sensorStatus);
  const currentPetId = useAppStore((s) => s.currentPet?.id);
  const libreLinkStatus = useLibreLinkStore((s) => s.status);
  const fetchLibreLinkStatus = useLibreLinkStore((s) => s.fetchStatus);
  const [remaining, setRemaining] = useState(sensor ? sensor.daysRemaining : 0);

  useEffect(() => {
    if (currentPetId) {
      fetchLibreLinkStatus(currentPetId);
    }
  }, [currentPetId, fetchLibreLinkStatus]);

  useEffect(() => {
    if (!sensor) return;
    const calc = daysRemaining(sensor.expiresAt);
    setRemaining(calc);
  }, [sensor]);

  const showLibreLinkReading =
    libreLinkStatus?.connected && libreLinkStatus.lastReadingValue !== null;
  const libreLinkError = libreLinkStatus?.status === "error";

  // Si no hay sensor en sensorStatus pero libreLinkStatus nos reporta sensorExpiresAt, calculamos los días
  const effectiveExpiresAt = sensor?.expiresAt || (libreLinkStatus?.sensorExpiresAt ?? null);
  const effectiveDaysRemaining = effectiveExpiresAt ? daysRemaining(effectiveExpiresAt) : remaining;
  const effectiveSensorModel = sensor?.sensorModel || 'FreeStyle Libre';

  if (!sensor && !effectiveExpiresAt && !showLibreLinkReading && !libreLinkError) {
    return (
      <div id="tour-sensor-banner" className="bg-white border border-gray-100 rounded-xl p-3 mx-4 mb-3 shadow-sm flex items-center gap-2">
        <Activity size={16} className="text-gray-400" />
        <span className="text-sm font-semibold text-gray-500">No hay un sensor activo registrado</span>
      </div>
    );
  }

  if (libreLinkError && !sensor && !effectiveExpiresAt) {
    return (
      <div id="tour-sensor-banner" className="bg-red-50 border border-red-200 rounded-xl p-3 mx-4 mb-3 shadow-sm flex items-center gap-2">
        <AlertTriangle size={16} className="text-red-500" />
        <span className="text-sm font-semibold text-red-700">Error de conexión con LibreLinkUp</span>
      </div>
    );
  }

  const totalDays = 14;
  const percentage = Math.min(100, (effectiveDaysRemaining / totalDays) * 100);
  const barColor = effectiveDaysRemaining > 3 ? "bg-green-500" : effectiveDaysRemaining > 1 ? "bg-amber-500" : "bg-red-500";
  const textColor = effectiveDaysRemaining > 3 ? "text-green-700" : effectiveDaysRemaining > 1 ? "text-amber-700" : "text-red-700";
  const statusText = effectiveDaysRemaining > 0 ? `${effectiveDaysRemaining} días restantes` : "Sensor caducado — reemplazar ahora";

  return (
    <div id="tour-sensor-banner" className="bg-white border border-gray-100 rounded-xl p-3 mx-4 mb-3 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <Activity size={16} className="text-orange-500" />
        <span className="text-sm font-semibold text-gray-700">Sensor activo</span>
        <span className="text-xs text-gray-400 ml-auto">{effectiveSensorModel}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className={`${barColor} h-2 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
          </div>
        </div>
        <span className={`text-sm font-bold ${textColor}`}>{statusText}</span>
      </div>
      {showLibreLinkReading && (
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-baseline gap-2">
          <span className="text-xs text-gray-500">LibreLink:</span>
          <span className="text-sm font-semibold text-gray-800">
            {libreLinkStatus!.lastReadingValue} mg/dL
          </span>
          {libreLinkStatus!.lastReadingTrend && (
            <span className="text-xs text-gray-500">({libreLinkStatus!.lastReadingTrend})</span>
          )}
          {libreLinkStatus!.lastReadingAt && (
            <span className="text-xs text-gray-400 ml-auto">{formatTime(libreLinkStatus!.lastReadingAt)}</span>
          )}
        </div>
      )}
    </div>
  );
}