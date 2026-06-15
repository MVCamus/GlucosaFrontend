function parseSafeUTC(dateInput: string | Date): Date {
  if (dateInput instanceof Date) return dateInput;
  let dateStr = String(dateInput);
  if (!dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.match(/-\d{2}:?\d{2}$/)) {
    dateStr = dateStr.replace(' ', 'T');
    if (dateStr.includes('T')) {
      dateStr = dateStr + 'Z';
    }
  }
  return new Date(dateStr);
}

export function formatDate(dateStr: string): string {
  return parseSafeUTC(dateStr).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(dateStr: string): string {
  return parseSafeUTC(dateStr).toLocaleTimeString("es-CL", {
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