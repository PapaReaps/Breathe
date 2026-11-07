import { formatMoney, parseMoney } from "./money";
import type { Pence } from "./types";

/*
 * Adding to, or taking from, the savings kept aside. The money stays in the everyday account:
 * only the amount kept aside changes, so the safe-to-spend number moves the other way.
 */

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
  return { ok: true, total, text: total === 0 ? "" : formatMoney(total).replace("£", "").replace(/,/g, "") };
}
