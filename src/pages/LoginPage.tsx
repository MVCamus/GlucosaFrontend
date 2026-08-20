import { useState } from "react";
import { Dog, Lock, LogIn, Shield, UserPlus } from "lucide-react";
import { useAppStore } from "../stores/appStore";

interface Props {
  onGoSignup?: () => void;
}

export default function LoginPage({ onGoSignup }: Props = {}) {
  const caregivers = useAppStore((s) => s.caregivers);
  const login = useAppStore((s) => s.login);
  const adminLogin = useAppStore((s) => s.adminLogin);
  const addToast = useAppStore((s) => s.addToast);

  const [mode, setMode] = useState<"caregiver" | "admin">("caregiver");
  const [selectedId, setSelectedId] = useState(caregivers[0]?.id || "");
  const [manualName, setManualName] = useState("");
  const [isManual, setIsManual] = useState(caregivers.length === 0);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    setSubmitting(true);
    try {
      if (!password) {
        addToast({ message: "Ingresa tu contraseña", type: "warning" });
        return;
      }
      if (mode === "admin") {
        const ok = await adminLogin(password);
        if (ok) {
          addToast({ message: "Bienvenido, Administrador", type: "success" });
        } else {
          addToast({ message: "Contraseña de admin incorrecta", type: "error" });
        }
        return;
      }

      const identifier = isManual ? manualName.trim() : selectedId;
      if (!identifier) {
        addToast({ message: isManual ? "Ingresa tu nombre" : "Selecciona un cuidador", type: "warning" });
        return;
      }

      try {
        const success = await login(identifier, password);
        if (success) {
          const name = isManual ? identifier : (caregivers.find((c) => c.id === selectedId)?.name || identifier);
          addToast({ message: `Bienvenido, ${name}`, type: "success" });
        } else {
          addToast({ message: "Credenciales inválidas o contraseña incorrecta", type: "error" });
        }
      } catch (err: any) {
        const msg = err?.message || "No se pudo iniciar sesión. Verifica tus datos";
        addToast({ message: msg, type: "error" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-400 to-orange-600 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-8">
          <div className="bg-white/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <Dog size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">DiabetesVet</h1>
          <p className="text-orange-100 text-sm mt-1">Monitoreo de diabetes canina</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <div className="flex mb-4 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => { setMode("caregiver"); setPassword(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === "caregiver" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"}`}
            >
              Cuidador
            </button>
            <button
              onClick={() => { setMode("admin"); setPassword(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1 ${mode === "admin" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"}`}
            >
              <Shield size={14} /> Admin
            </button>
          </div>

          <div className="space-y-4">
            {mode === "caregiver" && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-600">Cuidador</label>
                  {caregivers.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsManual(!isManual)}
                      className="text-xs text-orange-600 hover:underline"
                    >
                      {isManual ? "Seleccionar de la lista" : "Escribir nombre"}
                    </button>
                  )}
                </div>
                {isManual ? (
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="Nombre del cuidador"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                ) : (
                  <select
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="">-- Selecciona --</option>
                    {caregivers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {mode === "admin" && (
              <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-500 text-center">
                <Shield size={18} className="mx-auto mb-1 text-gray-400" />
                Acceso de administrador para gestionar cuidadores y configuración
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">Contraseña</label>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-orange-400">
                <Lock size={16} className="text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="••••"
                  className="flex-1 bg-transparent text-sm focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={submitting}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <LogIn size={18} />
              {submitting ? "Entrando..." : "Entrar"}
            </button>

            {onGoSignup && (
              <button
                type="button"
                onClick={onGoSignup}
                className="w-full text-sm text-orange-600 hover:underline flex items-center justify-center gap-1"
              >
                <UserPlus size={14} /> Crear cuenta nueva
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
