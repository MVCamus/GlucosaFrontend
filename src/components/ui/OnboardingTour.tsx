import { useState, useEffect } from "react";
import { useAppStore } from "../../stores/appStore";

interface Step {
  selector: string;
  title: string;
  description: string;
  placement: "top" | "bottom";
}

const steps: Step[] = [
  {
    selector: "#tour-header",
    title: "Panel del Cuidador 👤",
    description: "Aquí puedes ver quién tiene la sesión activa y alternar la fecha de los registros que deseas visualizar.",
    placement: "bottom",
  },
  {
    selector: "#tour-sensor-banner",
    title: "Estado del Sensor CGM 🔋",
    description: "Monitorea si el sensor continuo de glucosa está activo y cuántos días útiles le quedan antes de expirar.",
    placement: "bottom",
  },
  {
    selector: "#tour-glucose-chart",
    title: "Curva de Glucosa 📈",
    description: "Visualiza la curva de glucemia de tu mascota durante las últimas 24 horas y los rangos objetivos configurados.",
    placement: "top",
  },
  {
    selector: "#tour-event-summary",
    title: "Eventos del Día 🍖",
    description: "Revisa las dosis de insulina administradas y la comida ingerida, junto al valor de glucosa que tenía tu mascota en ese momento.",
    placement: "top",
  },
  {
    selector: "#tour-bottom-nav",
    title: "Barra de Navegación 📱",
    description: "Registra comidas y dosis de insulina, consulta la lista de remedios, revisa el historial completo y analiza reportes detallados.",
    placement: "top",
  },
  {
    selector: "#tour-settings-button",
    title: "Ajustes y Límites ⚙️",
    description: "Haz clic aquí para cambiar los rangos límites de glucemia de tu mascota (mínimo/máximo), agregar cuidadores, o reiniciar este tutorial.",
    placement: "bottom",
  },
];

export default function OnboardingTour() {
  const onboardingCompleted = useAppStore((s) => s.onboardingCompleted);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  const [currentStep, setCurrentStep] = useState(0);
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (onboardingCompleted) return;

    const updatePosition = () => {
      const step = steps[currentStep];
      const element = document.querySelector(step.selector);

      if (!element) {
        // Fallback fallback if element isn't found
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

      // Scroll element into view smoothly
      element.scrollIntoView({ behavior: "smooth", block: "center" });

      const rect = element.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      const padding = 8;

      setHighlightStyle({
        position: "absolute",
        top: rect.top + scrollY - padding,
        left: rect.left + scrollX - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
        boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.75)",
        borderRadius: "12px",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        zIndex: 99998,
        pointerEvents: "none",
      });

      // Calculate tooltip position
      const tooltipWidth = Math.min(320, window.innerWidth - 32);
      const estimatedHeight = 185;
      let top = rect.bottom + scrollY + 16;
      let left = rect.left + scrollX + (rect.width - tooltipWidth) / 2;

      // Adjust for placements
      if (step.placement === "top") {
        top = rect.top + scrollY - estimatedHeight - 16;
      }

      // Check if it goes off the bottom of the screen (e.g. covered by bottom nav)
      // Bottom nav is at window.innerHeight + scrollY. It occupies ~80px.
      const maxTop = window.innerHeight + scrollY - estimatedHeight - 95; // 95px safety margin
      if (top > maxTop) {
        // If it goes too low, try placing it above the element
        top = rect.top + scrollY - estimatedHeight - 16;
      }

      // Keep tooltip within top/vertical bounds
      const margin = 16;
      if (top < scrollY + margin) {
        // If it is too high, place it below the element
        top = rect.bottom + scrollY + 16;
        
        // If it still goes off the bottom, force it to be at the top of the viewport
        if (top > maxTop) {
          top = scrollY + margin + 10;
        }
      }

      // Keep tooltip within horizontal bounds
      left = Math.max(margin, Math.min(left, window.innerWidth - tooltipWidth - margin));

      setTooltipStyle({
        position: "absolute",
        top,
        left,
        width: `${tooltipWidth}px`,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        zIndex: 99999,
      });
    };

    // Delay measurement slightly to allow scrollIntoView to complete
    const timer = setTimeout(updatePosition, 250);

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
      completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((c) => c - 1);
    }
  };

  return (
    <div className="absolute top-0 left-0 w-full min-h-full overflow-hidden pointer-events-auto z-[99997]">
      {/* Background overlay blocker intercepting all clicks outside tooltip */}
      <div className="fixed inset-0 z-[99996] pointer-events-auto bg-transparent" />

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
            onClick={completeOnboarding}
            className="text-xs text-gray-400 hover:text-gray-600 font-semibold"
          >
            Omitir
          </button>
        </div>

        <h3 className="text-base font-bold text-gray-800 mb-1.5">{step.title}</h3>
        <p className="text-xs text-gray-500 leading-relaxed mb-4">{step.description}</p>

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
