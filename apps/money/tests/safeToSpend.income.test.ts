import { describe, expect, it } from "vitest";
import { calculateSafeToSpend } from "../src/logic/safeToSpend";
import { gbp, makeInput } from "./helpers";

// Payday is Friday 13 November. The balance was entered today, Wednesday 4 November.

describe("income, reliable and uncertain", () => {
  it("U1: uncertain income is never added", () => {
    const result = calculateSafeToSpend(
      makeInput({
        income: [{ id: "a", name: "Maybe a shift", amount: gbp(200), date: "2026-11-10", reliability: "uncertain" }],
      }),
    );
    expect(result.safeToSpend).toBe(gbp(1000));
    expect(result.lines.some((line) => line.kind === "income")).toBe(false);
  });

  it("U2: uncertain income is listed separately and flagged", () => {
    const result = calculateSafeToSpend(
      makeInput({
        income: [{ id: "a", name: "Maybe a shift", amount: gbp(200), date: "2026-11-10", reliability: "uncertain" }],
      }),
    );
    expect(result.uncertainIncome.total).toBe(gbp(200));
    expect(result.uncertainIncome.items).toHaveLength(1);
    expect(result.warnings).toContainEqual({ kind: "uncertain-income-not-counted", amount: gbp(200) });
  });

  it("U3: reliable income dated before the balance was entered is already in the balance", () => {
    const result = calculateSafeToSpend(
      makeInput({
        income: [{ id: "a", name: "Last week", amount: gbp(150), date: "2026-11-02", reliability: "reliable" }],
      }),
    );
    expect(result.safeToSpend).toBe(gbp(1000));
  });

  it("U4: income on payday or after it belongs to the next period and is not added", () => {
    const result = calculateSafeToSpend(
      makeInput({
        income: [
          { id: "a", name: "On payday", amount: gbp(150), date: "2026-11-13", reliability: "reliable" },
          { id: "b", name: "After payday", amount: gbp(150), date: "2026-11-14", reliability: "reliable" },
        ],
      }),
    );
    expect(result.safeToSpend).toBe(gbp(1000));
  });

  it("U5: reliable income inside the window is added exactly once", () => {
    const result = calculateSafeToSpend(
      makeInput({
        income: [{ id: "a", name: "Refund", amount: gbp(150), date: "2026-11-10", reliability: "reliable" }],
      }),
    );
    expect(result.safeToSpend).toBe(gbp(1150));
    expect(result.lines.filter((line) => line.kind === "income")).toHaveLength(1);
  });

  it("U5b: reliable income the balance already shows is not added", () => {
    const result = calculateSafeToSpend(
      makeInput({
        income: [
          { id: "a", name: "Arrived early", amount: gbp(150), date: "2026-11-10", reliability: "reliable", alreadyInBalance: true },
        ],
      }),
    );
    expect(result.safeToSpend).toBe(gbp(1000));
  });

  it("U6: a shortfall that uncertain income would cover gets its own gentle warning", () => {
    const bills = [{ id: "b", name: "Car service", amount: gbp(80), dueDate: "2026-11-10" }];
    const base = { balance: { amount: gbp(50), asOf: "2026-11-04" }, bills };

    const couldCover = calculateSafeToSpend(
      makeInput({
        ...base,
        income: [{ id: "a", name: "Maybe", amount: gbp(100), date: "2026-11-09", reliability: "uncertain" }],
      }),
    );
    expect(couldCover.safeToSpend).toBe(-gbp(30)); // still the honest figure
    expect(couldCover.warnings.map((w) => w.kind)).toContain("uncertain-income-would-cover-shortfall");

    const notEnough = calculateSafeToSpend(
      makeInput({
        ...base,
        income: [{ id: "a", name: "Maybe", amount: gbp(10), date: "2026-11-09", reliability: "uncertain" }],
      }),
    );
    expect(notEnough.warnings.map((w) => w.kind)).not.toContain("uncertain-income-would-cover-shortfall");
  });
});
