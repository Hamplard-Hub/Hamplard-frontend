/**
 * iCalendar (.ics) generation and calendar quick-add utilities.
 * Conforms to RFC 5545 specification for recurring calendar events.
 */

export const DAY_TO_ICS_MAP: Record<string, string> = {
  Sun: 'SU',
  Mon: 'MO',
  Tue: 'TU',
  Wed: 'WE',
  Thu: 'TH',
  Fri: 'FR',
  Sat: 'SA',
};

export interface StudyReminderIcsOptions {
  title?: string;
  description?: string;
  days: ('Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat')[];
  time: string; // "HH:mm" 24-hour format
  durationMinutes?: number;
}

/** Formats a Date object to iCalendar UTC string format: YYYYMMDDTHHMMSSZ */
function formatIcsDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/** Formats a Date object to local iCalendar string format: YYYYMMDDTHHMMSS */
function formatIcsLocalDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/** Escapes special characters for iCalendar text fields (newlines, commas, semicolons, backslashes) */
export function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\n|\r/g, '\\n');
}

/**
 * Finds the next upcoming date matching one of the specified days of the week, starting today.
 */
function getFirstOccurrenceDate(
  days: ('Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat')[],
  time: string,
): Date {
  const [hStr, mStr] = time.split(':');
  const hours = parseInt(hStr || '9', 10);
  const minutes = parseInt(mStr || '0', 10);

  const dayNames: ('Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat')[] = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
  ];

  const now = new Date();
  for (let offset = 0; offset < 7; offset++) {
    const candidate = new Date(now);
    candidate.setDate(now.getDate() + offset);
    candidate.setHours(hours, minutes, 0, 0);

    const candidateDay = dayNames[candidate.getDay()];
    if (days.includes(candidateDay)) {
      return candidate;
    }
  }

  // Fallback to today at specified time
  const fallback = new Date(now);
  fallback.setHours(hours, minutes, 0, 0);
  return fallback;
}

/**
 * Generates an RFC 5545 compliant .ics string for a recurring study reminder.
 */
export function generateRecurringIcs(options: StudyReminderIcsOptions): string {
  const {
    title = 'Hamplard Study Reminder 🎓',
    description = 'Time to learn! Open Hamplard and continue your practical skills course: https://hamplard.com',
    days,
    time,
    durationMinutes = 45,
  } = options;

  if (days.length === 0) {
    throw new Error('At least one day must be selected to generate a reminder.');
  }

  const dtStamp = formatIcsDate(new Date());
  const startDate = getFirstOccurrenceDate(days, time);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  const dtStart = formatIcsLocalDate(startDate);
  const dtEnd = formatIcsLocalDate(endDate);

  const byDays = days
    .map((d) => DAY_TO_ICS_MAP[d])
    .filter(Boolean)
    .join(',');

  const uid = `hamplard-study-reminder-${Date.now()}@hamplard.com`;

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Hamplard//Study Reminder//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `RRULE:FREQ=WEEKLY;BYDAY=${byDays}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Hamplard study session starting',
    'TRIGGER:-PT10M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return icsLines.join('\r\n');
}

/**
 * Generates a Google Calendar quick-add URL for a recurring study reminder.
 */
export function generateGoogleCalendarUrl(options: StudyReminderIcsOptions): string {
  const {
    title = 'Hamplard Study Reminder 🎓',
    description = 'Time to learn! Open Hamplard and continue your practical skills course: https://hamplard.com',
    days,
    time,
    durationMinutes = 45,
  } = options;

  const startDate = getFirstOccurrenceDate(days, time);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  const startUtc = formatIcsDate(startDate);
  const endUtc = formatIcsDate(endDate);

  const byDays = days
    .map((d) => DAY_TO_ICS_MAP[d])
    .filter(Boolean)
    .join(',');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startUtc}/${endUtc}`,
    details: description,
    recur: `RRULE:FREQ=WEEKLY;BYDAY=${byDays}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates an .ics string for a single event (e.g., a Live Session).
 */
export function generateSingleEventIcs(options: {
  title: string;
  description: string;
  startDate: Date;
  durationMinutes?: number;
  location?: string;
}): string {
  const { title, description, startDate, durationMinutes = 60, location = 'Hamplard Live Room' } = options;
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  const dtStamp = formatIcsDate(new Date());
  const dtStart = formatIcsDate(startDate);
  const dtEnd = formatIcsDate(endDate);
  const uid = `hamplard-live-${startDate.getTime()}-${Math.random().toString(36).slice(2, 9)}@hamplard.com`;

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Hamplard//Live Session//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(location)}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Live session starting soon',
    'TRIGGER:-PT15M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return icsLines.join('\r\n');
}

/**
 * Generates a Google Calendar quick-add URL for a single event.
 */
export function generateGoogleCalendarUrlForSingleEvent(options: {
  title: string;
  description: string;
  startDate: Date;
  durationMinutes?: number;
  location?: string;
}): string {
  const { title, description, startDate, durationMinutes = 60, location = 'Hamplard Live' } = options;
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
  const startUtc = formatIcsDate(startDate);
  const endUtc = formatIcsDate(endDate);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startUtc}/${endUtc}`,
    details: description,
    location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Triggers a browser download of an .ics file with the specified content.
 */
export function downloadIcsFile(filename: string, content: string): void {
  if (typeof window === 'undefined') return;

  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.ics') ? filename : `${filename}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
