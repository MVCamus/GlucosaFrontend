function parseSafeUTC(dateInput: string | Date): Date {
  if (dateInput instanceof Date) return dateInput;
  const dateStr = String(dateInput);
  // Si ya tiene zona horaria (Z, +, o -HH:MM), usar tal cual
  if (dateStr.endsWith('Z') || dateStr.includes('+') || dateStr.match(/-\d{2}:?\d{2}$/)) {
    return new Date(dateStr);
  }
  // Si es solo fecha (YYYY-MM-DD), tratar como fecha local medianoche
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  // Si tiene T pero sin zona, asumir hora local
  if (dateStr.includes('T')) {
    const [datePart, timePart] = dateStr.split('T');
    const [y, m, d] = datePart.split('-').map(Number);
    const [h, min, sec] = timePart.split(':').map(Number);
    return new Date(y, m - 1, d, h || 0, min || 0, sec || 0);
  }
  return new Date(dateStr);
}

export function formatDate(dateStr: string): string {
  const d = parseSafeUTC(dateStr);
  return d.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(dateStr: string): string {
  const d = parseSafeUTC(dateStr);
  return d.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(dateStr: string): string {
  return `${formatDate(dateStr)} ${formatTime(dateStr)}`;
}

export function getTodayStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getLocalDateStr(dateInput: string | Date): string {
  const d = parseSafeUTC(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function daysRemaining(expiresAt: string): number {
  const now = new Date();
  const expires = parseSafeUTC(expiresAt);
  const diffMs = expires.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function isOverdue(scheduledTime: string, now: Date = new Date()): boolean {
  const [hours, minutes] = scheduledTime.split(":").map(Number);
  const scheduled = new Date();
  scheduled.setHours(hours, minutes, 0, 0);
  return now.getTime() - scheduled.getTime() > 30 * 60 * 1000;
}
