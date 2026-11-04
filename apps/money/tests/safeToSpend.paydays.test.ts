import { describe, expect, it } from "vitest";
import { calculateSafeToSpend } from "../src/logic/safeToSpend";
import { gbp, makeInput } from "./helpers";

describe("payday dates", () => {
  it("P1: payday tomorrow counts bills up to payday, but not the day after", () => {
    const result = calculateSafeToSpend(
      makeInput({
        balance: { amount: gbp(500), asOf: "2026-11-04" },
        payday: { date: "2026-11-05", ifNotWorkingDay: "on-the-day" },
        bills: [
          { id: "a", name: "Today", amount: gbp(10), dueDate: "2026-11-04", alreadyInBalance: false },
          { id: "b", name: "Tomorrow", amount: gbp(20), dueDate: "2026-11-05" },
          { id: "c", name: "Day after", amount: gbp(30), dueDate: "2026-11-06" },
        ],
      }),
    );
    expect(result.safeToSpend).toBe(gbp(500) - gbp(10) - gbp(20));
    expect(result.daysUntilPayday).toBe(1);
  });

  it("P2: payday is today, so there are zero days left to cover", () => {
    const result = calculateSafeToSpend(
      makeInput({
        balance: { amount: gbp(200), asOf: "2026-11-04" },
        payday: { date: "2026-11-04", ifNotWorkingDay: "on-the-day" },
        bills: [{ id: "a", name: "Phone", amount: gbp(15), dueDate: "2026-11-04", alreadyInBalance: false }],
        essentials: [{ id: "f", name: "Food", kind: "per-day", amount: gbp(10) }],
      }),
    );
    expect(result.daysCovered).toBe(0);
    expect(result.daysUntilPayday).toBe(0);
    expect(result.safeToSpend).toBe(gbp(200) - gbp(15)); // no food days left
  });

  it("P3: payday has already passed, so it does not guess", () => {
    const result = calculateSafeToSpend(
      makeInput({
        today: "2026-11-14",
        balance: { amount: gbp(300), asOf: "2026-11-12" },
        payday: { date: "2026-11-13", ifNotWorkingDay: "on-the-day" },
      }),
    );
    expect(result.safeToSpend).toBeNull();
    expect(result.lines).toEqual([]);
    expect(result.warnings.some((w) => w.kind === "payday-passed")).toBe(true);
  });

  it("P3b: a payday moved earlier by the weekend rule that has passed is also flagged", () => {
    // Nominal payday Saturday 14th, usually paid Friday 13th. Today is Saturday 14th.
    const result = calculateSafeToSpend(
      makeInput({
        today: "2026-11-14",
        balance: { amount: gbp(300), asOf: "2026-11-14" },
        payday: { date: "2026-11-14", ifNotWorkingDay: "working-day-before" },
      }),
    );
    expect(result.paydayDate).toBe("2026-11-13");
    expect(result.safeToSpend).toBeNull();
  });

  it("P4: month-end and leap-year paydays count the right number of days", () => {
    const perDay = [{ id: "f", name: "Food", kind: "per-day" as const, amount: gbp(10) }];

    const monthEnd = calculateSafeToSpend(
      makeInput({
        today: "2026-11-27",
        balance: { amount: gbp(500), asOf: "2026-11-27" },
        payday: { date: "2026-11-30", ifNotWorkingDay: "on-the-day" },
        essentials: perDay,
      }),
    );
    expect(monthEnd.daysCovered).toBe(3);
    expect(monthEnd.safeToSpend).toBe(gbp(500) - gbp(30));

    const leapYear = calculateSafeToSpend(
      makeInput({
        today: "2028-02-26",
        balance: { amount: gbp(500), asOf: "2028-02-26" },
        payday: { date: "2028-03-01", ifNotWorkingDay: "on-the-day" },
        essentials: perDay,
      }),
    );
    expect(leapYear.daysCovered).toBe(4); // 26th, 27th, 28th and 29th Feb (payday itself is not counted)

    const normalYear = calculateSafeToSpend(
      makeInput({
        today: "2027-02-26",
        balance: { amount: gbp(500), asOf: "2027-02-26" },
        payday: { date: "2027-03-01", ifNotWorkingDay: "on-the-day" },
        essentials: perDay,
      }),
    );
    expect(normalYear.daysCovered).toBe(3);
  });

  it("P5: a payday across New Year works", () => {
    const result = calculateSafeToSpend(
      makeInput({
        today: "2026-12-29",
        balance: { amount: gbp(400), asOf: "2026-12-29" },
        payday: { date: "2027-01-04", ifNotWorkingDay: "on-the-day" },
        essentials: [{ id: "f", name: "Food", kind: "per-day", amount: gbp(10) }],
        bills: [
          { id: "a", name: "New Year's Eve bill", amount: gbp(20), dueDate: "2026-12-31" },
          { id: "b", name: "2 January bill", amount: gbp(5), dueDate: "2027-01-02" },
          { id: "c", name: "After payday", amount: gbp(99), dueDate: "2027-01-05" },
        ],
      }),
    );
    expect(result.daysCovered).toBe(6);
    expect(result.safeToSpend).toBe(gbp(400) - gbp(60) - gbp(20) - gbp(5));
  });
});
