import { describe, expect, it } from "vitest";
import {
  describeLine,
  describeWarning,
  headlineFor,
  moneyProblemMessage,
  paydayLine,
  questionFor,
  words,
} from "../src/content/words";
import { describeForm, emptyForm } from "../src/logic/form";
import { calculateSafeToSpend } from "../src/logic/safeToSpend";
import type { BreakdownLine, Warning } from "../src/logic/types";
import { gbp, makeInput } from "./helpers";

// Words we never want in Breathe. Add more as we learn.
const WORDS_WE_AVOID = [
  "overdue", "failed", "failure", "lazy", "irresponsible", "guilty", "shame",
  "streak", "you must", "you should", "you need to", "warning", "error", "wrong",
  "careless", "blame", "debt", "poor", "bad ",
];

function everyString(value: unknown, found: string[] = []): string[] {
  if (typeof value === "string") found.push(value);
  else if (value && typeof value === "object") {
    for (const inner of Object.values(value)) everyString(inner, found);
  }
  return found;
}

function collectSampleSentences(): string[] {
  const sentences = everyString(words);

  sentences.push(
    words.askPaydayRule("a Saturday"),
    words.cantReadAmount("rent"),
    words.cantReadDate("your payday"),
    words.cantReadDates("25 December"),
    words.unfinishedRow("Rent", "an amount"),
    words.menu.liveLine("£10.00"),
    words.setup.progress(2, 6),
    words.rows.totalBills(3, "£10.00"),
    words.rows.totalIncome(1, "£10.00"),
    words.home.potLine("£50.00"),
    words.data.restorePreview(null),
    words.data.restorePreview("Wednesday 4 November"),
    ...Object.values(describeForm(emptyForm())),
  );
  for (const reason of ["not-a-number", "too-many-decimals", "negative-not-allowed", "too-large"] as const) {
    sentences.push(moneyProblemMessage(reason));
  }

  const tight = calculateSafeToSpend(
    makeInput({
      balance: { amount: gbp(10), asOf: "2026-11-04" },
      bills: [{ id: "b", name: "Mum", amount: gbp(50), dueDate: "2026-11-10" }],
    }),
  );
  const exactlyZero = calculateSafeToSpend(
    makeInput({
      balance: { amount: gbp(50), asOf: "2026-11-04" },
      bills: [{ id: "b", name: "Mum", amount: gbp(50), dueDate: "2026-11-10" }],
    }),
  );
  const plenty = calculateSafeToSpend(makeInput());
  const passed = calculateSafeToSpend(
    makeInput({ today: "2026-11-20", balance: { amount: gbp(10), asOf: "2026-11-20" } }),
  );
  for (const result of [tight, exactlyZero, plenty, passed]) {
    const head = headlineFor(result);
    sentences.push(head.title, head.message);
    if (head.amount) sentences.push(head.amount);
    sentences.push(paydayLine(result.paydayDate, result.daysUntilPayday));
  }
  sentences.push(paydayLine("2026-11-13", 0), paydayLine("2026-11-13", 1), paydayLine("2026-11-13", 5));

  const warnings: Warning[] = [
    { kind: "payday-passed" },
    { kind: "balance-out-of-date", daysOld: 5 },
    { kind: "uncertain-income-not-counted", amount: gbp(40) },
    { kind: "uncertain-income-would-cover-shortfall" },
  ];
  for (const warning of warnings) {
    const text = describeWarning(warning);
    if (text) sentences.push(text);
  }
  sentences.push(
    questionFor({ kind: "needs-answer", itemType: "bill", id: "b", name: "Mum" }),
    questionFor({ kind: "needs-answer", itemType: "income", id: "i", name: "Refund" }),
  );

  const lines: BreakdownLine[] = [
    { kind: "balance", amount: gbp(100) },
    { kind: "bill", name: "Mum", amount: -gbp(50) },
    { kind: "income", name: "Refund", amount: gbp(20) },
    { kind: "essential", name: "Travel", amount: -gbp(10) },
    { kind: "essential", name: "Food", amount: -6429, spread: { perWeek: gbp(50), days: 9 } },
    { kind: "buffer", amount: -gbp(30) },
    { kind: "savings", name: "Pot", amount: -gbp(10) },
    { kind: "pending", name: "Shop", amount: -gbp(5) },
  ];
  for (const line of lines) {
    const described = describeLine(line);
    sentences.push(described.label, described.amountText);
  }
  return sentences;
}

describe("the wording stays kind", () => {
  it("never uses shame, guilt or pressure words anywhere on the screen", () => {
    const sentences = collectSampleSentences();
    expect(sentences.length > 40).toBe(true);
    for (const sentence of sentences) {
      for (const word of WORDS_WE_AVOID) {
        expect(sentence.toLowerCase()).not.toContain(word);
      }
    }
  });

  it("a tight month gets a calm title, and a number written as 'short'", () => {
    const tight = calculateSafeToSpend(
      makeInput({
        balance: { amount: gbp(10), asOf: "2026-11-04" },
        bills: [{ id: "b", name: "Mum", amount: gbp(50), dueDate: "2026-11-10" }],
      }),
    );
    const head = headlineFor(tight);
    expect(head.title).toBe("Things are tight until payday");
    expect(head.amount).toBe("£40.00 short");
  });

  it("a plentiful month shows the plain number", () => {
    const head = headlineFor(calculateSafeToSpend(makeInput()));
    expect(head.title).toBe("Safe to spend until payday");
    expect(head.amount).toBe("£1,000.00");
  });

  it("describes payday in plain words", () => {
    expect(paydayLine("2026-11-13", 9)).toBe("Payday: Friday 13 November (in 9 days)");
    expect(paydayLine("2026-11-13", 1)).toBe("Payday: Friday 13 November (tomorrow)");
    expect(paydayLine("2026-11-13", 0)).toBe("Payday: Friday 13 November (today)");
  });
});
