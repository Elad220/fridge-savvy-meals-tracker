import { format } from 'date-fns';
import { MealPlan } from '@/types';

/**
 * Generate an ICS (iCalendar) file content for a meal plan so that it can be
 * imported into any calendar application (Google, Apple, Outlook …).
 *
 * If `destinationTime` is provided we create a timed event (1 h duration).
 * Otherwise, an all-day event is generated for `plannedDate`.
 *
 * The function returns **undefined** when neither a date nor time is available.
 */
export function generateMealPlanICS(meal: MealPlan): string | undefined {
  const { name, notes, plannedDate, destinationTime, id } = meal;

  // We need at least a date to create an event.
  if (!plannedDate && !destinationTime) {
    return undefined;
  }

  // Choose start date-time.
  const start = destinationTime ?? plannedDate!;

  // End = +1 hour for timed events or same day for all-day.
  const end = destinationTime
    ? new Date(start.getTime() + 60 * 60 * 1000)
    : undefined;

  // Helper to format as YYYYMMDD or YYYYMMDDTHHmmss (floating – no TZ).
  const fmtDate = (d: Date, includeTime = false) =>
    includeTime
      ? format(d, "yyyyMMdd'T'HHmmss")
      : format(d, 'yyyyMMdd');

  const dtStamp = format(new Date(), "yyyyMMdd'T'HHmmss'Z'");
  const uid = id ?? `${Date.now()}@mealplan`;

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MealPlanner//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `SUMMARY:${name}`,
  ];

  if (notes) {
    // Escape commas and semicolons per RFC 5545.
    lines.push(`DESCRIPTION:${notes.replace(/[,;]/g, '\\$&')}`);
  }

  if (destinationTime) {
    lines.push(`DTSTART:${fmtDate(start, true)}`);
    lines.push(`DTEND:${fmtDate(end!, true)}`);
  } else if (plannedDate) {
    lines.push(`DTSTART;VALUE=DATE:${fmtDate(plannedDate)}`);
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.join('\r\n');
}