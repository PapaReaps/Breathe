import { describe, expect, it } from "vitest";
import { buildInput, emptyForm, newBillRow, newIncomeRow, parseDayList } from "../src/logic/form";
import type { BuildResult, FormState } from "../src/logic/form";
import { words } from "../src/content/words";
import { calculateSafeToSpend } from "../src/logic/safeToSpend";

// Today is Wednesday 4 November 2026 in all of these. Everything is fictional.
const TODAY = "2026-11-04";

function filled(overrides: Partial<FormState> = {}): FormState {
  return {
    ...emptyForm(),
    balance: "420",
    paydayDate: "2026-11-20", // a Friday
    ...overrides,
  };
}

function ready(result: BuildResult) {
  if (result.status !== "ready") throw new Error("expected ready, got: " + result.messages.join(" | "));
  return result.input;
}

function messagesOf(result: BuildResult): string[] {
  if (result.status !== "needs-more") throw new Error("expected needs-more");
  return result.messages;
}

describe("turning the form into calculator input", () => {
  it("an empty form gently asks for the balance and the payday", () => {
    const result = buildInput(emptyForm(), TODAY);
    expect(messagesOf(result)).toEqual([words.needBalance, words.needPayday]);
  });

  it("a realistic month adds up (£218.00), and savings never change it", () => {
    const bill = { ...newBillRow(), name: "Phone", amount: "18", dueDate: "2026-11-10" };
    const input = ready(
      buildInput(
        filled({ bills: [bill], foodPerWeek: "63", travelPerWeek: "17.50", buffer: "50" }),
        TODAY,
      ),
    );
    // 16 days to payday. 420 - 18 - food (63 a week = 144) - travel (17.50 a week = 40).
    // Savings (50) are a separate tracker, so they are not taken off.
    expect(calculateSafeToSpend(input).safeToSpend).toBe(21800);
  });

  it("blank rows are ignored, and half-filled rows get a gentle nudge", () => {
    expect(buildInput(filled({ bills: [newBillRow(), newBillRow()] }), TODAY).status).toBe("ready");

    const half = { ...newBillRow(), name: "Rent", amount: "50", dueDate: "" };
    const result = buildInput(filled({ bills: [half] }), TODAY);
    expect(messagesOf(result)).toEqual([words.unfinishedRow("Rent", "an amount and a due date")]);
  });

  it("an amount that can't be read gets a kind message, not an error", () => {
    expect(messagesOf(buildInput(filled({ balance: "abc" }), TODAY))).toContain(
      words.cantReadAmount("your account balance"),
    );
    const bill = { ...newBillRow(), name: "Gas", amount: "12.505", dueDate: "2026-11-10" };
    expect(messagesOf(buildInput(filled({ bills: [bill] }), TODAY))).toContain(
      words.cantReadAmount('"Gas"'),
    );
  });

  it("an overdrawn balance is allowed", () => {
    const input = ready(buildInput(filled({ balance: "-20" }), TODAY));
    expect(input.balance.amount).toBe(-2000);
  });

  it("a balance dated in the future is declined kindly", () => {
    const result = buildInput(filled({ balanceDate: "2026-11-09" }), TODAY);
    expect(messagesOf(result)).toContain(words.balanceDateFuture);
  });

  it("only asks the weekend question when payday is a weekend or bank holiday", () => {
    const saturday = filled({ paydayDate: "2026-11-14" });
    const asked = messagesOf(buildInput(saturday, TODAY));
    expect(asked).toEqual([words.askPaydayRule("a Saturday")]);

    const answered = ready(buildInput({ ...saturday, paydayRule: "working-day-before" }, TODAY));
    expect(calculateSafeToSpend(answered).paydayDate).toBe("2026-11-13");

    const holiday = filled({ paydayDate: "2026-11-09", bankHolidays: "2026-11-09" });
    expect(messagesOf(buildInput(holiday, TODAY))).toEqual([words.askPaydayRule("a bank holiday")]);

    // A normal weekday never asks.
    expect(buildInput(filled(), TODAY).status).toBe("ready");
  });

  it("reads a typed list of bank holidays", () => {
    expect(parseDayList("2026-12-25, 2026-12-28\n2027-01-01")).toEqual({
      days: ["2026-12-25", "2026-12-28", "2027-01-01"],
      bad: [],
    });
    expect(parseDayList("2026-12-25 xx 2026-02-30")).toEqual({
      days: ["2026-12-25"],
      bad: ["xx", "2026-02-30"],
    });
    expect(parseDayList("")).toEqual({ days: [], bad: [] });

    const result = buildInput(filled({ bankHolidays: "25 December" }), TODAY);
    expect(messagesOf(result)).toEqual([words.cantReadDates("25, December")]);
  });

  it("uses the person's answer to 'is this already in your balance?'", () => {
    const bill = { ...newBillRow(), name: "Mum", amount: "100", dueDate: TODAY };

    const unanswered = calculateSafeToSpend(ready(buildInput(filled({ bills: [bill] }), TODAY)));
    expect(unanswered.safeToSpend).toBe(42000 - 10000);
    expect(unanswered.warnings.some((w) => w.kind === "needs-answer")).toBe(true);

    const yes = calculateSafeToSpend(
      ready(buildInput(filled({ bills: [bill], answers: { [bill.id]: true } }), TODAY)),
    );
    expect(yes.safeToSpend).toBe(42000);
    expect(yes.warnings.some((w) => w.kind === "needs-answer")).toBe(false);

    const no = calculateSafeToSpend(
      ready(buildInput(filled({ bills: [bill], answers: { [bill.id]: false } }), TODAY)),
    );
    expect(no.safeToSpend).toBe(32000);
  });

  it("all extra money counts, including any saved as 'not sure' before that choice was removed", () => {
    const sure = { ...newIncomeRow(), name: "Refund", amount: "30", date: "2026-11-10" };
    const older = { ...newIncomeRow(), name: "Extra shift", amount: "80", date: "2026-11-12", reliability: "uncertain" as const };
    const result = calculateSafeToSpend(ready(buildInput(filled({ income: [sure, older] }), TODAY)));
    expect(result.safeToSpend).toBe(42000 + 3000 + 8000);
    expect(result.uncertainIncome.total).toBe(0);
  });
});
