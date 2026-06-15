import { ArrowLeft, Dog, Users, Activity, Syringe, Plus, X, LogOut, Shield, RefreshCw, WifiOff, HelpCircle, Play, BellRing } from "lucide-react";
import { useAppStore } from "../stores/appStore";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { getInsulinLabel } from "../types/insulin";
import { useState } from "react";

interface Props {
  onBack: () => void;
}

export default function SettingsPage({ onBack }: Props) {
  const currentPet = useAppStore((s: any) => s.currentPet);
  const pets = useAppStore((s: any) => s.pets);
  const addPet = useAppStore((s: any) => s.addPet);
  const updatePet = useAppStore((s: any) => s.updatePet);
  const setCurrentPet = useAppStore((s: any) => s.setCurrentPet);

  const sensor = useAppStore((s) => s.sensorStatus);
  const registerNewSensor = useAppStore((s) => s.registerNewSensor);
  
  const customInsulinTypes = useAppStore((s) => s.customInsulinTypes);
  const addCustomInsulinType = useAppStore((s) => s.addCustomInsulinType);
  const removeCustomInsulinType = useAppStore((s) => s.removeCustomInsulinType);
  
  const caregivers = useAppStore((s: any) => s.caregivers);
  const addCaregiver = useAppStore((s: any) => s.addCaregiver);
  const updateCaregiver = useAppStore((s: any) => s.updateCaregiver);
  const removeCaregiver = useAppStore((s: any) => s.removeCaregiver);
  
  const currentUser = useAppStore((s: any) => s.currentCaregiver());
  const isAdmin = useAppStore((s: any) => s.isAdminLoggedIn);
  const changeAdminPassword = useAppStore((s: any) => s.changeAdminPassword);
  const logout = useAppStore((s: any) => s.logout);
  const addToast = useAppStore((s: any) => s.addToast);
  const hasToken = useAppStore((s: any) => s.hasToken);
  const resetOnboarding = useAppStore((s) => s.resetOnboarding);

  const [newType, setNewType] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<"owner" | "family" | "veterinarian">("family");
  const [newPass, setNewPass] = useState("1234");
  const [selectedPetId, setSelectedPetId] = useState("");

  const [petName, setPetName] = useState("");
  const [petBreed, setPetBreed] = useState("");
  const [petWeight, setPetWeight] = useState("");
  const [petDob, setPetDob] = useState("");

  const [adminPassInput, setAdminPassInput] = useState("");
  const [currentPass, setCurrentPass] = useState("");
  const [newPassUser, setNewPassUser] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showNewSensor, setShowNewSensor] = useState(false);
  const [newSensorModel, setNewSensorModel] = useState("");
  const [newSensorSerial, setNewSensorSerial] = useState("");

  const [isEditingPet, setIsEditingPet] = useState(false);
  const [editPetName, setEditPetName] = useState("");
  const [editPetBreed, setEditPetBreed] = useState("");
  const [editPetWeight, setEditPetWeight] = useState("");
  const [editPetDob, setEditPetDob] = useState("");
  const [editPetTargetLow, setEditPetTargetLow] = useState("");
  const [editPetTargetHigh, setEditPetTargetHigh] = useState("");

  const handleStartEdit = () => {
    if (!currentPet) return;
    setEditPetName(currentPet.name);
    setEditPetBreed(currentPet.breed);
    setEditPetWeight(String(currentPet.weightKg));
    setEditPetDob(currentPet.dateOfBirth ? currentPet.dateOfBirth.split("T")[0] : "");
    setEditPetTargetLow(String(currentPet.targetLow ?? 70));
    setEditPetTargetHigh(String(currentPet.targetHigh ?? 250));
    setIsEditingPet(true);
  };

  const handleSavePet = async () => {
    if (!currentPet) return;
    if (!editPetName.trim() || !editPetBreed.trim() || !editPetWeight || !editPetDob || !editPetTargetLow || !editPetTargetHigh) {
      addToast({ message: "Completa todos los campos", type: "warning" });
      return;
    }
    try {
      await updatePet(currentPet.id, {
        name: editPetName.trim(),
        breed: editPetBreed.trim(),
        weightKg: parseFloat(editPetWeight),
        dateOfBirth: editPetDob,
        targetLow: parseInt(editPetTargetLow),
        targetHigh: parseInt(editPetTargetHigh),
      });
      addToast({ message: "Perfil de la mascota actualizado", type: "success" });
      setIsEditingPet(false);
    } catch (err) {
      addToast({ message: "Error al actualizar la mascota", type: "error" });
    }
  };

  const handleAddType = () => {
    const name = newType.trim().toLowerCase().replace(/\s+/g, "_");
    if (!name) return;
    if (name === "insulatard" || customInsulinTypes.includes(name)) {
      addToast({ message: "Este tipo ya existe", type: "warning" });
      return;
    }
    addCustomInsulinType(name);
    addToast({ message: `Tipo "${name}" agregado`, type: "success" });
    setNewType("");
  };

  const handleAddCaregiver = async () => {
    if (!newName.trim()) return;
    try {
      await addCaregiver({
        name: newName.trim(),
        role: newRole,
        password: newPass || "1234",
        petId: selectedPetId || undefined,
      });
      addToast({ message: `Cuidador "${newName}" agregado`, type: "success" });
      setNewName("");
      setNewPass("1234");
      setSelectedPetId("");
    } catch (err) {
      addToast({ message: "Error al agregar el cuidador", type: "error" });
    }
  };

  const handleAddPet = async () => {
    if (!petName.trim() || !petBreed.trim() || !petWeight || !petDob) {
      addToast({ message: "Completa todos los campos del perfil", type: "warning" });
      return;
    }
    try {
      const created = await addPet({
        name: petName.trim(),
        breed: petBreed.trim(),
        weightKg: parseFloat(petWeight),
        dateOfBirth: petDob,
      });
      if (created) {
        addToast({ message: `Mascota "${petName}" registrada exitosamente`, type: "success" });
        setPetName("");
        setPetBreed("");
        setPetWeight("");
        setPetDob("");
      }
    } catch (err) {
      addToast({ message: "Error al registrar la mascota", type: "error" });
    }
  };

  const handleChangeAdminPass = () => {
    if (!adminPassInput.trim()) return;
    changeAdminPassword(adminPassInput);
    addToast({ message: "Contraseña de admin actualizada", type: "success" });
    setAdminPassInput("");
  };

  const handleRegisterSensor = () => {
    if (!newSensorModel.trim() || !newSensorSerial.trim()) {
      addToast({ message: "Completa modelo y número de serie", type: "warning" });
      return;
    }
    registerNewSensor(newSensorModel.trim(), newSensorSerial.trim());
    setShowNewSensor(false);
    setNewSensorModel("");
    setNewSensorSerial("");
  };

  const handleChangePassword = () => {
    if (!currentUser) return;
    const user = caregivers.find((c: any) => c.id === currentUser.id);
    if (!user || user.password !== currentPass) {
      addToast({ message: "Contraseña actual incorrecta", type: "error" });
      return;
    }
    if (!newPassUser.trim()) {
      addToast({ message: "La nueva contraseña no puede estar vacía", type: "warning" });
      return;
    }
    if (newPassUser !== confirmPass) {
      addToast({ message: "Las contraseñas nuevas no coinciden", type: "error" });
      return;
    }
    updateCaregiver(currentUser.id, { password: newPassUser });
    addToast({ message: "Contraseña actualizada", type: "success" });
    setCurrentPass("");
    setNewPassUser("");
    setConfirmPass("");
  };

  const handleTestImmediateNotification = async () => {
    const title = "🚨 Prueba de Alerta Crítica";
    const body = "Esto es una simulación de glucosa fuera de rango. ¡El sistema de sonido y vibración funciona!";
    
    const appState = useAppStore.getState();
    if (appState.notificationPermission !== "granted") {
      addToast({ message: "Permiso de notificaciones no concedido. Actívalo en el inicio.", type: "warning" });
      return;
    }

    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.createChannel({
          id: "critical-alerts",
          name: "Alertas Críticas",
          description: "Canal para alertas de glucosa alta y baja",
          importance: 5,
          vibration: true,
          visibility: 1,
        });

        await LocalNotifications.schedule({
          notifications: [
            {
              title,
              body,
              id: 99991,
              channelId: "critical-alerts",
              schedule: {
                at: new Date(Date.now() + 500),
                allowWhileIdle: true,
              }
            }
          ]
        });
        addToast({ message: "Alerta nativa inmediata enviada", type: "success" });
      } catch (e) {
        console.error(e);
        addToast({ message: "Error al enviar alerta nativa", type: "error" });
      }
    } else if ("Notification" in window) {
      new Notification(title, { body, icon: "/pwa-192x192.png" });
      addToast({ message: "Alerta web enviada", type: "success" });
    } else {
      addToast({ message: "Notificaciones no soportadas en este navegador", type: "error" });
    }
  };

  const handleTestDelayedNotification = async () => {
    const title = "🔒 Alerta con Pantalla Bloqueada";
    const body = "¡Funciona! Esta alerta de prueba se programó hace 5 segundos para sonar en segundo plano.";
    
    const appState = useAppStore.getState();
    if (appState.notificationPermission !== "granted") {
      addToast({ message: "Permiso de notificaciones no concedido. Actívalo en el inicio.", type: "warning" });
      return;
    }

    const triggerTime = new Date(Date.now() + 5000);

    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.createChannel({
          id: "critical-alerts",
          name: "Alertas Críticas",
          description: "Canal para alertas de glucosa alta y baja",
          importance: 5,
          vibration: true,
          visibility: 1,
        });

        await LocalNotifications.schedule({
          notifications: [
            {
              title,
              body,
              id: 99992,
              channelId: "critical-alerts",
              schedule: {
                at: triggerTime,
                allowWhileIdle: true,
              }
            }
          ]
        });
        addToast({ message: "Alerta programada en 5 seg. ¡Bloquea tu pantalla ahora!", type: "info" });
      } catch (e) {
        console.error(e);
        addToast({ message: "Error al programar alerta", type: "error" });
      }
    } else {
      setTimeout(() => {
        if ("Notification" in window) {
          new Notification(title, { body, icon: "/pwa-192x192.png" });
        }
      }, 5000);
      addToast({ message: "Alerta web programada en 5 seg. Deja la pestaña abierta.", type: "info" });
    }
  };

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h2 className="text-lg font-bold text-gray-800">Ajustes</h2>
        <button onClick={logout} className="ml-auto flex items-center gap-1 bg-red-50 text-red-500 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors">
          <LogOut size={14} /> Cerrar sesión
        </button>
      </div>

      <div className="space-y-4">
        {!hasToken && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3 items-start text-red-800 shadow-sm">
            <WifiOff size={20} className="text-red-500 shrink-0 mt-0.5 animate-bounce" />
            <div>
              <h4 className="font-bold text-sm">Modo Local (Sin conexión)</h4>
              <p className="text-xs text-red-600 mt-1">
                Has iniciado sesión usando la clave de respaldo local. Las acciones que requieran escribir o leer del backend (como registrar mascotas, cuidadores o sensores) no funcionarán. Asegúrate de que el backend esté activo, cierra la sesión actual y vuelve a ingresar.
              </p>
            </div>
          </div>
        )}
        {/* Selector de mascota activa si hay más de una */}
        {pets.length > 1 && (
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <label className="text-xs font-bold text-gray-500 block mb-2">MASCOTA ACTIVA PARA VER EN PANEL</label>
            <select
              value={currentPet?.id || ""}
              onChange={(e) => {
                const found = pets.find((p: any) => p.id === e.target.value);
                if (found) setCurrentPet(found);
              }}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              {pets.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name} ({p.breed})</option>
              ))}
            </select>
          </div>
        )}

        {/* Perfil de mascota */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-orange-100 rounded-full p-2">
              <Dog size={20} className="text-orange-500" />
            </div>
            <h3 className="font-semibold text-gray-800">Perfil de la mascota</h3>
            {currentUser && (
              <span className="ml-auto text-xs text-gray-400">👤 {currentUser.name}</span>
            )}
            {isAdmin && (
              <span className="ml-auto text-xs text-orange-500 flex items-center gap-1"><Shield size={12} /> Admin</span>
            )}
          </div>
          {currentPet ? (
            isEditingPet ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 block mb-0.5">NOMBRE</label>
                    <input
                      type="text"
                      value={editPetName}
                      onChange={(e) => setEditPetName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 block mb-0.5">RAZA</label>
                    <input
                      type="text"
                      value={editPetBreed}
                      onChange={(e) => setEditPetBreed(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 block mb-0.5">PESO (KG)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editPetWeight}
                      onChange={(e) => setEditPetWeight(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 block mb-0.5">FECHA NACIMIENTO</label>
                    <input
                      type="date"
                      value={editPetDob}
                      onChange={(e) => setEditPetDob(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 block mb-0.5">MÍNIMO GLICEMIA (HIPO)</label>
                    <input
                      type="number"
                      value={editPetTargetLow}
                      onChange={(e) => setEditPetTargetLow(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 block mb-0.5">MÁXIMO GLICEMIA (HIPER)</label>
                    <input
                      type="number"
                      value={editPetTargetHigh}
                      onChange={(e) => setEditPetTargetHigh(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1.5">
                  <button
                    onClick={() => setIsEditingPet(false)}
                    className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 font-semibold text-xs hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSavePet}
                    className="flex-1 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition-colors"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Nombre</span>
                  <span className="font-medium text-gray-800">{currentPet.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Raza</span>
                  <span className="font-medium text-gray-800">{currentPet.breed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Peso</span>
                  <span className="font-medium text-gray-800">{currentPet.weightKg} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Nacimiento</span>
                  <span className="font-medium text-gray-800">{new Date(currentPet.dateOfBirth).toLocaleDateString("es-CL")}</span>
                </div>
                <div className="flex justify-between border-t border-gray-50 pt-2 text-xs">
                  <span className="text-gray-400 font-bold">LÍMITES DE ALERTA</span>
                  <span className="font-semibold text-orange-600">
                    {currentPet.targetLow ?? 70} - {currentPet.targetHigh ?? 250} mg/dL
                  </span>
                </div>
                {hasToken && (
                  <button
                    onClick={handleStartEdit}
                    className="w-full mt-2 py-2 text-xs font-semibold text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-center"
                  >
                    Editar Perfil y Límites
                  </button>
                )}
              </div>
            )
          ) : (
            <p className="text-sm text-gray-400 py-2 text-center">No hay ninguna mascota registrada</p>
          )}
        </div>

        {/* Administrar Mascotas (Admin) */}
        {isAdmin && (
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-orange-50 rounded-full p-2">
                <Plus size={20} className="text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Registrar mascota</h3>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  placeholder="Nombre"
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <input
                  type="text"
                  value={petBreed}
                  onChange={(e) => setPetBreed(e.target.value)}
                  placeholder="Raza"
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={petWeight}
                  onChange={(e) => setPetWeight(e.target.value)}
                  placeholder="Peso (kg)"
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <input
                  type="date"
                  value={petDob}
                  onChange={(e) => setPetDob(e.target.value)}
                  placeholder="F. Nacimiento"
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <button
                onClick={handleAddPet}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
              >
                Crear Mascota
              </button>
            </div>
          </div>
        )}

        {/* Cuidadores */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-100 rounded-full p-2">
              <Users size={20} className="text-blue-500" />
            </div>
            <h3 className="font-semibold text-gray-800">Cuidadores</h3>
          </div>
          <div className="space-y-2">
            {caregivers.map((c: any) => {
              const assignedPet = pets.find((p: any) => p.id === c.petId);
              return (
                <div key={c.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">{c.name}</span>
                    {assignedPet && (
                      <span className="text-xs text-orange-500">Mascota: {assignedPet.name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {currentUser?.id === c.id && (
                      <span className="text-xs text-orange-500 font-medium">Tú</span>
                    )}
                    {isAdmin && currentUser?.id !== c.id && (
                      <button
                        onClick={() => { removeCaregiver(c.id); addToast({ message: `${c.name} eliminado`, type: "info" }); }}
                        className="p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {isAdmin && (
            <div className="border-t border-gray-100 pt-3 mt-2">
              <p className="text-xs font-medium text-gray-500 mb-2">Agregar cuidador</p>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nombre"
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as "owner" | "family" | "veterinarian")}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="owner">Dueño</option>
                  <option value="family">Familia</option>
                  <option value="veterinarian">Veterinario</option>
                </select>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Contraseña"
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <select
                  value={selectedPetId}
                  onChange={(e) => setSelectedPetId(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="">Vincular Mascota</option>
                  {pets.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <button onClick={handleAddCaregiver} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-1">
                <Plus size={16} /> Crear Cuidador
              </button>
            </div>
          )}
        </div>

        {/* Sensor */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-green-100 rounded-full p-2">
              <Activity size={20} className="text-green-500" />
            </div>
            <h3 className="font-semibold text-gray-800">Sensor</h3>
            {currentPet && (
              <button
                onClick={() => setShowNewSensor(!showNewSensor)}
                className="ml-auto flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
              >
                <RefreshCw size={14} /> Nuevo sensor
              </button>
            )}
          </div>
          {sensor ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Modelo</span>
                <span className="font-medium text-gray-800">{sensor.sensorModel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">N° Serie</span>
                <span className="font-medium text-gray-800">{sensor.serialNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Activado</span>
                <span className="font-medium text-gray-800">{new Date(sensor.activatedAt).toLocaleDateString("es-CL")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Expira</span>
                <span className="font-medium text-gray-800">{new Date(sensor.expiresAt).toLocaleDateString("es-CL")}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-2 text-center">No hay un sensor activo registrado para esta mascota</p>
          )}
          {showNewSensor && currentPet && (
            <div className="border-t border-gray-100 pt-3 mt-3">
              <p className="text-xs font-medium text-gray-500 mb-2">Registrar nuevo sensor</p>
              <div className="space-y-2">
                <input
                  type="text"
                  value={newSensorModel}
                  onChange={(e) => setNewSensorModel(e.target.value)}
                  placeholder="Modelo (Ej: FreeStyle Libre 3)"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <input
                  type="text"
                  value={newSensorSerial}
                  onChange={(e) => setNewSensorSerial(e.target.value)}
                  placeholder="N° de serie"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <button
                  onClick={handleRegisterSensor}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
                >
                  Registrar sensor (14 días)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Ayuda y Tutorial */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-orange-100 rounded-full p-2">
              <HelpCircle size={20} className="text-orange-500" />
            </div>
            <h3 className="font-semibold text-gray-800">Tutorial de Bienvenida</h3>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            ¿Necesitas ayuda? Haz clic aquí para iniciar el tutorial visual interactivo y recordar dónde está cada funcionalidad de la app.
          </p>
          <button
            onClick={() => {
              resetOnboarding();
              addToast({ message: "Tutorial reiniciado. Regresa al inicio para verlo.", type: "success" });
            }}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Play size={14} fill="white" /> Reproducir Tutorial
          </button>
        </div>

        {currentUser && !isAdmin && (
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-gray-100 rounded-full p-2">
                <LogOut size={18} className="text-gray-500" />
              </div>
              <h3 className="font-semibold text-gray-800">Cambiar contraseña</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-1">Contraseña actual</label>
                <input
                  type="password"
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-1">Nueva contraseña</label>
                <input
                  type="password"
                  value={newPassUser}
                  onChange={(e) => setNewPassUser(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-1">Confirmar nueva contraseña</label>
                <input
                  type="password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <button onClick={handleChangePassword} className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors">
                Cambiar contraseña
              </button>
            </div>
          </div>
        )}

        {isAdmin && (
          <>
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-purple-100 rounded-full p-2">
                  <Shield size={20} className="text-purple-500" />
                </div>
                <h3 className="font-semibold text-gray-800">Admin</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1">Cambiar contraseña de admin</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={adminPassInput}
                      onChange={(e) => setAdminPassInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleChangeAdminPass()}
                      placeholder="Nueva contraseña"
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                    <button onClick={handleChangeAdminPass} className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors">
                      Cambiar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-100 rounded-full p-2">
                  <Syringe size={20} className="text-blue-500" />
                </div>
                <h3 className="font-semibold text-gray-800">Tipos de insulina</h3>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                Insulatard está siempre disponible. Agrega aquí otros tipos que uses.
              </p>
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="text"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddType()}
                  placeholder="Ej: glargina, detemir..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <button onClick={handleAddType} className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors">
                  <Plus size={18} />
                </button>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between py-1.5 px-2 bg-orange-50 rounded-lg">
                  <span className="text-sm font-medium text-orange-700">Insulatard (NPH)</span>
                  <span className="text-xs text-orange-400 bg-orange-100 px-2 py-0.5 rounded-full">Fijo</span>
                </div>
                {customInsulinTypes.map((t) => (
                  <div key={t} className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">{getInsulinLabel(t)}</span>
                    <button
                      onClick={() => { removeCustomInsulinType(t); addToast({ message: `"${getInsulinLabel(t)}" eliminado`, type: "info" }); }}
                      className="p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {customInsulinTypes.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-2">No hay tipos personalizados</p>
                )}
              </div>
            </div>

            {/* Pruebas de Notificaciones */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-orange-100 rounded-full p-2">
                  <BellRing size={20} className="text-orange-500" />
                </div>
                <h3 className="font-semibold text-gray-800">Prueba de Alertas</h3>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Usa estos botones para verificar que los sonidos, la vibración y las notificaciones emergentes (incluso con pantalla bloqueada) funcionan correctamente en tu dispositivo.
              </p>
              <div className="space-y-2">
                <button
                  onClick={handleTestImmediateNotification}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <BellRing size={14} /> Alerta Inmediata (Con Sonido)
                </button>
                <button
                  onClick={handleTestDelayedNotification}
                  className="w-full bg-orange-100 hover:bg-orange-200 text-orange-700 font-semibold py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Play size={14} fill="orange" /> Alerta Programada (5 seg - para Bloquear Pantalla)
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
