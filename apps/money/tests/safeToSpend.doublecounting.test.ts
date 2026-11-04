import { describe, expect, it } from "vitest";
import { calculateSafeToSpend } from "../src/logic/safeToSpend";
import { gbp, makeInput } from "./helpers";

describe("never counting the same money twice", () => {
  it("D1: a pending payment already taken off the balance is not subtracted", () => {
    const result = calculateSafeToSpend(
      makeInput({
        pendingPayments: [{ id: "p", name: "Shop", amount: gbp(30), alreadyInBalance: true }],
      }),
    );
    expect(result.safeToSpend).toBe(gbp(1000));
  });

  it("D2: a pending payment not yet taken off the balance is subtracted once", () => {
    const result = calculateSafeToSpend(
      makeInput({
        pendingPayments: [{ id: "p", name: "Shop", amount: gbp(30), alreadyInBalance: false }],
      }),
    );
    expect(result.safeToSpend).toBe(gbp(970));
    expect(result.lines.filter((line) => line.kind === "pending")).toHaveLength(1);
  });

  it("D3: a pending payment linked to a bill gives one deduction, not two", () => {
    const bill = { id: "rent", name: "Rent share", amount: gbp(50), dueDate: "2026-11-10" };
    const result = calculateSafeToSpend(
      makeInput({
        bills: [bill],
        pendingPayments: [
          { id: "p", name: "Rent share (pending)", amount: gbp(50), alreadyInBalance: false, linkedBillId: "rent" },
        ],
      }),
    );
    expect(result.safeToSpend).toBe(gbp(950));
    expect(result.lines.filter((line) => line.kind === "bill")).toHaveLength(0);
    expect(result.lines.filter((line) => line.kind === "pending")).toHaveLength(1);
  });

  it("D3b: a linked pending payment already in the balance means nothing is subtracted for that bill", () => {
    const result = calculateSafeToSpend(
      makeInput({
        bills: [{ id: "rent", name: "Rent share", amount: gbp(50), dueDate: "2026-11-10" }],
        pendingPayments: [
          { id: "p", name: "Rent share (pending)", amount: gbp(50), alreadyInBalance: true, linkedBillId: "rent" },
        ],
      }),
    );
    expect(result.safeToSpend).toBe(gbp(1000));
  });

  it("D3c: a bill dated before the balance, with a pending payment not yet off the balance, is counted once", () => {
    const result = calculateSafeToSpend(
      makeInput({
        bills: [{ id: "rent", name: "Rent share", amount: gbp(50), dueDate: "2026-11-02" }],
        pendingPayments: [
          { id: "p", name: "Rent share (pending)", amount: gbp(50), alreadyInBalance: false, linkedBillId: "rent" },
        ],
      }),
    );
    expect(result.safeToSpend).toBe(gbp(950));
  });

  it("D4: a bill paid after the balance was entered is still subtracted until the balance is updated", () => {
    // Balance entered Wednesday 4th. The bill went out on Friday 6th. Today is Saturday 7th.
    // The balance has not been updated, so it still includes that money.
    const result = calculateSafeToSpend(
      makeInput({
        today: "2026-11-07",
        balance: { amount: gbp(1000), asOf: "2026-11-04" },
        bills: [{ id: "a", name: "Phone", amount: gbp(18), dueDate: "2026-11-06" }],
      }),
    );
    expect(result.safeToSpend).toBe(gbp(1000) - gbp(18));
  });

  it("D5: updating the balance settles everything that came before it", () => {
    // Same bill, but now the balance is re-entered on the 7th, after the bill went out.
    const result = calculateSafeToSpend(
      makeInput({
        today: "2026-11-07",
        balance: { amount: gbp(982), asOf: "2026-11-07" },
        bills: [{ id: "a", name: "Phone", amount: gbp(18), dueDate: "2026-11-06" }],
      }),
    );
    expect(result.safeToSpend).toBe(gbp(982));
  });

  it("D6: items dated on the balance day, with no answer yet, get a cautious treatment and a question", () => {
    const result = calculateSafeToSpend(
      makeInput({
        bills: [{ id: "b", name: "Phone", amount: gbp(18), dueDate: "2026-11-04" }],
        income: [{ id: "i", name: "Refund", amount: gbp(40), date: "2026-11-04", reliability: "reliable" }],
        savings: [{ id: "s", name: "Holiday pot", amount: gbp(25), date: "2026-11-04", committed: true }],
      }),
    );
    // Bill counted (cautious), income not added (cautious), savings counted (cautious).
    expect(result.safeToSpend).toBe(gbp(1000) - gbp(18) - gbp(25));
    expect(result.warnings).toContainEqual({ kind: "needs-answer", itemType: "bill", id: "b", name: "Phone" });
    expect(result.warnings).toContainEqual({ kind: "needs-answer", itemType: "income", id: "i", name: "Refund" });
    expect(result.warnings).toContainEqual({ kind: "needs-answer", itemType: "savings", id: "s", name: "Holiday pot" });
  });

  it("D6b: answering the question removes the warning and uses the answer", () => {
    const result = calculateSafeToSpend(
      makeInput({
        bills: [{ id: "b", name: "Phone", amount: gbp(18), dueDate: "2026-11-04", alreadyInBalance: true }],
        income: [
          { id: "i", name: "Refund", amount: gbp(40), date: "2026-11-04", reliability: "reliable", alreadyInBalance: false },
        ],
      }),
    );
    expect(result.safeToSpend).toBe(gbp(1000) + gbp(40));
    expect(result.warnings.filter((w) => w.kind === "needs-answer")).toHaveLength(0);
  });
});
