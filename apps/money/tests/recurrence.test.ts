import { describe, expect, it } from "vitest";
import {
  buildInput,
  describeForm,
  emptyForm,
  newBillRow,
  newIncomeRow,
  paydayRuleQuestion,
} from "../src/logic/form";
import type { BuildResult, FormState } from "../src/logic/form";
import { words } from "../src/content/words";
import { addDays, daysBetween, formatDayLong } from "../src/logic/dates";
import { calculateSafeToSpend } from "../src/logic/safeToSpend";
import type { Repeat } from "../src/logic/repeat";

/*
 * Stage 7: things that repeat. Everything here is fictional.
 *
 * Today is Wednesday 4 November 2026 unless a test says otherwise.
 * November 2026 Fridays: 6, 13, 20, 27.   December 2026 Fridays: 4, 11, 18, 25.
 */
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
  return result;
}

function messagesOf(result: BuildResult): string[] {
  if (result.status !== "needs-more") throw new Error("expected needs-more");
  return result.messages;
}

function bill(amount: string, dueDate: string, repeat: Repeat) {
  return { ...newBillRow(), name: "Gym", amount, dueDate, repeat };
}

function income(amount: string, date: string, repeat: Repeat, reliability: "reliable" | "uncertain" = "reliable") {
  return { ...newIncomeRow(), name: "Wages", amount, date, repeat, reliability };
}

describe("a payday that repeats rolls forward by itself", () => {
  it("every week: the next Friday", () => {
    const built = ready(buildInput(filled({ paydayDate: "2026-10-30", paydayRepeat: "weekly" }), TODAY));
    expect(calculateSafeToSpend(built.input).paydayDate).toBe("2026-11-06");
  });

  it("every 2 weeks", () => {
    const built = ready(buildInput(filled({ paydayDate: "2026-10-30", paydayRepeat: "fortnightly" }), TODAY));
    expect(calculateSafeToSpend(built.input).paydayDate).toBe("2026-11-13");
  });

  it("every 4 weeks", () => {
    const built = ready(buildInput(filled({ paydayDate: "2026-10-09", paydayRepeat: "four-weekly" }), TODAY));
    expect(calculateSafeToSpend(built.input).paydayDate).toBe("2026-11-06");
  });

  it("every month, using the weekend answer", () => {
    // 14 Nov 2026 is a Saturday.
    const base = filled({ paydayDate: "2026-10-14", paydayRepeat: "monthly" });
    const before = ready(buildInput({ ...base, paydayRule: "working-day-before" }, TODAY));
    expect(calculateSafeToSpend(before.input).paydayDate).toBe("2026-11-13");
    const after = ready(buildInput({ ...base, paydayRule: "next-working-day" }, TODAY));
    expect(calculateSafeToSpend(after.input).paydayDate).toBe("2026-11-16");
    const same = ready(buildInput({ ...base, paydayRule: "on-the-day" }, TODAY));
    expect(calculateSafeToSpend(same.input).paydayDate).toBe("2026-11-14");
  });

  it("a payday on the 31st is the last day of shorter months", () => {
    const form = filled({ paydayDate: "2026-01-31", paydayRepeat: "monthly", paydayRule: "on-the-day" });
    expect(calculateSafeToSpend(ready(buildInput(form, "2026-04-10")).input).paydayDate).toBe("2026-04-30");
    expect(calculateSafeToSpend(ready(buildInput(form, "2027-02-10")).input).paydayDate).toBe("2027-02-28");
    expect(calculateSafeToSpend(ready(buildInput(form, "2028-02-10")).input).paydayDate).toBe("2028-02-29");
  });

  it("payday today is still payday today, not a day that has passed", () => {
    const built = ready(buildInput(filled({ paydayDate: "2026-10-28", paydayRepeat: "weekly" }), TODAY));
    const result = calculateSafeToSpend(built.input);
    expect(result.paydayDate).toBe(TODAY);
    expect(result.safeToSpend).not.toBeNull();
  });

  it("a payday date far in the past still finds the right Friday", () => {
    const built = ready(buildInput(filled({ paydayDate: "2020-01-03", paydayRepeat: "weekly" }), TODAY));
    expect(calculateSafeToSpend(built.input).paydayDate).toBe("2026-11-06");
  });

  it("a first payday still to come is used as it is", () => {
    const built = ready(buildInput(filled({ paydayDate: "2027-01-08", paydayRepeat: "monthly", paydayRule: "on-the-day" }), TODAY));
    expect(calculateSafeToSpend(built.input).paydayDate).toBe("2027-01-08");
  });

  it("a single payday that has gone by still asks for an update, as before", () => {
    const built = ready(buildInput(filled({ paydayDate: "2026-10-30" }), TODAY));
    const result = calculateSafeToSpend(built.input);
    expect(result.safeToSpend).toBeNull();
    expect(result.warnings.some((w) => w.kind === "payday-passed")).toBe(true);
  });

  it("saved numbers without a repeat behave as one date only", () => {
    const old = filled({ paydayDate: "2026-11-20" }) as unknown as Record<string, unknown>;
    delete old.paydayRepeat;
    const built = ready(buildInput(old as unknown as FormState, TODAY));
    expect(calculateSafeToSpend(built.input).paydayDate).toBe("2026-11-20");
  });
});

describe("the weekend question for a repeating payday", () => {
  it("every month always asks, because some months land on a weekend", () => {
    const form = filled({ paydayDate: "2026-11-20", paydayRepeat: "monthly" });
    expect(paydayRuleQuestion(form, TODAY)).toBe(words.askPaydayRuleMonthly);
    expect(messagesOf(buildInput(form, TODAY))).toEqual([words.askPaydayRuleMonthly]);
  });

  it("every week on a Friday does not ask", () => {
    const form = filled({ paydayDate: "2026-10-30", paydayRepeat: "weekly" });
    expect(paydayRuleQuestion(form, TODAY)).toBeNull();
    expect(buildInput(form, TODAY).status).toBe("ready");
  });

  it("every week asks if the next one is a bank holiday", () => {
    const form = filled({ paydayDate: "2026-10-30", paydayRepeat: "weekly", bankHolidays: "2026-11-06" });
    expect(paydayRuleQuestion(form, TODAY)).toBe(words.askPaydayRule("a bank holiday"));
  });

  it("every week on a Saturday asks", () => {
    const form = filled({ paydayDate: "2026-10-31", paydayRepeat: "weekly" });
    expect(paydayRuleQuestion(form, TODAY)).toBe(words.askPaydayRule("a Saturday"));
  });

  it("one date only asks exactly as it always did", () => {
    expect(paydayRuleQuestion(filled({ paydayDate: "2026-11-14" }), TODAY)).toBe(words.askPaydayRule("a Saturday"));
    expect(paydayRuleQuestion(filled(), TODAY)).toBeNull();
  });
});

describe('"paid since your last update"', () => {
  const weekly = { paydayDate: "2026-10-30", paydayRepeat: "weekly" as const };

  it("notices a payday that has gone by since the balance was entered", () => {
    const built = ready(buildInput(filled({ ...weekly, balanceDate: "2026-10-28" }), TODAY));
    expect(built.paidSince).toBe("2026-10-30");
  });

  it("says nothing when the balance was entered today", () => {
    expect(ready(buildInput(filled({ ...weekly, balanceDate: TODAY }), TODAY)).paidSince).toBeNull();
    expect(ready(buildInput(filled({ ...weekly }), TODAY)).paidSince).toBeNull();
  });

  it("says nothing when the balance was entered on payday itself", () => {
    expect(ready(buildInput(filled({ ...weekly, balanceDate: "2026-10-30" }), TODAY)).paidSince).toBeNull();
  });

  it("says nothing when payday is today (the money may not be in yet)", () => {
    const built = ready(buildInput(filled({ paydayDate: "2026-10-28", paydayRepeat: "weekly", balanceDate: "2026-11-02" }), TODAY));
    expect(built.paidSince).toBeNull();
  });

  it("names the most recent payday when several have gone by", () => {
    const built = ready(buildInput(filled({ ...weekly, balanceDate: "2026-10-01" }), TODAY));
    expect(built.paidSince).toBe("2026-10-30");
  });

  it("uses the weekend answer for the payday that went by", () => {
    // 17 Oct 2026 is a Saturday, so payday was really Friday 16 Oct.
    const form = filled({
      paydayDate: "2026-09-17",
      paydayRepeat: "monthly",
      paydayRule: "working-day-before",
      balanceDate: "2026-10-15",
    });
    expect(ready(buildInput(form, TODAY)).paidSince).toBe("2026-10-16");
  });

  it("a one-off payday never says it", () => {
    expect(ready(buildInput(filled({ paydayDate: "2026-11-20", balanceDate: "2026-10-01" }), TODAY)).paidSince).toBeNull();
  });

  it("the number stays cautious: the new pay is not added to an old balance", () => {
    // Balance £100 entered 28 Oct. Food £70 a week. Next payday Fri 6 Nov: 9 days = £90.
    const form = filled({ ...weekly, balance: "100", balanceDate: "2026-10-28", foodPerWeek: "70" });
    const built = ready(buildInput(form, TODAY));
    expect(calculateSafeToSpend(built.input).safeToSpend).toBe(1000);
  });
});

describe("bills that repeat", () => {
  it("a one-off bill is exactly as before", () => {
    const one = bill("100", "2026-11-10", "once");
    const built = ready(buildInput(filled({ bills: [one] }), TODAY));
    expect(built.input.bills.map((b) => [b.id, b.dueDate])).toEqual([[one.id, "2026-11-10"]]);
  });

  it("a bill with no repeat saved counts as one-off", () => {
    const old = { ...newBillRow(), name: "Gas", amount: "12", dueDate: "2026-11-10" } as unknown as Record<string, unknown>;
    delete old.repeat;
    const built = ready(buildInput(filled({ bills: [old as never] }), TODAY));
    expect(built.input.bills).toHaveLength(1);
  });

  it("every month: only the one before payday counts", () => {
    const rent = bill("100", "2026-10-13", "monthly");
    const built = ready(buildInput(filled({ bills: [rent] }), TODAY));
    expect(built.input.bills.map((b) => b.dueDate)).toEqual(["2026-11-13"]);
    expect(calculateSafeToSpend(built.input).safeToSpend).toBe(32000);
  });

  it("every week: counts each time, including one that lands on payday", () => {
    // Fridays 6, 13 and 20 Nov (20 Nov is payday, and money going out counts up to payday).
    const built = ready(buildInput(filled({ bills: [bill("10", "2026-10-30", "weekly")] }), TODAY));
    expect(built.input.bills.map((b) => b.dueDate)).toEqual(["2026-11-06", "2026-11-13", "2026-11-20"]);
    expect(calculateSafeToSpend(built.input).safeToSpend).toBe(39000);
  });

  it("every week: a bill from before the balance date is not counted again", () => {
    const built = ready(buildInput(filled({ bills: [bill("10", "2026-10-30", "weekly")] }), TODAY));
    expect(built.input.bills.some((b) => b.dueDate < TODAY)).toBe(false);
  });

  it("every 2 weeks", () => {
    const built = ready(buildInput(filled({ bills: [bill("10", "2026-11-06", "fortnightly")] }), TODAY));
    expect(built.input.bills.map((b) => b.dueDate)).toEqual(["2026-11-06", "2026-11-20"]);
  });

  it("every 4 weeks", () => {
    const built = ready(buildInput(filled({ bills: [bill("10", "2026-11-06", "four-weekly")] }), TODAY));
    expect(built.input.bills.map((b) => b.dueDate)).toEqual(["2026-11-06"]);
  });

  it("a bill on the 31st lands on the last day of a short month", () => {
    const form = filled({ paydayDate: "2027-03-03", bills: [bill("40", "2026-12-31", "monthly")] });
    const built = ready(buildInput(form, "2027-02-20"));
    expect(built.input.bills.map((b) => b.dueDate)).toEqual(["2027-02-28"]);
  });

  it("a bill on the 29th in a leap year", () => {
    const form = filled({ paydayDate: "2028-03-03", bills: [bill("40", "2027-12-29", "monthly")] });
    const built = ready(buildInput(form, "2028-02-20"));
    expect(built.input.bills.map((b) => b.dueDate)).toEqual(["2028-02-29"]);
  });

  it("a repeating bill that starts after payday is not counted yet", () => {
    const built = ready(buildInput(filled({ bills: [bill("100", "2026-11-25", "weekly")] }), TODAY));
    expect(built.input.bills).toEqual([]);
  });

  it("each time has its own id, so an answer belongs to one date only", () => {
    const gym = bill("10", "2026-10-30", "weekly");
    const built = ready(buildInput(filled({ bills: [gym] }), TODAY));
    const ids = built.input.bills.map((b) => b.id);
    expect(new Set(ids).size).toBe(3);
    expect(ids[0]).toBe(`${gym.id}@2026-11-06`);
  });

  it("a bill on the day the balance was entered still asks", () => {
    const gym = bill("10", TODAY, "weekly");
    const built = ready(buildInput(filled({ bills: [gym] }), TODAY));
    const result = calculateSafeToSpend(built.input);
    const asked = result.warnings.filter((w) => w.kind === "needs-answer");
    expect(asked).toHaveLength(1);
    const answered = ready(buildInput(filled({ bills: [gym], answers: { [`${gym.id}@${TODAY}`]: true } }), TODAY));
    expect(calculateSafeToSpend(answered.input).warnings.filter((w) => w.kind === "needs-answer")).toHaveLength(0);
  });

  it("a half-filled repeating bill gets the same gentle nudge", () => {
    const half = { ...bill("10", "", "weekly"), name: "Gym" };
    expect(messagesOf(buildInput(filled({ bills: [half] }), TODAY))).toEqual([
      words.unfinishedRow("Gym", "an amount and a due date"),
    ]);
  });
});

describe("money coming in that repeats", () => {
  it("every week: counts before payday, not on payday itself", () => {
    const built = ready(buildInput(filled({ income: [income("50", "2026-11-06", "weekly")] }), TODAY));
    expect(built.input.income.map((i) => i.date)).toEqual(["2026-11-06", "2026-11-13", "2026-11-20"]);
    // The calculator itself leaves out the one on payday (it belongs to the next period).
    expect(calculateSafeToSpend(built.input).safeToSpend).toBe(52000);
  });

  it("every month", () => {
    const built = ready(buildInput(filled({ income: [income("200", "2026-10-12", "monthly")] }), TODAY));
    expect(built.input.income.map((i) => i.date)).toEqual(["2026-11-12"]);
    expect(calculateSafeToSpend(built.input).safeToSpend).toBe(62000);
  });

  it("repeating money that might not come is listed, never added", () => {
    const built = ready(buildInput(filled({ income: [income("50", "2026-11-06", "weekly", "uncertain")] }), TODAY));
    const result = calculateSafeToSpend(built.input);
    expect(result.safeToSpend).toBe(42000);
    expect(result.uncertainIncome.total).toBe(10000);
  });

  it("money arriving on the day the balance was entered asks, and is not added until answered", () => {
    const wages = income("50", TODAY, "weekly");
    const asked = calculateSafeToSpend(ready(buildInput(filled({ income: [wages] }), TODAY)).input);
    expect(asked.warnings.filter((w) => w.kind === "needs-answer")).toHaveLength(1);
    const no = ready(buildInput(filled({ income: [wages], answers: { [`${wages.id}@${TODAY}`]: false } }), TODAY));
    expect(calculateSafeToSpend(no.input).safeToSpend).toBe(42000 + 5000 * 3); // 4th (answered no), 11th, 18th
  });
});

describe("the balance reminder", () => {
  it("passes the number of days through to the calculation", () => {
    const form = filled({ balanceDate: "2026-11-03" });
    const quiet = calculateSafeToSpend(ready(buildInput(form, TODAY)).input);
    expect(quiet.warnings.some((w) => w.kind === "balance-out-of-date")).toBe(false);
    const daily = calculateSafeToSpend(ready(buildInput(form, TODAY, { staleAfterDays: 0 })).input);
    expect(daily.warnings.some((w) => w.kind === "balance-out-of-date")).toBe(true);
  });

  it("a very large number means never", () => {
    const form = filled({ balanceDate: "2026-09-01" });
    const result = calculateSafeToSpend(ready(buildInput(form, TODAY, { staleAfterDays: Number.MAX_SAFE_INTEGER })).input);
    expect(result.warnings.some((w) => w.kind === "balance-out-of-date")).toBe(false);
  });
});

describe("the menu summary of a repeating payday", () => {
  it("shows the next payday and how often", () => {
    const form = filled({ paydayDate: "2026-10-30", paydayRepeat: "weekly" });
    expect(describeForm(form, TODAY).payday).toBe(words.paydaySummary(formatDayLong("2026-11-06"), "weekly"));
  });

  it("a single date reads as it always did", () => {
    expect(describeForm(filled(), TODAY).payday).toContain("20 Nov");
  });
});

describe("a big random check against a slow day-by-day count", () => {
  const SERIES: Repeat[] = ["weekly", "fortnightly", "four-weekly", "monthly"];
  const STEP: Record<string, number> = { weekly: 7, fortnightly: 14, "four-weekly": 28 };

  function matches(day: string, anchor: string, repeat: Repeat): boolean {
    if (day < anchor) return false;
    if (repeat === "monthly") {
      const [y, m] = day.split("-").map(Number) as [number, number];
      const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
      return Number(day.slice(8)) === Math.min(Number(anchor.slice(8)), last);
    }
    return daysBetween(anchor, day) % STEP[repeat]! === 0;
  }

  it("agrees on 10,000 random months", () => {
    let seed = 987654;
    const random = (n: number): number => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return Math.floor((seed / 4294967296) * n);
    };
    for (let i = 0; i < 10000; i++) {
      const today = addDays("2025-01-01", random(1100));
      const balanceDate = addDays(today, -random(9));
      const paydayAnchor = addDays(today, random(500) - 300);
      const paydayRepeat = SERIES[random(4)]!;
      const billAnchor = addDays(today, random(200) - 100);
      const billRepeat = SERIES[random(4)]!;
      const incomeAnchor = addDays(today, random(200) - 100);
      const incomeRepeat = SERIES[random(4)]!;

      const form = filled({
        balance: String(500 + random(500)),
        balanceDate,
        paydayDate: paydayAnchor,
        paydayRepeat,
        paydayRule: "on-the-day",
        bills: [bill("17.35", billAnchor, billRepeat)],
        income: [income("23.10", incomeAnchor, incomeRepeat)],
        foodPerWeek: "45.50",
      });
      const built = ready(buildInput(form, today));
      const result = calculateSafeToSpend(built.input);

      // The slow way, one day at a time.
      let payday = today;
      while (!matches(payday, paydayAnchor, paydayRepeat) && true) {
        payday = addDays(payday, 1);
        if (daysBetween(today, payday) > 400) throw new Error("no payday found");
      }
      // A first payday that is still to come is used as it is.
      if (paydayAnchor > today) payday = paydayAnchor;
      expect(result.paydayDate).toBe(payday);

      let billsOut = 0;
      let moneyIn = 0;
      for (let day = balanceDate; day <= payday; day = addDays(day, 1)) {
        if (matches(day, billAnchor, billRepeat)) billsOut += 1735;
        if (day < payday && day > balanceDate && matches(day, incomeAnchor, incomeRepeat)) moneyIn += 2310;
      }
      const days = daysBetween(balanceDate, payday);
      const food = Math.ceil((4550 * days) / 7);
      const balancePence = Number(form.balance) * 100;
      expect(result.safeToSpend).toBe(balancePence - billsOut + moneyIn - food);
    }
  }, 120_000);
});
