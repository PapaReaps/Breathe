import { describe, expect, it } from "vitest";
import { addDays, dayOfWeek } from "../src/logic/dates";
import { buildInput, emptyForm, migrateMainMoney, newBillRow, newIncomeRow, stopRow } from "../src/logic/form";
import type { FormState, IncomeRow } from "../src/logic/form";
import type { Repeat } from "../src/logic/repeat";
import { calculateSafeToSpend } from "../src/logic/safeToSpend";
import { fromSaved, toSaved } from "../src/storage/savedData";

/*
 * v0.28.0: all money is money coming in. The number plans until the biggest regular payment
 * (or the one the person picks). Everything here is fictional.
 */

const today = "2026-11-07"; // Saturday

function money(name: string, amount: string, date: string, repeat: Repeat = "once"): IncomeRow {
  return { ...newIncomeRow(), name, amount, date, repeat };
}
function form(income: IncomeRow[], extra: Partial<FormState> = {}): FormState {
  return { ...emptyForm(), balance: "120", balanceDate: today, paydayRule: "working-day-before", income, ...extra };
}
function ready(f: FormState) {
  const built = buildInput(f, today);
  if (built.status !== "ready") throw new Error(`should be ready: ${built.messages.join(" / ")}`);
  return { built, result: calculateSafeToSpend(built.input) };
}

describe("which money the number plans until", () => {
  const uc = money("Universal Credit", "850", "2026-11-27", "monthly");
  const pip = money("PIP", "434", "2026-11-17", "four-weekly");
  const cb = money("Child Benefit", "26.05", "2026-11-09", "weekly");

  it("picks the biggest regular payment", () => {
    expect(stopRow(form([cb, pip, uc]), today)?.name).toBe("Universal Credit");
    const { built, result } = ready(form([cb, pip, uc]));
    expect(result.paydayDate).toBe("2026-11-27");
    expect(built.status === "ready" && built.moneyName).toBe("Universal Credit");
  });

  it("counts every other payment before then, from the day it arrives", () => {
    const { built } = ready(form([cb, pip, uc]));
    if (built.status !== "ready") throw new Error();
    const names = built.input.income.map((item) => item.name);
    expect(names.filter((name) => name === "PIP")).toHaveLength(1);
    expect(names.filter((name) => name === "Child Benefit")).toHaveLength(3); // 9, 16 and 23 Nov
    expect(names).not.toContain("Universal Credit");
  });

  it("if two are the same size, plans until the later one (the more cautious)", () => {
    const a = money("A", "500", "2026-11-12", "monthly");
    const b = money("B", "500", "2026-11-20", "monthly");
    expect(stopRow(form([a, b]), today)?.name).toBe("B");
  });

  it("a regular payment wins over a bigger one-off", () => {
    const refund = money("Refund", "2000", "2026-11-10");
    expect(stopRow(form([refund, uc]), today)?.name).toBe("Universal Credit");
  });

  it("with nothing regular, plans until the biggest one-off still to come", () => {
    const a = money("Old", "900", "2026-11-01");
    const b = money("Grant", "300", "2026-11-20");
    const c = money("Refund", "50", "2026-11-12");
    expect(stopRow(form([a, b, c]), today)?.name).toBe("Grant");
  });

  it("the person can choose a different one", () => {
    expect(stopRow(form([cb, pip, uc], { planUntil: pip.id }), today)?.name).toBe("PIP");
    const { result } = ready(form([cb, pip, uc], { planUntil: pip.id }));
    expect(result.paydayDate).toBe("2026-11-17");
  });

  it("if the chosen one is removed, it goes back to the biggest", () => {
    expect(stopRow(form([cb, uc], { planUntil: pip.id }), today)?.name).toBe("Universal Credit");
  });

  it("with no money coming in yet, it gently asks for some", () => {
    const built = buildInput(form([]), today);
    expect(built.status).toBe("needs-more");
  });

  it("the payment it plans until doesn't need an amount if it was chosen", () => {
    const noAmount = money("Wages", "", "2026-11-27", "monthly");
    const { result } = ready(form([noAmount], { planUntil: noAmount.id }));
    expect(result.paydayDate).toBe("2026-11-27");
  });
});

describe("people who already had a main money", () => {
  it("their main money moves into the list, and the number stays exactly the same", () => {
    const old: FormState = {
      ...emptyForm(),
      balance: "300",
      balanceDate: today,
      paydayName: "Universal Credit",
      paydayDate: "2026-11-27",
      paydayRepeat: "monthly",
      paydayRule: "working-day-before",
      income: [money("PIP", "434", "2026-11-17", "four-weekly")],
      bills: [{ ...newBillRow(), name: "Rent", amount: "200", dueDate: "2026-11-20" }],
    };
    const moved = migrateMainMoney(old);
    expect(moved.paydayDate).toBe("");
    expect(moved.income[0]).toMatchObject({ name: "Universal Credit", amount: "", date: "2026-11-27", repeat: "monthly" });
    expect(stopRow(moved, today)?.name).toBe("Universal Credit");
    // Saved and opened again: the same number, the same day.
    const reopened = fromSaved(toSaved(old));
    if (reopened === null) throw new Error();
    expect(ready(reopened).result.safeToSpend).toBe(30000 + 43400 - 20000);
    expect(ready(reopened).result.paydayDate).toBe("2026-11-27");
  });

  it("moving twice changes nothing", () => {
    const old = { ...emptyForm(), paydayDate: "2026-11-27", paydayName: "Wages" };
    expect(migrateMainMoney(migrateMainMoney(old))).toEqual(migrateMainMoney(old));
  });
});

/*
 * 1,000 random months: listing the biggest payment as money coming in (the new way) gives
 * exactly the same number as having it as a separate main money (the old way).
 */
let seed = 4242;
function random(below: number): number {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return Math.floor((seed / 4294967296) * below);
}
const REPEATS: Repeat[] = ["weekly", "fortnightly", "four-weekly", "monthly"];

describe("the new way and the old way agree", () => {
  it("1,000 random months give the same number to the penny", () => {
    let mismatches = 0;
    for (let i = 0; i < 1000; i++) {
      let big = addDays(today, 2 + random(28));
      while (dayOfWeek(big) === 0 || dayOfWeek(big) === 6) big = addDays(big, 1);
      const bigRepeat = REPEATS[random(4)]!;
      const others: IncomeRow[] = [];
      for (let n = 0; n < random(4); n++) {
        others.push(money(`In ${n}`, String(1 + random(400)), addDays(today, 1 + random(20)), random(2) ? "once" : REPEATS[random(4)]!));
      }
      const bills = [];
      for (let b = 0; b < random(4); b++) {
        bills.push({ ...newBillRow(), name: `Bill ${b}`, amount: String(1 + random(300)), dueDate: addDays(today, 1 + random(25)) });
      }
      const base = { ...emptyForm(), balance: String(random(900)), balanceDate: today, paydayRule: "on-the-day" as const, bills, foodPerWeek: String(random(80)) };

      const oldWay: FormState = { ...base, paydayName: "Big", paydayDate: big, paydayRepeat: bigRepeat, income: others };
      const newWay: FormState = { ...base, income: [money("Big", "5000", big, bigRepeat), ...others] };

      const a = buildInput(oldWay, today);
      const b = buildInput(newWay, today);
      if (a.status !== "ready" || b.status !== "ready") {
        if (a.status !== b.status) mismatches += 1;
        continue;
      }
      const ra = calculateSafeToSpend(a.input);
      const rb = calculateSafeToSpend(b.input);
      if (ra.safeToSpend !== rb.safeToSpend || ra.safeNow !== rb.safeNow || ra.paydayDate !== rb.paydayDate) mismatches += 1;
    }
    expect(mismatches).toBe(0);
  });
});
