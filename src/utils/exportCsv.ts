import type { GlucoseReading } from "../types/glucose";
import { type InsulinRecord } from "../types/insulin";
import type { FoodRecord } from "../types/food";
import type { MedicationLog } from "../types/medication";
import { formatChile } from "./date";

export interface ExportRow {
  fecha: string;
  hora: string;
  tipo: string;
  valor: string;
  cuidador: string;
}

export function buildExportRows(
  glucose: GlucoseReading[],
  insulin: InsulinRecord[],
  food: FoodRecord[],
  medLogs: MedicationLog[]
): ExportRow[] {
  const rows: ExportRow[] = [];

  glucose.forEach((r) => {
    rows.push({
      fecha: formatChile(r.timestamp, "dd/MM/yyyy"),
      hora: formatChile(r.timestamp, "HH:mm"),
      tipo: "Glucosa",
      valor: `${r.value} ${r.unit}`,
      cuidador: "Sensor",
    });
  });

  insulin.forEach((r) => {
    rows.push({
      fecha: formatChile(r.timestamp, "dd/MM/yyyy"),
      hora: formatChile(r.timestamp, "HH:mm"),
      tipo: `Insulina (${r.insulinType})`,
      valor: `${r.units} U`,
      cuidador: r.caregiverName,
    });
  });

  food.forEach((r) => {
    rows.push({
      fecha: formatChile(r.timestamp, "dd/MM/yyyy"),
      hora: formatChile(r.timestamp, "HH:mm"),
      tipo: `Comida (${r.foodType})`,
      valor: r.quantity,
      cuidador: r.caregiverName,
    });
  });

  medLogs.forEach((r) => {
    rows.push({
      fecha: formatChile(r.givenAt, "dd/MM/yyyy"),
      hora: formatChile(r.givenAt, "HH:mm"),
      tipo: `Remedio (${r.medicationName})`,
      valor: r.scheduledTime,
      cuidador: r.caregiverName,
    });
  });

  rows.sort((a, b) => a.hora.localeCompare(b.hora));
  return rows;
}

export function exportToCsv(rows: ExportRow[], filename: string): void {
  const headers = "Fecha,Hora,Tipo,Valor,Cuidador";
  const csvContent = [
    headers,
    ...rows.map((r) => `${r.fecha},${r.hora},${r.tipo},"${r.valor}",${r.cuidador}`),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.click();
  URL.revokeObjectURL(url);
}