import { useAppStore } from "../stores/appStore";
import { FileBarChart, FileText, Table } from "lucide-react";
import ExportModal from "../components/dashboard/ExportModal";

export default function ReportsPage() {
  const openExportModal = useAppStore((s) => s.openExportModal);

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-2 mb-6">
        <FileBarChart size={20} className="text-orange-500" />
        <h2 className="text-lg font-bold text-gray-800">Reportes</h2>
      </div>

      <div className="space-y-4">
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-orange-100 rounded-full p-2">
              <FileText size={20} className="text-orange-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Reporte PDF</h3>
              <p className="text-xs text-gray-500">Gráfico + tabla con formato</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            Genera un documento PDF con el gráfico de glucosa y la tabla de registros para compartir con el veterinario.
          </p>
          <button
            onClick={openExportModal}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl transition-colors"
          >
            Exportar
          </button>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-green-100 rounded-full p-2">
              <Table size={20} className="text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Datos CSV</h3>
              <p className="text-xs text-gray-500">Datos tabulares para análisis</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            Descarga un archivo CSV con todos los registros de glucosa, insulina, comida y remedios para análisis detallado.
          </p>
          <button
            onClick={openExportModal}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 rounded-xl transition-colors"
          >
            Exportar
          </button>
        </div>
      </div>

      <ExportModal />
    </div>
  );
}