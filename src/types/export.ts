export type ExportFormat = "pdf" | "csv";

export interface ExportOptions {
  format: ExportFormat;
  dateRange: { start: string; end: string };
  includeChart: boolean;
  includeTable: boolean;
}