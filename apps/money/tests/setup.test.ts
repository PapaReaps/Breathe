import { describe, expect, it } from "vitest";
import { emptyForm } from "../src/logic/form";
import { SETUP_STEPS, firstSetupStep } from "../src/logic/setup";

describe("where the step-by-step setup starts", () => {
  it("starts with the money coming in", () => {
    expect(SETUP_STEPS[0]).toBe("payday");
    expect(SETUP_STEPS[firstSetupStep(emptyForm())]).toBe("payday");
  });

  it("has one page for money coming in, not a separate payday and income step", () => {
    expect(SETUP_STEPS).toEqual(["payday", "balance", "bills", "food", "pot"]);
  });

  it("carries on from the balance once the money date is in, so nothing is asked twice", () => {
    expect(SETUP_STEPS[firstSetupStep({ ...emptyForm(), paydayDate: "2026-11-13" })]).toBe("balance");
  });

  it("starts from the top again when both are already answered", () => {
    expect(firstSetupStep({ ...emptyForm(), balance: "420", paydayDate: "2026-11-13" })).toBe(0);
  });

  it("a date of only spaces counts as nothing typed", () => {
    expect(firstSetupStep({ ...emptyForm(), paydayDate: "   " })).toBe(0);
  });
});
