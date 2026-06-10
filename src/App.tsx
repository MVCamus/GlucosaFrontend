import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import BottomNav from "./components/ui/BottomNav";
import ToastContainer from "./components/ui/Toast";
import ConnectivityBanner from "./components/ui/ConnectivityBanner";
import InstallPrompt from "./components/ui/InstallPrompt";
import NotificationPermissionBanner from "./components/ui/NotificationPermissionBanner";
import DashboardPage from "./pages/DashboardPage";
import RegisterPage from "./pages/RegisterPage";
import MedicationsPage from "./pages/MedicationsPage";
import HistoryPage from "./pages/HistoryPage";
import ReportsPage from "./pages/ReportsPage";
import LoginPage from "./pages/LoginPage";
import { useAppStore } from "./stores/appStore";
import { useSync } from "./hooks/useSync";

export default function App() {
  const setOnline = useAppStore((s) => s.setOnline);
  const currentCaregiverId = useAppStore((s) => s.currentCaregiverId);
  const isAdminLoggedIn = useAppStore((s) => s.isAdminLoggedIn);
  const fetchInitialData = useAppStore((s) => s.fetchInitialData);

  // Habilitar la sincronización en segundo plano
  useSync();

  useEffect(() => {
    // Limpiar remedios de prueba persistidos en localStorage si existen
    const medStorage = localStorage.getItem("medication-storage");
    if (medStorage) {
      try {
        const parsed = JSON.parse(medStorage);
        if (parsed.state && parsed.state.medications) {
          const hasMocks = parsed.state.medications.some((m: any) => m.id.startsWith("m-00"));
          if (hasMocks) {
            parsed.state.medications = parsed.state.medications.filter((m: any) => !m.id.startsWith("m-00"));
            parsed.state.logs = parsed.state.logs.filter((l: any) => !l.id.startsWith("ml-00") && !l.medicationId.startsWith("m-00"));
            localStorage.setItem("medication-storage", JSON.stringify(parsed));
            window.location.reload();
          }
        }
      } catch (e) {
        console.error("Error cleaning mock medications:", e);
      }
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [currentCaregiverId, isAdminLoggedIn, fetchInitialData]);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    setOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setOnline]);

  if (!currentCaregiverId && !isAdminLoggedIn) {
    return <LoginPage />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <ConnectivityBanner />
        <div className="max-w-lg md:max-w-xl lg:max-w-2xl mx-auto pb-24">
          <InstallPrompt />
          <NotificationPermissionBanner />
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/registrar" element={<RegisterPage />} />
            <Route path="/remedios" element={<MedicationsPage />} />
            <Route path="/historial" element={<HistoryPage />} />
            <Route path="/reportes" element={<ReportsPage />} />
          </Routes>
        </div>
        <BottomNav />
        <ToastContainer />
      </div>
    </BrowserRouter>
  );
}
