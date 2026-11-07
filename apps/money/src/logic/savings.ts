import { parseMoney } from "./money";
import type { Pence } from "./types";

/*
 * Adding to, or taking from, the savings kept aside. Savings and the everyday balance move
 * together: adding is new money coming in to save, taking out is money spent from savings.
 * So the safe-to-spend number stays the same, whatever is done with savings.
 */

/** Pence as plain text a money box can read back: 1274.6 → "1274.60", overdrawn → "-12.00". */
export function plainMoney(pence: Pence): string {
  const sign = pence < 0 ? "-" : "";
  const a = Math.abs(pence);
  return `${sign}${Math.floor(a / 100)}.${String(a % 100).padStart(2, "0")}`;
}

/** The balance after the same amount goes in or out with savings. Null if the balance can't be read (left as it is). */
export function moveBalance(balance: string, amountPence: Pence, kind: "add" | "take"): string | null {
  if (balance.trim() === "") return null;
  const parsed = parseMoney(balance, { allowNegative: true });
  if (!parsed.ok) return null;
  return plainMoney(kind === "add" ? parsed.pence + amountPence : parsed.pence - amountPence);
}

export type SavingsChange =
  | { ok: true; total: Pence; text: string }
  | { ok: false; reason: "unreadable" | "zero" | "more-than-saved" };

/** What is kept aside now. An empty box means none. Null if what was typed can't be read. */
export function savingsNow(buffer: string): Pence | null {
  if (buffer.trim() === "") return 0;
  const parsed = parseMoney(buffer);
  return parsed.ok ? parsed.pence : null;
}

/** The new total after adding (or, with "take", taking out) the typed amount. */
export function changeSavings(buffer: string, amountText: string, kind: "add" | "take"): SavingsChange {
  const now = savingsNow(buffer);
  const amount = parseMoney(amountText);
  if (now === null || !amount.ok) return { ok: false, reason: "unreadable" };
  if (amount.pence === 0) return { ok: false, reason: "zero" };
  if (kind === "take" && amount.pence > now) return { ok: false, reason: "more-than-saved" };
  const total = kind === "add" ? now + amount.pence : now - amount.pence;
  return { ok: true, total, text: total === 0 ? "" : plainMoney(total) };
}
