import { describe, expect, it } from "vitest";
import { InvalidInputError } from "../src/logic/errors";
import { calculateSafeToSpend } from "../src/logic/safeToSpend";
import { gbp, makeInput } from "./helpers";

// Today is Wednesday 4 November 2026. Payday defaults to Friday 13 November (9 days away).

const weekly = (amount: number) => [{ id: "w", name: "Food", kind: "per-week" as const, amount }];

describe("weekly amounts for food and travel", () => {
  it("X1: a whole number of weeks is exact (7 days of £30 a week is £30)", () => {
    const result = calculateSafeToSpend(
      makeInput({
        payday: { date: "2026-11-11", ifNotWorkingDay: "on-the-day" },
        essentials: weekly(gbp(30)),
      }),
    );
    expect(result.daysCovered).toBe(7);
    expect(result.safeToSpend).toBe(gbp(1000) - gbp(30));
  });

  it("X2: £63 a week over 16 days is exactly £144", () => {
    const result = calculateSafeToSpend(
      makeInput({
        payday: { date: "2026-11-20", ifNotWorkingDay: "on-the-day" },
        essentials: weekly(gbp(63)),
      }),
    );
    expect(result.safeToSpend).toBe(gbp(1000) - gbp(144));
  });

  it("X3: part-weeks are rounded UP to the next penny (cautious)", () => {
    // £10 a week for 1 day is 142.857... pence, so 143.
    const result = calculateSafeToSpend(
      makeInput({
        payday: { date: "2026-11-05", ifNotWorkingDay: "on-the-day" },
        essentials: weekly(gbp(10)),
      }),
    );
    expect(result.safeToSpend).toBe(gbp(1000) - 143);
  });

  it("X4: payday today means no days left, so nothing weekly is taken", () => {
    const result = calculateSafeToSpend(
      makeInput({
        payday: { date: "2026-11-04", ifNotWorkingDay: "on-the-day" },
        essentials: weekly(gbp(63)),
      }),
    );
    expect(result.safeToSpend).toBe(gbp(1000));
  });

  it("X5: rounding never overstates what is safe to spend, and never loses more than a penny", () => {
    for (let weeklyPence = 1; weeklyPence <= 120; weeklyPence++) {
      for (let days = 0; days <= 40; days++) {
        const payday = new Date(Date.UTC(2026, 10, 4 + days)).toISOString().slice(0, 10);
        const result = calculateSafeToSpend(
          makeInput({ payday: { date: payday, ifNotWorkingDay: "on-the-day" }, essentials: weekly(weeklyPence) }),
        );
        const taken = gbp(1000) - (result.safeToSpend ?? 0);
        // taken is the smallest whole number of pence that is at least weeklyPence x days / 7
        expect(taken * 7 >= weeklyPence * days).toBe(true);
        expect((taken - 1) * 7 < weeklyPence * days || taken === 0).toBe(true);
      }
    }
  });
});

describe("the safety buffer is a one-off pot", () => {
  it("X6: it is the same however many days are left until payday", () => {
    const soon = calculateSafeToSpend(
      makeInput({ payday: { date: "2026-11-06", ifNotWorkingDay: "on-the-day" }, buffer: gbp(50) }),
    );
    const later = calculateSafeToSpend(
      makeInput({ payday: { date: "2026-11-30", ifNotWorkingDay: "on-the-day" }, buffer: gbp(50) }),
    );
    expect(soon.safeToSpend).toBe(gbp(950));
    expect(later.safeToSpend).toBe(gbp(950));
    expect(later.lines.filter((line) => line.kind === "buffer")).toEqual([{ kind: "buffer", amount: -gbp(50) }]);
  });

  it("X7: no buffer means no buffer line at all", () => {
    const result = calculateSafeToSpend(makeInput({ buffer: 0 }));
    expect(result.lines.some((line) => line.kind === "buffer")).toBe(false);
  });

  it("X8: the breakdown still adds up exactly with weekly amounts and a buffer in it", () => {
    const result = calculateSafeToSpend(
      makeInput({
        essentials: [
          { id: "f", name: "Food", kind: "per-week", amount: gbp(47.5) },
          { id: "t", name: "Travel", kind: "per-week", amount: gbp(13.2) },
        ],
        buffer: gbp(40),
        bills: [{ id: "b", name: "Mum", amount: gbp(100), dueDate: "2026-11-10" }],
      }),
    );
    const sum = result.lines.reduce((total, line) => total + line.amount, 0);
    expect(sum).toBe(result.safeToSpend);
  });

  it("X9: unusable weekly amounts and buffers are refused rather than guessed at", () => {
    expect(() => calculateSafeToSpend(makeInput({ buffer: 12.5 }))).toThrow(InvalidInputError);
    expect(() => calculateSafeToSpend(makeInput({ buffer: -100 }))).toThrow(InvalidInputError);
    expect(() =>
      calculateSafeToSpend(makeInput({ essentials: weekly(Number.MAX_SAFE_INTEGER) })),
    ).toThrow(InvalidInputError);
  });
});
