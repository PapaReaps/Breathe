import { words } from "../content/words";
import { formatDayShort } from "./dates";
import type { BillRow, IncomeRow } from "./form";
import { formatMoney, parseMoney } from "./money";
import { isRepeat } from "./repeat";
import type { Repeat } from "./repeat";

/*
 * One short line for each bill or item of money coming in, so a long list stays easy to scan.
 * Pure text work: nothing here touches the screen.
 */

export interface RowSummary {
  title: string;
  detail: string;
  /** True when something is still missing (the detail then says what). */
  unfinished: boolean;
}

function amountText(amount: string): { text: string; ok: boolean } {
  if (amount.trim() === "") return { text: words.rows.noAmount, ok: false };
  const parsed = parseMoney(amount);
  return parsed.ok ? { text: formatMoney(parsed.pence), ok: true } : { text: amount.trim(), ok: false };
}

function dateText(date: string): { text: string; ok: boolean } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { text: words.rows.noDate, ok: false };
  return { text: formatDayShort(date), ok: true };
}

/** "£100.00 · Fri 13 Nov", or "£100.00 · every month from Fri 13 Nov" for one that repeats. */
function whenText(repeat: Repeat, date: { text: string; ok: boolean }): string {
  if (repeat === "once") return date.text;
  const every = words.rows.every[repeat];
  return date.ok ? `${every} from ${date.text}` : `${every} \u00b7 ${date.text}`;
}

function repeatOf(value: unknown): Repeat {
  return isRepeat(value) ? value : "once";
}

export function summariseBill(row: BillRow): RowSummary {
  const amount = amountText(row.amount);
  const date = dateText(row.dueDate);
  return {
    title: row.name.trim() === "" ? words.rows.unnamedBill : row.name.trim(),
    detail: `${amount.text} · ${whenText(repeatOf(row.repeat), date)}`,
    unfinished: !amount.ok || !date.ok,
  };
}

export function summariseIncome(row: IncomeRow): RowSummary {
  const amount = amountText(row.amount);
  const date = dateText(row.date);
  const maybe = row.reliability === "uncertain" ? ` · ${words.rows.mightCome}` : "";
  return {
    title: row.name.trim() === "" ? words.rows.unnamedIncome : row.name.trim(),
    detail: `${amount.text} · ${whenText(repeatOf(row.repeat), date)}${maybe}`,
    unfinished: !amount.ok || !date.ok,
  };
}

/** Adds up the amounts that can be read. `unreadable` counts the ones that couldn't. */
export function totalOf(amounts: string[]): { pence: number; count: number; unreadable: number } {
  let pence = 0;
  let unreadable = 0;
  for (const amount of amounts) {
    const parsed = parseMoney(amount);
    if (parsed.ok) pence += parsed.pence;
    else unreadable += 1;
  }
  return { pence, count: amounts.length, unreadable };
}

/** Ids in date order, earliest first. Rows with no date yet go last; ties keep their typed order. */
export function idsByDate(rows: Array<{ id: string; date: string }>): string[] {
  return rows
    .map((row, position) => ({ ...row, position }))
    .sort((a, b) => {
      const aMissing = a.date === "";
      const bMissing = b.date === "";
      if (aMissing !== bMissing) return aMissing ? 1 : -1;
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      return a.position - b.position;
    })
    .map((row) => row.id);
}

export function billsTotalLine(rows: BillRow[]): string | null {
  if (rows.length === 0) return null;
  const total = totalOf(rows.map((row) => row.amount));
  return words.rows.totalBills(total.count, formatMoney(total.pence));
}

export function incomeTotalLine(rows: IncomeRow[]): string | null {
  if (rows.length === 0) return null;
  const total = totalOf(rows.map((row) => row.amount));
  return words.rows.totalIncome(total.count, formatMoney(total.pence));
}

/** A row with nothing typed in it at all: it was opened and never filled in. */
export function isBlankBill(row: BillRow): boolean {
  return row.name.trim() === "" && row.amount.trim() === "" && row.dueDate === "";
}

export function isBlankIncome(row: IncomeRow): boolean {
  return row.name.trim() === "" && row.amount.trim() === "" && row.date === "";
}
