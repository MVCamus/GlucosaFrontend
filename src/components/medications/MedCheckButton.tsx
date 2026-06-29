import { useState, useRef, useEffect } from "react";
import { Check, AlertCircle } from "lucide-react";
import type { MedSlotStatus } from "../../types/medication";

interface Props {
  status: MedSlotStatus;
  onMark: () => void;
  onUnmark: () => void;
}

export default function MedCheckButton({ status, onMark, onUnmark }: Props) {
  const [isUnmarking, setIsUnmarking] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = () => {
    if (status === "given") return;
    onMark();
  };

  const handleLongPressStart = () => {
    if (status !== "given") return;
    setIsUnmarking(true);
    timerRef.current = setTimeout(() => {
      onUnmark();
      setIsUnmarking(false);
    }, 1000);
  };

  const handleLongPressEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsUnmarking(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const baseClass = "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 select-none";

  if (status === "given") {
    return (
      <button
        className={`${baseClass} bg-green-500 text-white ${isUnmarking ? "scale-110 ring-2 ring-red-400" : ""}`}
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressEnd}
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressEnd}
        title="Mantener presionado para desmarcar"
      >
        <Check size={18} strokeWidth={3} />
      </button>
    );
  }

  if (status === "overdue") {
    return (
      <button onClick={handleClick} className={`${baseClass} bg-amber-100 border-2 border-amber-400 text-amber-500`}>
        <AlertCircle size={18} />
      </button>
    );
  }

  return (
    <button onClick={handleClick} className={`${baseClass} bg-gray-100 border-2 border-gray-300 text-gray-400 hover:border-orange-400 hover:text-orange-400`}>
      <span className="text-xs font-bold">{""}</span>
    </button>
  );
}