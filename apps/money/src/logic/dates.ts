import { InvalidInputError } from "./errors";
import type { DateString } from "./types";

/*
 * Dates are plain calendar days ("2026-11-04"), never clock times.
 * That avoids time zones and daylight-saving surprises completely.
 * Internally a day is counted as a whole number of days since 1 Jan 1970.
 */

const MS_PER_DAY = 86_400_000;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MAX_SEARCH_DAYS = 400;

export function toDayNumber(date: DateString): number {
  const match = DATE_PATTERN.exec(date);
  if (!match) {
    throw new InvalidInputError(`"${date}" is not a date written as YYYY-MM-DD.`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const ms = Date.UTC(year, month - 1, day);
  const check = new Date(ms);
  const real =
    year >= 1000 &&
    check.getUTCFullYear() === year &&
    check.getUTCMonth() === month - 1 &&
    check.getUTCDate() === day;
  if (!real) {
    throw new InvalidInputError(`"${date}" is not a real calendar date.`);
  }
  return ms / MS_PER_DAY;
}

export function fromDayNumber(dayNumber: number): DateString {
  return new Date(dayNumber * MS_PER_DAY).toISOString().slice(0, 10);
}

export function addDays(date: DateString, days: number): DateString {
  return fromDayNumber(toDayNumber(date) + days);
}

/** How many days from `from` to `to`. Negative if `to` is earlier. */
export function daysBetween(from: DateString, to: DateString): number {
  return toDayNumber(to) - toDayNumber(from);
}

/** 0 = Sunday ... 6 = Saturday. */
export function dayOfWeek(date: DateString): number {
  return new Date(toDayNumber(date) * MS_PER_DAY).getUTCDay();
}

export function isWorkingDay(date: DateString, nonWorkingDays: ReadonlySet<DateString>): boolean {
  const weekday = dayOfWeek(date);
  return weekday !== 0 && weekday !== 6 && !nonWorkingDays.has(date);
}

/** The date itself if it is a working day, otherwise the next working day. */
export function onOrAfterWorkingDay(
  date: DateString,
  nonWorkingDays: ReadonlySet<DateString>,
): DateString {
  let current = date;
  for (let i = 0; i <= MAX_SEARCH_DAYS; i++) {
    if (isWorkingDay(current, nonWorkingDays)) return current;
    current = addDays(current, 1);
  }
  throw new InvalidInputError("Could not find a working day after " + date + ".");
}

/** The date itself if it is a working day, otherwise the working day before. */
export function onOrBeforeWorkingDay(
  date: DateString,
  nonWorkingDays: ReadonlySet<DateString>,
): DateString {
  let current = date;
  for (let i = 0; i <= MAX_SEARCH_DAYS; i++) {
    if (isWorkingDay(current, nonWorkingDays)) return current;
    current = addDays(current, -1);
  }
  throw new InvalidInputError("Could not find a working day before " + date + ".");
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "Friday 13 November". Written out by hand so it reads the same on every device. */
export function formatDayLong(date: DateString): string {
  const weekday = DAY_NAMES[dayOfWeek(date)] ?? "";
  const day = Number(date.slice(8, 10));
  const month = MONTH_NAMES[Number(date.slice(5, 7)) - 1] ?? "";
  return `${weekday} ${day} ${month}`;
}

/** "Saturday", "Sunday" and so on. */
export function weekdayName(date: DateString): string {
  return DAY_NAMES[dayOfWeek(date)] ?? "";
}

/** "Fri 13 Nov": short enough for a list on a phone. */
export function formatDayShort(date: DateString): string {
  const weekday = (DAY_NAMES[dayOfWeek(date)] ?? "").slice(0, 3);
  const day = Number(date.slice(8, 10));
  const month = (MONTH_NAMES[Number(date.slice(5, 7)) - 1] ?? "").slice(0, 3);
  return `${weekday} ${day} ${month}`;
}
