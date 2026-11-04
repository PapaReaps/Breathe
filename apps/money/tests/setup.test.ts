import { describe, expect, it } from "vitest";
import { emptyForm } from "../src/logic/form";
import { SETUP_STEPS, firstSetupStep } from "../src/logic/setup";

describe("where the step-by-step setup starts", () => {
  it("starts at the balance for someone brand new", () => {
    expect(firstSetupStep(emptyForm())).toBe(0);
  });

  it("carries on from payday once a balance is in, so nothing is asked twice", () => {
    expect(SETUP_STEPS[firstSetupStep({ ...emptyForm(), balance: "420" })]).toBe("payday");
  });

  it("starts from the top again when both are already answered", () => {
    expect(firstSetupStep({ ...emptyForm(), balance: "420", paydayDate: "2026-11-13" })).toBe(0);
  });

  it("a balance of only spaces counts as nothing typed", () => {
    expect(firstSetupStep({ ...emptyForm(), balance: "   " })).toBe(0);
  });
});
