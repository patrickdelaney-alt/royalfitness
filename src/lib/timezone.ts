/**
 * Timezone utilities for converting between user-local dates and UTC.
 * Uses native Intl APIs — no external dependencies.
 */

const DEFAULT_TZ = "America/New_York";

/** Validate an IANA timezone string; falls back to America/New_York. */
export function safeTimeZone(tz: string | null | undefined): string {
  if (!tz) return DEFAULT_TZ;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return tz;
  } catch {
    return DEFAULT_TZ;
  }
}

/** Get today's date as "YYYY-MM-DD" in the given timezone. */
export function getUserToday(timeZone: string): string {
  return new Date().toLocaleDateString("en-CA", { timeZone });
}

/**
 * Get the UTC offset in milliseconds for a timezone at a given date.
 * Uses noon UTC as reference to avoid DST transition edge cases.
 */
export function getOffsetMs(dateStr: string, timeZone: string): number {
  const ref = new Date(dateStr + "T12:00:00Z");
  const utcStr = ref.toLocaleString("en-US", { timeZone: "UTC" });
  const tzStr = ref.toLocaleString("en-US", { timeZone });
  return new Date(tzStr).getTime() - new Date(utcStr).getTime();
}

/**
 * Convert "YYYY-MM-DD" midnight in the user's timezone to a UTC Date.
 * Example: "2026-03-03" in America/New_York (UTC-5) -> 2026-03-03T05:00:00Z
 */
export function midnightInTzToUTC(dateStr: string, timeZone: string): Date {
  const offset = getOffsetMs(dateStr, timeZone);
  return new Date(new Date(dateStr + "T00:00:00Z").getTime() - offset);
}

/** Convert a UTC Date to "YYYY-MM-DD" in the user's timezone. */
export function utcToLocalDateStr(utcDate: Date, timeZone: string): string {
  return utcDate.toLocaleDateString("en-CA", { timeZone });
}

/** Get abbreviated day name (Mon, Tue, ...) for a "YYYY-MM-DD" in the given timezone. */
export function getDayName(dateStr: string, timeZone: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone }).format(d);
}

/** Get the Monday of the ISO week containing the given date. Returns "YYYY-MM-DD". */
export function getMonday(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  const dow = d.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = dow === 0 ? 6 : dow - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}

/** Get 7 date strings (Mon-Sun) for the calendar week containing the given date. */
export function getWeekDays(dateStr: string): string[] {
  const monday = getMonday(dateStr);
  const base = new Date(monday + "T12:00:00Z");
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(base.getTime() + i * 86400000);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

/** Get the first day of the month. Returns "YYYY-MM-01". */
export function getMonthStart(dateStr: string): string {
  return dateStr.slice(0, 7) + "-01";
}

/** Get the first day of the year. Returns "YYYY-01-01". */
export function getYearStart(dateStr: string): string {
  return dateStr.slice(0, 4) + "-01-01";
}

/** Add N days to a "YYYY-MM-DD" string. Returns "YYYY-MM-DD". */
export function addDaysToDateStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
