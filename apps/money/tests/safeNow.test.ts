import { describe, expect, it } from "vitest";
import { addDays, dayOfWeek, daysBetween } from "../src/logic/dates";
import { buildInput, emptyForm, newBillRow, newIncomeRow } from "../src/logic/form";
import type { FormState } from "../src/logic/form";
import { calculateSafeToSpend } from "../src/logic/safeToSpend";

/*
 * "Safe to spend right now": money coming in only counts from the day it arrives.
 * The full figure (safeToSpend) is unchanged; safeNow is what the home screen shows.
 */

const today = "2026-11-07"; // a Saturday
const payday = "2026-11-27";

function form(balance: string): FormState {
  const f = emptyForm();
  f.balance = balance;
  f.balanceDate = today;
  f.paydayDate = payday;
  return f;
}
function bill(f: FormState, amount: string, dueDate: string, name = "Bill") {
  f.bills.push({ ...newBillRow(), name, amount, dueDate });
}
function income(f: FormState, amount: string, date: string, name = "Money in") {
  f.income.push({ ...newIncomeRow(), name, amount, date });
}
function result(f: FormState) {
  const built = buildInput(f, today);
  if (built.status !== "ready") throw new Error("should be ready");
  return calculateSafeToSpend(built.input);
}

describe("safe to spend right now", () => {
  it("doesn't count money that isn't here yet (£11.50 now, £140 on Mon 9 Nov, £10 going out later)", () => {
    const f = form("11.50");
    income(f, "140", "2026-11-09");
    bill(f, "10", "2026-11-20");
    const r = result(f);
    expect(r.safeToSpend).toBe(14150);
    expect(r.safeNow).toBe(1150);
    expect(r.heldBack).toEqual({ amount: 13000, nextIncome: { date: "2026-11-09", amount: 14000 } });
  });

  it("takes off a bill that's due before the money arrives", () => {
    const f = form("11.50");
    income(f, "140", "2026-11-09");
    bill(f, "10", "2026-11-08");
    expect(result(f).safeNow).toBe(150);
  });

  it("takes a bill on the same day as the money first, to be safe", () => {
    const f = form("11.50");
    income(f, "140", "2026-11-09");
    bill(f, "10", "2026-11-09");
    expect(result(f).safeNow).toBe(150);
  });

  it("is the same as the full figure when no money is coming in", () => {
    const f = form("500");
    bill(f, "100", "2026-11-10");
    f.foodPerWeek = "50";
    const r = result(f);
    expect(r.safeNow).toBe(r.safeToSpend);
    expect(r.heldBack).toBeNull();
  });

  it("doesn't show money on the way when it's all needed for a later bill", () => {
    const f = form("100");
    income(f, "140", "2026-11-09");
    bill(f, "200", "2026-11-20");
    const r = result(f);
    expect(r.safeToSpend).toBe(4000);
    expect(r.safeNow).toBe(4000);
    expect(r.heldBack).toBeNull();
  });

  it("keeps back food and travel for the days until the money arrives", () => {
    const f = form("50");
    income(f, "140", "2026-11-14");
    f.foodPerWeek = "70"; // £10 a day, 7 days until it arrives
    const r = result(f);
    expect(r.safeNow).toBe(5000 - 7000);
    expect(r.heldBack?.nextIncome).toEqual({ date: "2026-11-14", amount: 14000 });
  });

  it("with two payments coming, the next one shows, and the lowest point is used", () => {
    const f = form("20");
    income(f, "100", "2026-11-10");
    income(f, "100", "2026-11-17");
    bill(f, "110", "2026-11-12");
    const r = result(f);
    // 20 now; on the 17th: 20 + 100 - 110 = 10.
    expect(r.safeNow).toBe(1000);
    expect(r.heldBack?.nextIncome).toEqual({ date: "2026-11-10", amount: 10000 });
  });

  it("adds money due on the same day together", () => {
    const f = form("5");
    income(f, "40", "2026-11-09", "A");
    income(f, "60", "2026-11-09", "B");
    expect(result(f).heldBack?.nextIncome.amount).toBe(10000);
  });

  it("can never be more than the full figure", () => {
    const f = form("10");
    income(f, "1000", "2026-11-25");
    bill(f, "5", "2026-11-26");
    const r = result(f);
    expect(r.safeNow).toBeLessThanOrEqual(r.safeToSpend ?? 0);
    expect(r.safeNow).toBe(1000);
  });
});

/*
 * 2,000 random months compared with a slow, separate check: walk day by day from today to
 * payday, take each day's bills and food first, add the day's money, and remember the lowest.
 */
let seed = 777;
function random(below: number): number {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return Math.floor((seed / 4294967296) * below);
}
const ceilDiv = (a: number, b: number) => Math.floor((a + b - 1) / b);

describe("safe right now, against a day-by-day walk", () => {
  it("2,000 random months match to the penny", () => {
    let mismatches = 0;
    for (let i = 0; i < 2000; i++) {
      let pay = addDays(today, 3 + random(30));
      while (dayOfWeek(pay) === 0 || dayOfWeek(pay) === 6) pay = addDays(pay, 1);
      const days = daysBetween(today, pay);
      const f = emptyForm();
      const balance = random(60000);
      f.balance = (balance / 100).toFixed(2);
      f.balanceDate = today;
      f.paydayDate = pay;
      const outs = new Map<string, number>();
      const ins = new Map<string, number>();
      for (let b = 0; b < random(5); b++) {
        const pounds = 1 + random(300);
        const due = addDays(today, 1 + random(days));
        outs.set(due, (outs.get(due) ?? 0) + pounds * 100);
        f.bills.push({ ...newBillRow(), name: `Bill ${b}`, amount: String(pounds), dueDate: due });
      }
      for (let n = 0; n < random(4); n++) {
        const pounds = 1 + random(300);
        const date = addDays(today, 1 + random(days - 1));
        ins.set(date, (ins.get(date) ?? 0) + pounds * 100);
        f.income.push({ ...newIncomeRow(), name: `In ${n}`, amount: String(pounds), date });
      }
      const food = random(100);
      f.foodPerWeek = food ? String(food) : "";

      const built = buildInput(f, today);
      if (built.status !== "ready") {
        mismatches += 1;
        continue;
      }
      const r = calculateSafeToSpend(built.input);

      // The slow walk.
      let lowest = Number.POSITIVE_INFINITY;
      let outSoFar = 0;
      let inSoFar = 0;
      for (let d = 1; d <= days; d++) {
        const date = addDays(today, d);
        outSoFar += outs.get(date) ?? 0;
        if (ins.has(date)) {
          lowest = Math.min(lowest, balance + inSoFar - outSoFar - ceilDiv(food * 100 * d, 7));
          inSoFar += ins.get(date) ?? 0;
        }
      }
      const full = balance + inSoFar - outSoFar - ceilDiv(food * 100 * days, 7);
      const expected = Math.min(full, lowest);
      if (r.safeToSpend !== full || r.safeNow !== expected) mismatches += 1;
      if (r.safeNow !== null && r.safeToSpend !== null && r.safeNow > r.safeToSpend) mismatches += 1;
    }
    expect(mismatches).toBe(0);
  });
});
