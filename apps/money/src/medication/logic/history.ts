/*
 * The history calendar (Stage 4): a quiet record of which days were ticked.
 * No streaks, no scores, never red. Just "all", "some", or "none logged".
 */

import { dayKey, dosesFor, type Dose, type MedicationData } from "./medicines";

export type DayMark = "all" | "some" | "none" | "empty" | "future";

/** How a day looks: all ticked, some, none logged, nothing to take that day, or still to come. */
export function dayMark(data: MedicationData, date: Date, today: Date): DayMark {
  if (dayKey(date) > dayKey(today)) return "future";
  const doses = dosesFor(data, date);
  if (doses.length === 0) return "empty";
  const ticked = doses.filter((d) => d.taken).length;
  if (ticked === doses.length) return "all";
  return ticked > 0 ? "some" : "none";
}

/** The days of a month laid out Monday first, with blanks before the 1st. */
export function monthGrid(year: number, month: number): Array<Date | null> {
  const first = new Date(year, month, 1);
  const blanks = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const grid: Array<Date | null> = Array.from({ length: blanks }, () => null);
  for (let d = 1; d <= days; d += 1) grid.push(new Date(year, month, d));
  return grid;
}

/** What was due on a day, and whether each was ticked. */
export function dayDetail(data: MedicationData, date: Date): Dose[] {
  return dosesFor(data, date);
}

/** The earliest month worth showing: when the first medicine was added. */
export function firstMonth(data: MedicationData, today: Date): { year: number; month: number } {
  const days = data.medicines.map((m) => m.added).concat(Object.keys(data.taken)).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
  const earliest = days.sort()[0];
  if (!earliest) return { year: today.getFullYear(), month: today.getMonth() };
  return { year: Number(earliest.slice(0, 4)), month: Number(earliest.slice(5, 7)) - 1 };
}
