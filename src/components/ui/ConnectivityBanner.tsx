import { useAppStore } from "../../stores/appStore";
import { WifiOff } from "lucide-react";

export default function ConnectivityBanner() {
  const isOnline = useAppStore((s) => s.isOnline);

  if (isOnline) return null;

  return (
    <div className="bg-red-500 text-white text-center py-1.5 px-4 text-sm font-medium flex items-center justify-center gap-2">
      <WifiOff size={16} />
      Sin conexión — los datos se guardan localmente
    </div>
  );
}