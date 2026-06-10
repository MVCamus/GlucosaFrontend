import { useAppStore } from "../../stores/appStore";
import { X, FileText, Table } from "lucide-react";
import { useGlucoseStore } from "../../stores/glucoseStore";
import { useMedicationStore } from "../../stores/medicationStore";
import { buildExportRows, exportToCsv } from "../../utils/exportCsv";

export default function ExportModal() {
  const isOpen = useAppStore((s) => s.isExportModalOpen);
  const close = useAppStore((s) => s.closeExportModal);
  const addToast = useAppStore((s) => s.addToast);
  const dailySummary = useGlucoseStore((s) => s.dailySummary);
  const medLogs = useMedicationStore((s) => s.logs);

  if (!isOpen || !dailySummary) return null;

  const handleExportCsv = () => {
    const rows = buildExportRows(
      dailySummary.glucoseReadings,
      dailySummary.insulinRecords,
      dailySummary.foodRecords,
      medLogs
    );
    exportToCsv(rows, `diabetesvet_${dailySummary.date}.csv`);
    addToast({ message: "CSV exportado correctamente", type: "success" });
    close();
  };

  const handleExportPdf = () => {
    addToast({ message: "Exportación PDF en desarrollo", type: "info" });
    close();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">Exportar reporte</h3>
          <button onClick={close} className="p-1 rounded-lg hover:bg-gray-100">
            <X size={20} className="text-gray-400" />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Selecciona el formato de exportación para {dailySummary.date}
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors"
          >
            <div className="bg-red-100 rounded-lg p-2">
              <FileText size={20} className="text-red-500" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-800">PDF</p>
              <p className="text-xs text-gray-500">Gráfico + tabla con formato</p>
            </div>
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors"
          >
            <div className="bg-green-100 rounded-lg p-2">
              <Table size={20} className="text-green-500" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-800">CSV</p>
              <p className="text-xs text-gray-500">Datos tabulares para análisis</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}