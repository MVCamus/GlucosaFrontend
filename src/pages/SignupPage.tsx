import { useState } from "react";
import { Dog, Lock, UserPlus, ArrowLeft } from "lucide-react";
import { useAppStore } from "../stores/appStore";

interface Props {
  onBack: () => void;
}

export default function SignupPage({ onBack }: Props) {
  const signup = useAppStore((s) => s.signup);
  const addToast = useAppStore((s) => s.addToast);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSignup = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const trimmed = name.trim();
      if (trimmed.length < 2) {
        addToast({ message: "El nombre debe tener al menos 2 caracteres", type: "warning" });
        return;
      }
      if (password.length < 4) {
        addToast({ message: "La contraseña debe tener al menos 4 caracteres", type: "warning" });
        return;
      }
      if (password !== confirm) {
        addToast({ message: "Las contraseñas no coinciden", type: "warning" });
        return;
      }

      try {
        const success = await signup(trimmed, password);
        if (success) {
          addToast({ message: `Bienvenido, ${trimmed}`, type: "success" });
        }
      } catch (e: any) {
        const msg = e?.message || "No se pudo crear la cuenta";
        addToast({ message: msg, type: "error" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-400 to-orange-600 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-sm mx-auto">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-orange-100 text-sm mb-4 hover:text-white"
        >
          <ArrowLeft size={16} /> Volver a iniciar sesión
        </button>

        <div className="text-center mb-8">
          <div className="bg-white/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <Dog size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Crear cuenta</h1>
          <p className="text-orange-100 text-sm mt-1">Regístrate como cuidador (rol: owner)</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">Nombre de usuario</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mínimo 2 caracteres"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">Contraseña</label>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-orange-400">
                <Lock size={16} className="text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSignup()}
                  placeholder="Mínimo 4 caracteres"
                  className="flex-1 bg-transparent text-sm focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">Confirmar contraseña</label>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-orange-400">
                <Lock size={16} className="text-gray-400" />
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSignup()}
                  placeholder="••••"
                  className="flex-1 bg-transparent text-sm focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleSignup}
              disabled={submitting}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <UserPlus size={18} />
              {submitting ? "Creando..." : "Crear cuenta"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}