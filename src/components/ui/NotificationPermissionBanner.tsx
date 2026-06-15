import { useAppStore } from "../../stores/appStore";
import { Bell, X } from "lucide-react";
import { useState } from "react";

export default function NotificationPermissionBanner() {
  const [dismissed, setDismissed] = useState(false);
  const requestPermission = useAppStore((s) => s.requestNotificationPermission);
  const currentPermission = useAppStore((s) => s.notificationPermission);
  const addToast = useAppStore((s) => s.addToast);

  const onboardingCompleted = useAppStore((s) => s.onboardingCompleted);

  if (!onboardingCompleted || dismissed || currentPermission === "granted" || currentPermission === "denied") return null;

  const handleRequest = async () => {
    const result = await requestPermission();
    if (result === "granted") {
      addToast({ message: "Notificaciones activadas", type: "success" });
    } else {
      addToast({ message: "Notificaciones desactivadas", type: "info" });
    }
    setDismissed(true);
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mx-4 mb-3 flex items-center gap-3">
      <div className="bg-blue-100 rounded-full p-2">
        <Bell size={18} className="text-blue-500" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-800">Activar notificaciones</p>
        <p className="text-xs text-gray-500">Recibe recordatorios de remedios</p>
      </div>
      <button
        onClick={handleRequest}
        className="text-blue-500 text-sm font-semibold hover:text-blue-600"
      >
        Activar
      </button>
      <button onClick={() => setDismissed(true)}>
        <X size={16} className="text-gray-400" />
      </button>
    </div>
  );
}