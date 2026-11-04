import { describe, expect, it } from "vitest";
import { calculateSafeToSpend } from "../src/logic/safeToSpend";
import type { CalculatorInput } from "../src/logic/types";
import { gbp, makeInput } from "./helpers";

describe("savings", () => {
  it("S1: the savings balance never changes the result", () => {
    // Savings balance is not an input at all. Even if one is slipped in, it makes no difference.
    const plain = calculateSafeToSpend(makeInput());
    const withSavings = calculateSafeToSpend({
      ...makeInput(),
      savingsBalance: gbp(10_000),
    } as CalculatorInput);
    expect(withSavings.safeToSpend).toBe(plain.safeToSpend);
  });

  it("S2: a committed transfer inside the window is subtracted once", () => {
    const result = calculateSafeToSpend(
      makeInput({
        savings: [{ id: "s", name: "Holiday pot", amount: gbp(100), date: "2026-11-10", committed: true }],
      }),
    );
    expect(result.safeToSpend).toBe(gbp(900));
    expect(result.lines.filter((line) => line.kind === "savings")).toHaveLength(1);
  });

  it("S3: a transfer that is only a hope is not subtracted", () => {
    const result = calculateSafeToSpend(
      makeInput({
        savings: [{ id: "s", name: "Would be nice", amount: gbp(100), date: "2026-11-10", committed: false }],
      }),
    );
    expect(result.safeToSpend).toBe(gbp(1000));
  });

  it("S4: a transfer that has already happened is not subtracted again", () => {
    const result = calculateSafeToSpend(
      makeInput({
        savings: [
          { id: "a", name: "Done and shown", amount: gbp(100), date: "2026-11-10", committed: true, alreadyInBalance: true },
          { id: "b", name: "Done last week", amount: gbp(100), date: "2026-11-02", committed: true },
        ],
      }),
    );
    expect(result.safeToSpend).toBe(gbp(1000));
  });

  it("S5: money going out on payday counts, money going out after payday does not", () => {
    const result = calculateSafeToSpend(
      makeInput({
        savings: [
          { id: "a", name: "On payday", amount: gbp(40), date: "2026-11-13", committed: true },
          { id: "b", name: "After payday", amount: gbp(60), date: "2026-11-14", committed: true },
        ],
      }),
    );
    expect(result.safeToSpend).toBe(gbp(960));
  });
});
