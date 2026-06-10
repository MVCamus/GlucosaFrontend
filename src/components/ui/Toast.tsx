import { useAppStore } from "../../stores/appStore";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  success: "bg-green-50 border-green-400 text-green-800",
  error: "bg-red-50 border-red-400 text-red-800",
  warning: "bg-amber-50 border-amber-400 text-amber-800",
  info: "bg-blue-50 border-blue-400 text-blue-800",
};

export default function ToastContainer() {
  const toasts = useAppStore((s) => s.toastQueue);
  const removeToast = useAppStore((s) => s.removeToast);

  return (
    <div className="fixed bottom-20 right-4 z-[100] flex flex-col gap-2 max-w-xs">
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg border shadow-lg animate-slide-in ${colorMap[toast.type]}`}
          >
            <Icon size={18} />
            <span className="text-sm flex-1">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="opacity-60 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}