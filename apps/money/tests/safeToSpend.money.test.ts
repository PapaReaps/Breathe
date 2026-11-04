import { describe, expect, it } from "vitest";
import { InvalidInputError } from "../src/logic/errors";
import { calculateSafeToSpend } from "../src/logic/safeToSpend";
import { deepFreeze, gbp, makeInput } from "./helpers";

describe("money maths and edge cases", () => {
  it("M1: pennies add up exactly (10p + 20p is exactly 30p)", () => {
    const result = calculateSafeToSpend(
      makeInput({
        balance: { amount: 10, asOf: "2026-11-04" },
        income: [{ id: "a", name: "Small", amount: 20, date: "2026-11-10", reliability: "reliable" }],
      }),
    );
    expect(result.safeToSpend).toBe(30);
  });

  it("M2: a zero balance with a bill goes negative by exactly the bill", () => {
    const result = calculateSafeToSpend(
      makeInput({
        balance: { amount: 0, asOf: "2026-11-04" },
        bills: [{ id: "a", name: "Phone", amount: gbp(10), dueDate: "2026-11-10" }],
      }),
    );
    expect(result.safeToSpend).toBe(-gbp(10));
  });

  it("M3: with no bills, only the buffer and essentials come off", () => {
    const result = calculateSafeToSpend(
      makeInput({
        buffer: gbp(100),
        essentials: [{ id: "l", name: "Travel", kind: "lump-sum", amount: gbp(20) }],
      }),
    );
    expect(result.safeToSpend).toBe(gbp(880));
  });

  it("M4: everything at zero gives zero and no warnings", () => {
    const result = calculateSafeToSpend(makeInput({ balance: { amount: 0, asOf: "2026-11-04" } }));
    expect(result.safeToSpend).toBe(0);
    expect(result.warnings).toEqual([]);
  });

  it("M5: a result of exactly zero is zero", () => {
    const result = calculateSafeToSpend(
      makeInput({
        balance: { amount: gbp(100), asOf: "2026-11-04" },
        bills: [{ id: "a", name: "Big bill", amount: gbp(100), dueDate: "2026-11-10" }],
      }),
    );
    expect(result.safeToSpend).toBe(0);
  });

  it("M6: a negative result is returned as the true figure, and an overdrawn balance works", () => {
    const short = calculateSafeToSpend(
      makeInput({
        balance: { amount: gbp(50), asOf: "2026-11-04" },
        bills: [{ id: "a", name: "Bill", amount: gbp(75), dueDate: "2026-11-10" }],
      }),
    );
    expect(short.safeToSpend).toBe(-gbp(25));

    const overdrawn = calculateSafeToSpend(makeInput({ balance: { amount: -gbp(20), asOf: "2026-11-04" } }));
    expect(overdrawn.safeToSpend).toBe(-gbp(20));
  });

  it("M7: very large amounts stay exact, and impossible ones are refused", () => {
    const large = calculateSafeToSpend(
      makeInput({ balance: { amount: 100_000_000_000, asOf: "2026-11-04" }, buffer: 1 }),
    );
    expect(large.safeToSpend).toBe(99_999_999_999);

    expect(() =>
      calculateSafeToSpend(
        makeInput({
          balance: { amount: Number.MAX_SAFE_INTEGER, asOf: "2026-11-04" },
          income: [{ id: "a", name: "Too much", amount: 10, date: "2026-11-10", reliability: "reliable" }],
        }),
      ),
    ).toThrow(InvalidInputError);
  });

  it("M8: a buffer bigger than the balance gives a negative result", () => {
    const result = calculateSafeToSpend(
      makeInput({ balance: { amount: gbp(100), asOf: "2026-11-04" }, buffer: gbp(250) }),
    );
    expect(result.safeToSpend).toBe(-gbp(150));
  });

  it("M9: an old balance gets a gentle out-of-date note, a fresh one does not", () => {
    const old = calculateSafeToSpend(
      makeInput({ today: "2026-11-04", balance: { amount: gbp(500), asOf: "2026-10-31" } }),
    );
    expect(old.warnings).toContainEqual({ kind: "balance-out-of-date", daysOld: 4 });

    const threeDays = calculateSafeToSpend(
      makeInput({ today: "2026-11-04", balance: { amount: gbp(500), asOf: "2026-11-01" } }),
    );
    expect(threeDays.warnings.map((w) => w.kind)).not.toContain("balance-out-of-date");

    const strict = calculateSafeToSpend(
      makeInput({
        today: "2026-11-04",
        balance: { amount: gbp(500), asOf: "2026-11-02" },
        staleAfterDays: 1,
      }),
    );
    expect(strict.warnings).toContainEqual({ kind: "balance-out-of-date", daysOld: 2 });
  });

  it("M10: the same input always gives the same answer, and the input is never changed", () => {
    const input = deepFreeze(
      makeInput({
        bills: [{ id: "a", name: "Phone", amount: gbp(18), dueDate: "2026-11-10" }],
        income: [{ id: "i", name: "Refund", amount: gbp(12.34), date: "2026-11-09", reliability: "reliable" }],
        buffer: gbp(50),
      }),
    );
    const first = calculateSafeToSpend(input);
    const second = calculateSafeToSpend(input);
    expect(second).toEqual(first);
  });

  it("M11: the breakdown always adds up to the safe-to-spend figure", () => {
    const result = calculateSafeToSpend(
      makeInput({
        bills: [{ id: "a", name: "Phone", amount: gbp(18.5), dueDate: "2026-11-10" }],
        pendingPayments: [{ id: "p", name: "Shop", amount: gbp(7.25), alreadyInBalance: false }],
        essentials: [{ id: "f", name: "Food", kind: "per-day", amount: gbp(9.99) }],
        buffer: gbp(40),
        savings: [{ id: "s", name: "Pot", amount: gbp(15), date: "2026-11-12", committed: true }],
      }),
    );
    const sum = result.lines.reduce((total, line) => total + line.amount, 0);
    expect(sum).toBe(result.safeToSpend);
  });

  it("M12: unusable input is refused rather than guessed at", () => {
    expect(() =>
      calculateSafeToSpend(makeInput({ balance: { amount: 12.5, asOf: "2026-11-04" } })),
    ).toThrow(InvalidInputError); // pounds instead of pence
    expect(() =>
      calculateSafeToSpend(
        makeInput({ bills: [{ id: "a", name: "Odd", amount: -100, dueDate: "2026-11-10" }] }),
      ),
    ).toThrow(InvalidInputError); // negative bill
    expect(() => calculateSafeToSpend(makeInput({ today: "2026-02-30" }))).toThrow(InvalidInputError);
    expect(() =>
      calculateSafeToSpend(makeInput({ balance: { amount: gbp(10), asOf: "2026-11-09" } })),
    ).toThrow(InvalidInputError); // balance dated in the future
  });
});

describe("a realistic stretch to payday (fictional)", () => {
  it("adds everything up correctly", () => {
    // Sam, Wednesday 4 November. Payday Friday 20 November (16 days of food).
    const result = calculateSafeToSpend(
      makeInput({
        balance: { amount: gbp(420), asOf: "2026-11-04" },
        payday: { date: "2026-11-20", ifNotWorkingDay: "working-day-before" },
        bills: [
          { id: "phone", name: "Phone", amount: gbp(18), dueDate: "2026-11-10" },
          { id: "energy", name: "Energy", amount: gbp(62.5), dueDate: "2026-11-15" },
          { id: "gym", name: "Gym", amount: gbp(25), dueDate: "2026-11-21" }, // after payday
        ],
        income: [
          { id: "refund", name: "Refund", amount: gbp(12.34), date: "2026-11-12", reliability: "reliable" },
          { id: "shift", name: "Maybe a shift", amount: gbp(40), date: "2026-11-16", reliability: "uncertain" },
        ],
        essentials: [
          { id: "food", name: "Food", kind: "per-day", amount: gbp(9) },
          { id: "travel", name: "Travel", kind: "lump-sum", amount: gbp(20) },
        ],
        buffer: gbp(50),
        savings: [{ id: "pot", name: "Holiday pot", amount: gbp(30), date: "2026-11-14", committed: true }],
      }),
    );
    expect(result.daysCovered).toBe(16);
    expect(result.safeToSpend).toBe(10784); // £107.84
    expect(result.uncertainIncome.total).toBe(gbp(40));
  });
});
