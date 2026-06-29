import { useState, useRef, useCallback, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { useRegistryStore } from "../../stores/registryStore";
import { getInsulinLabel } from "../../types/insulin";

export default function CriticalAlertModal() {
  const isOpen = useRegistryStore((s) => s.isAlertModalOpen);
  const currentAlert = useRegistryStore((s) => s.currentAlert);
  const resolveAlert = useRegistryStore((s) => s.resolveAlert);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleCancel = () => {
    if (currentAlert) {
      resolveAlert(currentAlert.id, "cancelled");
    }
  };

  const handleForceStart = useCallback(() => {
    setIsHolding(true);
    setHoldProgress(0);
    let progress = 0;
    progressTimer.current = setInterval(() => {
      progress += 2;
      setHoldProgress(progress);
      if (progress >= 100) {
        if (progressTimer.current) clearInterval(progressTimer.current);
        holdTimer.current = setTimeout(() => {
          if (currentAlert) {
            resolveAlert(currentAlert.id, "forced");
          }
          setIsHolding(false);
          setHoldProgress(0);
        }, 0);
      }
    }, 20);
  }, [currentAlert, resolveAlert]);

  const handleForceEnd = () => {
    setIsHolding(false);
    setHoldProgress(0);
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (progressTimer.current) clearInterval(progressTimer.current);
  };

  useEffect(() => {
    return () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
      if (progressTimer.current) clearInterval(progressTimer.current);
    };
  }, []);

  if (!isOpen || !currentAlert) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-red-600 flex flex-col items-center justify-center p-6 text-white">
      <div className="bg-white/20 rounded-full p-4 mb-4">
        <AlertTriangle size={48} className="text-white" />
      </div>
      <h2 className="text-2xl font-black mb-2 text-center">ALERTA: Posible doble dosis</h2>
      <p className="text-center text-red-100 mb-6 max-w-sm">
        Ya se registró una dosis de insulina en las últimas 8 horas. Registrar otra dosis puede ser peligroso.
      </p>

      <div className="bg-white/10 rounded-xl p-4 mb-6 max-w-sm w-full">
        <p className="text-sm text-red-100 mb-1">Última dosis registrada:</p>
        <p className="font-bold">{currentAlert.lastDose.units} U — {getInsulinLabel(currentAlert.lastDose.insulinType)}</p>
        <p className="text-sm text-red-200">
          {new Date(currentAlert.lastDose.timestamp).toLocaleString("es-CL")} por {currentAlert.lastDose.caregiverName}
        </p>
      </div>

      <button
        onClick={handleCancel}
        className="w-full max-w-sm bg-white text-red-600 font-bold py-3 rounded-xl mb-4 hover:bg-red-50 transition-colors"
      >
        Cancelar (recomendado)
      </button>

      <button
        onMouseDown={handleForceStart}
        onMouseUp={handleForceEnd}
        onTouchStart={handleForceStart}
        onTouchEnd={handleForceEnd}
        className="w-full max-w-sm bg-red-800 text-white font-semibold py-3 rounded-xl relative overflow-hidden"
      >
        {isHolding && (
          <div
            className="absolute inset-0 bg-red-900 transition-all"
            style={{ width: `${holdProgress}%` }}
          />
        )}
        <span className="relative z-10">
          {isHolding ? "Manteniendo presionado..." : "Registrar de todas formas (mantener 2s)"}
        </span>
      </button>
    </div>
  );
}