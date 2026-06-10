import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as unknown as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!show || !deferredPrompt) return null;

  const handleInstall = async () => {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShow(false);
  };

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mx-4 mb-3 flex items-center gap-3">
      <div className="bg-orange-100 rounded-full p-2">
        <Download size={20} className="text-orange-500" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-800">Instalar DiabetesVet</p>
        <p className="text-xs text-gray-500">Accede rápido como una app nativa</p>
      </div>
      <button onClick={handleInstall} className="text-orange-500 text-sm font-semibold hover:text-orange-600">
        Instalar
      </button>
      <button onClick={() => setShow(false)}>
        <X size={16} className="text-gray-400" />
      </button>
    </div>
  );
}