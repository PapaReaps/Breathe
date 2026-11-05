import type { CalculatorInput, DateString, Pence } from "./types";

/*
 * "Coming up": the days that matter from today until your money comes in.
 * Only bills and money you're sure of are shown. Money that might come is left off,
 * as it is in the number: once it really arrives, it can be added under Money coming in.
 */

export type ComingUpItem =
  | { kind: "bill"; id: string; name: string; amount: Pence }
  | { kind: "income"; id: string; name: string; amount: Pence }
  | { kind: "money-day" };

export interface ComingUpDay {
  date: DateString;
  items: ComingUpItem[];
}

export interface ComingUp {
  today: DateString;
  /** The day the main money comes in (after any weekend or bank holiday move). */
  moneyDay: DateString;
  /** Only the days with something on them, in date order. Money day is always last. */
  days: ComingUpDay[];
  billCount: number;
  billTotal: Pence;
}

export function comingUp(input: CalculatorInput, moneyDay: DateString): ComingUp {
  const today = input.today;
  const byDate = new Map<DateString, ComingUpItem[]>();
  const add = (date: DateString, item: ComingUpItem) => {
    const list = byDate.get(date) ?? [];
    list.push(item);
    byDate.set(date, list);
  };

  let billCount = 0;
  let billTotal = 0;
  for (const bill of input.bills) {
    // Already gone from the balance, or before today: nothing to look out for.
    if (bill.alreadyInBalance === true || bill.dueDate < today || bill.dueDate > moneyDay) continue;
    add(bill.dueDate, { kind: "bill", id: bill.id, name: bill.name, amount: bill.amount });
    billCount += 1;
    billTotal += bill.amount;
  }
  for (const item of input.income) {
    if (item.reliability !== "reliable" || item.alreadyInBalance === true) continue;
    if (item.date < today || item.date >= moneyDay) continue;
    add(item.date, { kind: "income", id: item.id, name: item.name, amount: item.amount });
  }
  add(moneyDay, { kind: "money-day" });

  const days = [...byDate.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, items]) => ({
      date,
      // On money day itself, show any bills first and the money last.
      items: [...items].sort((x, y) => Number(x.kind === "money-day") - Number(y.kind === "money-day")),
    }));
  return { today, moneyDay, days, billCount, billTotal };
}

/** The months to draw for the month view: from today's month to money day's month. */
export function monthsBetween(from: DateString, to: DateString): Array<{ year: number; month: number }> {
  const months: Array<{ year: number; month: number }> = [];
  let year = Number(from.slice(0, 4));
  let month = Number(from.slice(5, 7));
  const endYear = Number(to.slice(0, 4));
  const endMonth = Number(to.slice(5, 7));
  while ((year < endYear || (year === endYear && month <= endMonth)) && months.length < 3) {
    months.push({ year, month });
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return months;
}

/** The days of one month as dates, with blanks first so Monday is the first column. */
export function monthGrid(year: number, month: number): Array<DateString | null> {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const blanks = (first.getUTCDay() + 6) % 7;
  const length = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: Array<DateString | null> = Array.from({ length: blanks }, () => null);
  for (let day = 1; day <= length; day++) {
    cells.push(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  }
  return cells;
}
