import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';

const CHILE_TZ = 'America/Santiago';

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

/**
 * Helper único para formatear fechas UTC del backend a zona Chile.
 * Reemplaza al uso directo de Intl/toLocaleDateString en toda la app.
 *
 * @param iso ISO string del backend (con Z) o Date
 * @param pattern patrón date-fns (ver https://date-fns.org/v3.6.0/docs/format)
 * @returns string formateado en es-CL / America/Santiago
 */
export function formatChile(
  iso: string | Date,
  pattern: string = 'dd/MM/yyyy HH:mm'
): string {
  const date = parseSafeUTC(iso);
  return formatInTimeZone(date, CHILE_TZ, pattern, { locale: es });
}

export function formatDate(dateStr: string): string {
  return formatChile(dateStr, "dd MMM yyyy");
}

export function formatTime(dateStr: string): string {
  return formatChile(dateStr, "HH:mm");
}

export function formatDateTime(dateStr: string): string {
  return formatChile(dateStr, "dd/MM/yyyy HH:mm");
}

function getChileNow(): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CHILE_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? '0');
  return new Date(
    get('year'), get('month') - 1, get('day'),
    get('hour') === 24 ? 0 : get('hour'), get('minute'), get('second')
  );
}

export function getTodayStr(): string {
  const d = getChileNow();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getLocalDateStr(dateInput: string | Date): string {
  return formatChile(dateInput, "yyyy-MM-dd");
}

export function daysRemaining(expiresAt: string): number {
  const now = getChileNow();
  const expires = parseSafeUTC(expiresAt);
  // Convertir fecha de expiración a zona Chile
  const expiresDateStr = formatChile(expires, 'yyyy-MM-dd');
  const [expY, expM, expD] = expiresDateStr.split('-').map(Number);
  
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const expiresMidnight = new Date(expY, expM - 1, expD).getTime();
  
  const diffMs = expiresMidnight - todayMidnight;
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

export function isOverdue(scheduledTime: string, now: Date = new Date()): boolean {
  const [hours, minutes] = scheduledTime.split(":").map(Number);
  const scheduled = new Date();
  scheduled.setHours(hours, minutes, 0, 0);
  return now.getTime() - scheduled.getTime() > 30 * 60 * 1000;
}