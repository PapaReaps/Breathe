import { describe, expect, it } from "vitest";
import { emptyForm, newIncomeRow } from "../src/logic/form";
import { SETUP_STEPS, firstSetupStep } from "../src/logic/setup";

const withMoney = (date: string) => ({ ...emptyForm(), income: [{ ...newIncomeRow(), name: "Wages", amount: "900", date, repeat: "monthly" as const }] });

describe("where the step-by-step setup starts", () => {
  it("starts with all the money coming in (v0.28.0: no separate main money)", () => {
    expect(SETUP_STEPS[0]).toBe("currency");
    expect(SETUP_STEPS[firstSetupStep(emptyForm())]).toBe("currency");
  });

  it("asks the questions in a calm order", () => {
    expect(SETUP_STEPS).toEqual(["currency", "income", "balance", "bills", "food", "pot"]);
  });

  it("carries on from the balance once money coming in is added, so nothing is asked twice", () => {
    expect(SETUP_STEPS[firstSetupStep(withMoney("2026-11-13"))]).toBe("balance");
  });

  it("an old main money date counts too", () => {
    expect(SETUP_STEPS[firstSetupStep({ ...emptyForm(), paydayDate: "2026-11-13" })]).toBe("balance");
  });

  it("starts from the top again when both are already answered", () => {
    expect(firstSetupStep({ ...withMoney("2026-11-13"), balance: "420" })).toBe(0);
  });

  it("a date of only spaces counts as nothing typed", () => {
    expect(firstSetupStep({ ...emptyForm(), paydayDate: "   " })).toBe(0);
  });
});
