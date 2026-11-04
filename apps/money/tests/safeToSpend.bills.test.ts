import { describe, expect, it } from "vitest";
import { calculateSafeToSpend } from "../src/logic/safeToSpend";
import { gbp, makeInput } from "./helpers";

// Payday is Friday 13 November. The balance was entered today, Wednesday 4 November.

describe("bills around payday", () => {
  it("B1: a bill due ON payday is subtracted (the cautious choice)", () => {
    const result = calculateSafeToSpend(
      makeInput({ bills: [{ id: "a", name: "Rent share", amount: gbp(50), dueDate: "2026-11-13" }] }),
    );
    expect(result.safeToSpend).toBe(gbp(1000) - gbp(50));
  });

  it("B2: a bill due the day before payday is subtracted", () => {
    const result = calculateSafeToSpend(
      makeInput({ bills: [{ id: "a", name: "Phone", amount: gbp(18), dueDate: "2026-11-12" }] }),
    );
    expect(result.safeToSpend).toBe(gbp(1000) - gbp(18));
  });

  it("B3: a bill due the day after payday is NOT subtracted", () => {
    const result = calculateSafeToSpend(
      makeInput({ bills: [{ id: "a", name: "Gym", amount: gbp(25), dueDate: "2026-11-14" }] }),
    );
    expect(result.safeToSpend).toBe(gbp(1000));
  });

  it("B4: two bills on payday are both subtracted, each only once", () => {
    const result = calculateSafeToSpend(
      makeInput({
        bills: [
          { id: "a", name: "Energy", amount: gbp(50), dueDate: "2026-11-13" },
          { id: "b", name: "Broadband", amount: gbp(25), dueDate: "2026-11-13" },
        ],
      }),
    );
    expect(result.safeToSpend).toBe(gbp(1000) - gbp(75));
    expect(result.lines.filter((line) => line.kind === "bill")).toHaveLength(2);
  });

  it("B5: a bill the balance already shows is not subtracted", () => {
    const result = calculateSafeToSpend(
      makeInput({
        bills: [
          { id: "a", name: "Already gone", amount: gbp(40), dueDate: "2026-11-10", alreadyInBalance: true },
          { id: "b", name: "Still to come", amount: gbp(10), dueDate: "2026-11-10" },
        ],
      }),
    );
    expect(result.safeToSpend).toBe(gbp(1000) - gbp(10));
  });

  it("B5b: a bill dated before the balance was entered is already in the balance", () => {
    const result = calculateSafeToSpend(
      makeInput({ bills: [{ id: "a", name: "Last week", amount: gbp(40), dueDate: "2026-11-02" }] }),
    );
    expect(result.safeToSpend).toBe(gbp(1000));
  });

  it("B5c: an earlier bill the bank has not taken yet can be counted by saying so", () => {
    const result = calculateSafeToSpend(
      makeInput({
        bills: [{ id: "a", name: "Late to leave", amount: gbp(40), dueDate: "2026-11-02", alreadyInBalance: false }],
      }),
    );
    expect(result.safeToSpend).toBe(gbp(1000) - gbp(40));
  });
});
