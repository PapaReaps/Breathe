import { describe, expect, it } from "vitest";
import { calculateSafeToSpend } from "../src/logic/safeToSpend";
import { gbp, makeInput } from "./helpers";

// Reminder: Sat 7, Sun 8, Mon 9 ... Fri 13, Sat 14, Sun 15, Mon 16 November 2026.

const perDay = [{ id: "f", name: "Food", kind: "per-day" as const, amount: gbp(10) }];

describe("weekends and bank holidays", () => {
  it("W1: payday on a Saturday, paid the working day before, becomes Friday", () => {
    const result = calculateSafeToSpend(
      makeInput({
        payday: { date: "2026-11-14", ifNotWorkingDay: "working-day-before" },
        essentials: perDay,
        bills: [
          { id: "a", name: "Friday bill", amount: gbp(10), dueDate: "2026-11-13" },
          { id: "b", name: "Saturday bill", amount: gbp(99), dueDate: "2026-11-14" },
        ],
      }),
    );
    expect(result.paydayDate).toBe("2026-11-13");
    expect(result.daysCovered).toBe(9);
    expect(result.safeToSpend).toBe(gbp(1000) - gbp(90) - gbp(10));
  });

  it("W2: payday on a Saturday, paid the next working day, becomes Monday", () => {
    const result = calculateSafeToSpend(
      makeInput({
        payday: { date: "2026-11-14", ifNotWorkingDay: "next-working-day" },
        essentials: perDay,
        bills: [
          { id: "a", name: "Saturday bill", amount: gbp(10), dueDate: "2026-11-14" },
          { id: "b", name: "Monday bill", amount: gbp(20), dueDate: "2026-11-16" },
          { id: "c", name: "Tuesday bill", amount: gbp(99), dueDate: "2026-11-17" },
        ],
      }),
    );
    expect(result.paydayDate).toBe("2026-11-16");
    expect(result.daysCovered).toBe(12);
    expect(result.safeToSpend).toBe(gbp(1000) - gbp(120) - gbp(10) - gbp(20));
  });

  it("W3: payday on a Sunday before a bank holiday Monday becomes Tuesday", () => {
    // Pretend Monday 9 November is a bank holiday. (Fictional, for the test.)
    const result = calculateSafeToSpend(
      makeInput({
        payday: { date: "2026-11-08", ifNotWorkingDay: "next-working-day" },
        nonWorkingDays: ["2026-11-09"],
      }),
    );
    expect(result.paydayDate).toBe("2026-11-10");
  });

  it("W3b: the same Sunday payday follows each of the three choices", () => {
    const base = { nonWorkingDays: ["2026-11-09"] };
    const before = calculateSafeToSpend(
      makeInput({ ...base, payday: { date: "2026-11-08", ifNotWorkingDay: "working-day-before" } }),
    );
    const onTheDay = calculateSafeToSpend(
      makeInput({ ...base, payday: { date: "2026-11-08", ifNotWorkingDay: "on-the-day" } }),
    );
    expect(before.paydayDate).toBe("2026-11-06");
    expect(onTheDay.paydayDate).toBe("2026-11-08");
  });

  it("W3c: a weekday bank holiday payday paid the working day before skips back over the weekend", () => {
    const result = calculateSafeToSpend(
      makeInput({
        payday: { date: "2026-11-09", ifNotWorkingDay: "working-day-before" },
        nonWorkingDays: ["2026-11-09"],
      }),
    );
    expect(result.paydayDate).toBe("2026-11-06");
  });

  it("W4: a Saturday bill taken the next working day is counted when payday is that Monday", () => {
    const result = calculateSafeToSpend(
      makeInput({
        payday: { date: "2026-11-16", ifNotWorkingDay: "on-the-day" },
        bills: [
          { id: "a", name: "Saturday bill", amount: gbp(30), dueDate: "2026-11-14", takenOn: "next-working-day" },
        ],
      }),
    );
    expect(result.safeToSpend).toBe(gbp(1000) - gbp(30));
  });

  it("W4b: if either the due date or the working-day date is in the window, the bill is counted", () => {
    // Payday is a Sunday paid on the day. The bill is due Saturday but taken Monday.
    // Saturday is inside the window, Monday is not. Cautious: count it.
    const result = calculateSafeToSpend(
      makeInput({
        payday: { date: "2026-11-08", ifNotWorkingDay: "on-the-day" },
        bills: [
          { id: "a", name: "Saturday bill", amount: gbp(30), dueDate: "2026-11-07", takenOn: "next-working-day" },
        ],
      }),
    );
    expect(result.safeToSpend).toBe(gbp(1000) - gbp(30));
  });

  it("W5: a Saturday bill after a Friday payday is outside the window", () => {
    const result = calculateSafeToSpend(
      makeInput({
        bills: [
          { id: "a", name: "Saturday bill", amount: gbp(30), dueDate: "2026-11-14" },
          { id: "b", name: "Saturday bill taken Monday", amount: gbp(30), dueDate: "2026-11-14", takenOn: "next-working-day" },
        ],
      }),
    );
    expect(result.safeToSpend).toBe(gbp(1000));
  });
});
