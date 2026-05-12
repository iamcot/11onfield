import { format as dateFnsFormat, parseISO } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { vi } from 'date-fns/locale';

// Application timezone
export const APP_TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Format a date string or Date object to Vietnam timezone
 * @param date - Date string (ISO format) or Date object
 * @param formatStr - date-fns format string (default: 'dd/MM/yyyy HH:mm')
 * @returns Formatted date string in Vietnam timezone
 */
export function formatDate(
  date: string | Date,
  formatStr: string = 'dd/MM/yyyy HH:mm'
): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatInTimeZone(dateObj, APP_TIMEZONE, formatStr, { locale: vi });
  } catch (error) {
    console.error('Error formatting date:', error);
    return typeof date === 'string' ? date : date.toString();
  }
}

/**
 * Format a date with custom format in Vietnam timezone
 * @param date - Date string (ISO format) or Date object
 * @param formatStr - date-fns format string
 * @returns Formatted date string
 */
export function formatDateCustom(
  date: string | Date,
  formatStr: string
): string {
  return formatDate(date, formatStr);
}

/**
 * Format date for display (dd/MM/yyyy)
 * @param date - Date string (ISO format) or Date object
 * @returns Formatted date string
 */
export function formatDateOnly(date: string | Date): string {
  return formatDate(date, 'dd/MM/yyyy');
}

/**
 * Format time for display (HH:mm)
 * @param date - Date string (ISO format) or Date object
 * @returns Formatted time string
 */
export function formatTimeOnly(date: string | Date): string {
  return formatDate(date, 'HH:mm');
}

/**
 * Format datetime for display (dd/MM/yyyy HH:mm)
 * @param date - Date string (ISO format) or Date object
 * @returns Formatted datetime string
 */
export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
}

/**
 * Convert a date to Vietnam timezone
 * @param date - Date string (ISO format) or Date object
 * @returns Date object in Vietnam timezone
 */
export function toVietnamTime(date: string | Date): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return toZonedTime(dateObj, APP_TIMEZONE);
}

/**
 * Get current time in Vietnam timezone
 * @returns Date object representing current time in Vietnam timezone
 */
export function getCurrentVietnamTime(): Date {
  return toZonedTime(new Date(), APP_TIMEZONE);
}
