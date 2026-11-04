import { fromDayNumber, toDayNumber } from "./dates";
import type { DateString } from "./types";

/*
 * Things that repeat: a payday, a bill, money coming in.
 *
 * A repeating item is a first date plus "how often". This file turns that into
 * the actual dates, one by one. Nothing here knows about money or paydays; it
 * only knows about the calendar. Dates are plain days ("2026-11-13").
 *
 *  - every week / 2 weeks / 4 weeks: a fixed number of days apart (7, 14, 28).
 *  - every month: the same day of the month as the first date. If a month is
 *    too short (the 31st in April), the last day of that month is used. The
 *    day is always counted from the FIRST date, so it never drifts: a bill
 *    that starts on the 31st is on the 28th in February and back on the 31st
 *    in March.
 *  - a repeating series never goes back before its first date.
 */

export const REPEATS = ["once", "weekly", "fortnightly", "four-weekly", "monthly"] as const;
export type Repeat = (typeof REPEATS)[number];

export function isRepeat(value: unknown): value is Repeat {
  return typeof value === "string" && (REPEATS as readonly string[]).includes(value);
}

const STEP_DAYS: Record<"weekly" | "fortnightly" | "four-weekly", number> = {
  weekly: 7,
  fortnightly: 14,
  "four-weekly": 28,
};

function parts(date: DateString): { year: number; month: number; day: number } {
  toDayNumber(date); // checks it is a real day
  return {
    year: Number(date.slice(0, 4)),
    month: Number(date.slice(5, 7)),
    day: Number(date.slice(8, 10)),
  };
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function pad(value: number, width: number): string {
  return String(value).padStart(width, "0");
}

/** The date in month number `index` after the first date's month (0 = the same month). */
function monthlyDate(anchor: { year: number; month: number; day: number }, index: number): DateString {
  const total = anchor.month - 1 + index;
  const year = anchor.year + Math.floor(total / 12);
  const month = (total % 12) + 1;
  const day = Math.min(anchor.day, daysInMonth(year, month));
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
}

/** Every date in the series from `from` to `to`, both days included, earliest first. */
export function occurrencesBetween(
  anchor: DateString,
  repeat: Repeat,
  from: DateString,
  to: DateString,
): DateString[] {
  const anchorDay = toDayNumber(anchor);
  const fromDay = toDayNumber(from);
  const toDay = toDayNumber(to);
  if (toDay < fromDay || toDay < anchorDay) return [];

  if (repeat === "once") {
    return anchorDay >= fromDay && anchorDay <= toDay ? [anchor] : [];
  }

  const result: DateString[] = [];

  if (repeat === "monthly") {
    const first = parts(anchor);
    const start = parts(from);
    const monthsAway = (start.year - first.year) * 12 + (start.month - first.month);
    let index = Math.max(0, monthsAway - 1); // one month early, to be safe
    for (;;) {
      const date = monthlyDate(first, index);
      const day = toDayNumber(date);
      if (day > toDay) break;
      if (day >= fromDay) result.push(date);
      index += 1;
    }
    return result;
  }

  const step = STEP_DAYS[repeat];
  const startDay = Math.max(fromDay, anchorDay);
  const jumps = Math.ceil((startDay - anchorDay) / step);
  for (let day = anchorDay + jumps * step; day <= toDay; day += step) {
    result.push(fromDayNumber(day));
  }
  return result;
}

/**
 * The first date in the series on or after `from`.
 * A one-off whose day has gone by gives null (there is no "next" one).
 */
export function nextOccurrenceOnOrAfter(
  anchor: DateString,
  repeat: Repeat,
  from: DateString,
): DateString | null {
  const anchorDay = toDayNumber(anchor);
  const fromDay = toDayNumber(from);
  if (repeat === "once") return anchorDay >= fromDay ? anchor : null;
  if (anchorDay >= fromDay) return anchor;

  if (repeat === "monthly") {
    const first = parts(anchor);
    const start = parts(from);
    const monthsAway = (start.year - first.year) * 12 + (start.month - first.month);
    for (let index = Math.max(0, monthsAway); index <= monthsAway + 2; index++) {
      const date = monthlyDate(first, index);
      if (toDayNumber(date) >= fromDay) return date;
    }
    return null; // cannot happen: within two months there is always one
  }

  const step = STEP_DAYS[repeat];
  const jumps = Math.ceil((fromDay - anchorDay) / step);
  return fromDayNumber(anchorDay + jumps * step);
}
