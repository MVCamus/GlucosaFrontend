export interface InsulinRecord {
  id: string;
  timestamp: string;
  units: number;
  insulinType: string;
  caregiverId: string;
  caregiverName: string;
  notes?: string;
}

export type InsulinType = string;

export const INSULIN_TYPE_LABELS: Record<string, string> = {
  insulatard: "Insulatard (NPH)",
  glargine: "Glargina (Lantus)",
  detemir: "Detemir (Levemir)",
  NPH: "NPH",
  regular: "Regular",
};

export function getInsulinLabel(type: string): string {
  return INSULIN_TYPE_LABELS[type] || type;
}
