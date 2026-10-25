import { describe, it, expect } from 'vitest';
import {
  generateRecurringIcs,
  generateGoogleCalendarUrl,
  generateSingleEventIcs,
  escapeIcsText,
} from './ics';

describe('ics utilities (Issue #403)', () => {
  it('generates valid RFC 5545 recurring iCalendar content', () => {
    const ics = generateRecurringIcs({
      title: 'Hamplard Tailoring Study 🧵',
      description: 'Practice sewing machine techniques.',
      days: ['Mon', 'Wed', 'Fri'],
      time: '18:30',
      durationMinutes: 60,
    });

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('PRODID:-//Hamplard//Study Reminder//EN');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR');
    expect(ics).toContain('SUMMARY:Hamplard Tailoring Study 🧵');
    expect(ics).toContain('DESCRIPTION:Practice sewing machine techniques.');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('throws an error if no days are selected', () => {
    expect(() =>
      generateRecurringIcs({
        days: [],
        time: '09:00',
      }),
    ).toThrow('At least one day must be selected');
  });

  it('generates a valid Google Calendar quick-add URL with recurring parameters', () => {
    const url = generateGoogleCalendarUrl({
      title: 'Pastry Baking Study 🧁',
      description: 'Review sourdough proofing lessons',
      days: ['Tue', 'Thu'],
      time: '10:00',
    });

    expect(url).toContain('https://calendar.google.com/calendar/render?');
    expect(url).toContain('action=TEMPLATE');
    expect(url).toContain('text=Pastry+Baking+Study+%F0%9F%A7%81');
    expect(url).toContain('recur=RRULE%3AFREQ%3DWEEKLY%3BBYDAY%3DTU%2CTH');
  });

  it('generates single event ics for live sessions', () => {
    const start = new Date('2026-11-01T15:00:00Z');
    const ics = generateSingleEventIcs({
      title: 'Live Masterclass: Wedding Cake Decorating',
      description: 'Live Q&A and demo with Chef Amara.',
      startDate: start,
      durationMinutes: 90,
      location: 'Hamplard Studio 1',
    });

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('SUMMARY:Live Masterclass: Wedding Cake Decorating');
    expect(ics).toContain('LOCATION:Hamplard Studio 1');
    expect(ics).toContain('DTSTART:20261101T150000Z');
    expect(ics).toContain('DTEND:20261101T163000Z');
  });

  it('escapes special characters for iCalendar compliance', () => {
    const unescaped = 'Line 1\nLine 2, with; semicolons\\and backslashes';
    const escaped = escapeIcsText(unescaped);

    expect(escaped).toBe('Line 1\\nLine 2\\, with\\; semicolons\\\\and backslashes');
  });
});
