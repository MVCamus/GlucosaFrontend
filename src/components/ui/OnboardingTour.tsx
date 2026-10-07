import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../stores/appStore";

interface Step {
  route: string;
  selector: string;
  title: string;
  description: string;
  placement: "top" | "bottom";
  actionBefore?: () => void;
}

const steps: Step[] = [
  {
    route: "/",
    selector: "#tour-header",
    title: "Panel del Cuidador 👤",
    description: "Aquí puedes ver quién tiene la sesión activa, forzar la sincronización en la nube y cambiar el día que deseas consultar.",
    placement: "bottom",
  },
  {
    route: "/",
    selector: "#tour-sensor-banner",
    title: "Estado del Sensor CGM 🔋",
    description: "Monitorea si el sensor continuo de glucosa de Polo está activo y cuántos días útiles le quedan antes de caducar.",
    placement: "bottom",
  },
  {
    route: "/",
    selector: "#tour-glucose-chart",
    title: "Curva de Glucosa 📈",
    description: "Visualiza la última glicemia registrada y la curva de las últimas 24 horas junto a los rangos objetivo (mínimo y máximo).",
    placement: "top",
  },
  {
    route: "/",
    selector: "#tour-event-summary",
    title: "Eventos del Día 🍖",
    description: "Revisa rápidamente las inyecciones de insulina administradas y la comida servida durante el día.",
    placement: "top",
  },
  {
    route: "/registrar",
    selector: "#tour-tab-glucose",
    title: "Registrar Glucosa Manual 🩸",
    description: "Si realizas una medición capilar con glucómetro o tira reactiva, puedes anotarla aquí con la hora exacta.",
    placement: "bottom",
    actionBefore: () => {
      const btn = document.getElementById("tour-tab-glucose") as HTMLButtonElement | null;
      if (btn) btn.click();
    },
  },
  {
    route: "/registrar",
    selector: "#tour-tab-insulin",
    title: "Registrar Dosis de Insulina 💉",
    description: "Ingresa las unidades exactas administradas (en números enteros de 1 a 30 U), tipo de insulina y notas opcionales.",
    placement: "bottom",
    actionBefore: () => {
      const btn = document.getElementById("tour-tab-insulin") as HTMLButtonElement | null;
      if (btn) btn.click();
    },
  },
  {
    route: "/registrar",
    selector: "#tour-tab-food",
    title: "Registrar Comida Servida 🍖",
    description: "Anota el tipo de comida (pellet, comida casera o mixta), la porción en gramos y la hora en que comió tu mascota.",
    placement: "bottom",
    actionBefore: () => {
      const btn = document.getElementById("tour-tab-food") as HTMLButtonElement | null;
      if (btn) btn.click();
    },
  },
  {
    route: "/remedios",
    selector: "#tour-meds-pending",
    title: "Remedios Pendientes 💊",
    description: "Aquí ves los medicamentos programados para hoy que faltan por administrar. Solo toca un remedio para marcarlo como dado.",
    placement: "bottom",
  },
  {
    route: "/remedios",
    selector: "#tour-nav-remedios",
    title: "Historial de Remedios Dados ✅",
    description: "Abajo verás los remedios ya dados hoy con la hora en que se entregaron y el cuidador que los administró.",
    placement: "top",
  },
  {
    route: "/",
    selector: "#tour-settings-button",
    title: "Ajustes, Cuenta Abbott y Límites ⚙️",
    description: "Desde aquí puedes vincular la cuenta de LibreLinkUp, configurar los límites de hipo/hiperglucemia o reiniciar este tutorial cuando quieras.",
    placement: "bottom",
  },
];

export default function OnboardingTour() {
  const onboardingCompleted = useAppStore((s) => s.onboardingCompleted);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  // Navegar a la ruta requerida en este paso si no estamos en ella
  useEffect(() => {
    if (onboardingCompleted) return;
    const step = steps[currentStep];
    if (step && window.location.pathname !== step.route) {
      navigate(step.route);
    }
    if (step?.actionBefore) {
      // Dar un pequeño tiempo para que el DOM de la vista esté montado
      setTimeout(() => {
        step.actionBefore?.();
      }, 100);
    }
  }, [currentStep, onboardingCompleted, navigate]);

  useEffect(() => {
    if (onboardingCompleted) return;

    const updatePosition = () => {
      const step = steps[currentStep];
      if (!step) return;

      const element = document.querySelector(step.selector);

      if (!element) {
        // Fallback centrado si el elemento no está disponible
        setHighlightStyle({ display: "none" });
        setTooltipStyle({
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 99999,
          width: "320px",
        });
        return;
      }

      // Scroll elemento hacia la vista suavemente
      element.scrollIntoView({ behavior: "smooth", block: "center" });

      const rect = element.getBoundingClientRect();
      const padding = 8;

      setHighlightStyle({
        position: "fixed",
        top: Math.max(0, rect.top - padding),
        left: Math.max(0, rect.left - padding),
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.75)",
        borderRadius: "14px",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        zIndex: 99998,
        pointerEvents: "none",
      });

      // Calcular posición del tooltip
      const tooltipWidth = Math.min(320, window.innerWidth - 32);
      const estimatedHeight = 200;
      let top = rect.bottom + 16;
      let left = rect.left + (rect.width - tooltipWidth) / 2;

      if (step.placement === "top") {
        top = rect.top - estimatedHeight - 16;
      }

      // Evitar que se solape con la barra inferior
      const maxTop = window.innerHeight - estimatedHeight - 85;
      if (top > maxTop) {
        top = Math.max(16, rect.top - estimatedHeight - 16);
      }

      const margin = 16;
      if (top < margin) {
        top = rect.bottom + 16;
        if (top > maxTop) {
          top = margin + 10;
        }
      }

      left = Math.max(margin, Math.min(left, window.innerWidth - tooltipWidth - margin));

      setTooltipStyle({
        position: "fixed",
        top,
        left,
        width: `${tooltipWidth}px`,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        zIndex: 99999,
      });
    };

    const timer = setTimeout(updatePosition, 300);

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [currentStep, onboardingCompleted]);

  if (onboardingCompleted) return null;

  const step = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((c) => c + 1);
    } else {
      navigate("/");
      completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((c) => c - 1);
    }
  };

  const handleSkip = () => {
    navigate("/");
    completeOnboarding();
  };

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-auto z-[99997] bg-slate-900/75">
      {/* Spotlight highlight */}
      <div style={highlightStyle} />

      {/* Guided Tooltip Dialog Card */}
      <div
        style={tooltipStyle}
        className="bg-white border border-gray-100 rounded-2xl p-5 shadow-2xl flex flex-col pointer-events-auto transition-all duration-300"
      >
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">
            Tutorial • {currentStep + 1} de {steps.length}
          </span>
          <button
            onClick={handleSkip}
            className="text-xs text-gray-400 hover:text-gray-600 font-semibold"
          >
            Omitir
          </button>
        </div>

        <h3 className="text-base font-bold text-gray-800 mb-1.5">{step?.title}</h3>
        <p className="text-xs text-gray-500 leading-relaxed mb-4">{step?.description}</p>

        <div className="flex justify-between mt-auto">
          {currentStep > 0 ? (
            <button
              onClick={handleBack}
              className="px-3.5 py-1.5 text-xs font-bold text-gray-600 hover:text-gray-800 transition-colors border border-gray-200 rounded-xl"
            >
              Atrás
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleNext}
            className="px-4 py-1.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 transition-colors rounded-xl shadow-sm"
          >
            {currentStep === steps.length - 1 ? "Finalizar" : "Siguiente"}
          </button>
        </div>
      </div>
    </div>
  );
}
