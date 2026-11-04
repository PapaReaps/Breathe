import type { CalculatorInput } from "../src/logic/types";

/*
 * Test helpers. Everything here is FICTIONAL.
 *
 * The usual starting point for the tests is:
 *   Today is Wednesday 4 November 2026, and the balance was entered today.
 *   Balance £1,000.00. Payday is Friday 13 November 2026.
 *   No bills, no income, no essentials, no buffer, no savings.
 *
 * Calendar for the dates used in the tests (2026):
 *   Wed 4 Nov  Thu 5  Fri 6  Sat 7  Sun 8  Mon 9  Tue 10  Wed 11  Thu 12  Fri 13
 *   Sat 14  Sun 15  Mon 16  Tue 17 ... Fri 20 Nov ... Mon 30 Nov
 */

/** Pounds to pence, for readable tests: gbp(12.5) is 1250. */
export function gbp(pounds: number): number {
  return Math.round(pounds * 100);
}

export function makeInput(overrides: Partial<CalculatorInput> = {}): CalculatorInput {
  return {
    today: "2026-11-04",
    balance: { amount: gbp(1000), asOf: "2026-11-04" },
    payday: { date: "2026-11-13", ifNotWorkingDay: "on-the-day" },
    nonWorkingDays: [],
    bills: [],
    income: [],
    pendingPayments: [],
    essentials: [],
    buffer: 0,
    savings: [],
    ...overrides,
  };
}

/** Freezes an object and everything inside it, so any accidental change throws an error. */
export function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.freeze(value);
    for (const inner of Object.values(value)) deepFreeze(inner);
  }
  return value;
}
