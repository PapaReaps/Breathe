import { describe, expect, it } from "vitest";
import { addDays, dayOfWeek, daysBetween } from "../src/logic/dates";
import { buildInput, emptyForm, newBillRow } from "../src/logic/form";
import { calculateSafeToSpend } from "../src/logic/safeToSpend";

/*
 * A balance with pence, and everything else in whole pounds (the way people often test).
 * Each answer is compared with a plain, separate calculation done in whole pennies.
 * The random numbers come from a fixed seed, so any failure can be repeated exactly.
 */

let seed = 12345;
function random(below: number): number {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return Math.floor((seed / 4294967296) * below);
}

const today = "2026-11-04";
const ceilDiv = (a: number, b: number) => Math.floor((a + b - 1) / b);

describe("pounds and pence together", () => {
  it("1,000 random cases match an independent calculation to the penny", () => {
    let mismatches = 0;
    for (let i = 0; i < 1000; i++) {
      const pence = random(500000) + random(100);
      let payday = addDays(today, 1 + random(40));
      while (dayOfWeek(payday) === 0 || dayOfWeek(payday) === 6) payday = addDays(payday, 1);
      const days = daysBetween(today, payday);

      const form = emptyForm();
      // Sometimes written with one digit of pence ("12.5" means £12.50).
      form.balance =
        random(3) === 0
          ? `${Math.floor(pence / 100)}.${pence % 100}`
          : `${Math.floor(pence / 100)}.${String(pence % 100).padStart(2, "0")}`;
      const [whole = "0", fraction = "0"] = form.balance.split(".");
      const balancePence = Number(whole) * 100 + Number((fraction + "0").slice(0, 2));
      form.balanceDate = today;
      form.paydayDate = payday;

      let bills = 0;
      for (let b = 0; b < random(5); b++) {
        const pounds = 1 + random(400);
        bills += pounds * 100;
        form.bills.push({ ...newBillRow(), name: `Bill ${b}`, amount: String(pounds), dueDate: addDays(today, 1 + random(days)) });
      }
      const food = random(150);
      const travel = random(60);
      const pot = random(200);
      form.foodPerWeek = food ? String(food) : "";
      form.travelPerWeek = travel ? String(travel) : "";
      form.buffer = pot ? String(pot) : "";

      const built = buildInput(form, today);
      if (built.status !== "ready") {
        mismatches += 1;
        continue;
      }
      const expected =
        balancePence - bills - ceilDiv(food * 100 * days, 7) - ceilDiv(travel * 100 * days, 7) - pot * 100;
      if (calculateSafeToSpend(built.input).safeToSpend !== expected) mismatches += 1;
    }
    expect(mismatches).toBe(0);
  });

  it("a worked example: £1,234.56 less £100 less £50 a week for 9 days is £1,070.27", () => {
    const form = emptyForm();
    form.balance = "1234.56";
    form.balanceDate = today;
    form.paydayDate = "2026-11-13";
    form.bills.push({ ...newBillRow(), name: "Mum", amount: "100", dueDate: "2026-11-10" });
    form.foodPerWeek = "50";
    const built = buildInput(form, today);
    if (built.status !== "ready") throw new Error("should be ready");
    // 50 pounds a week for 9 days = 64.2857..., rounded UP to the next penny: 64.29
    expect(calculateSafeToSpend(built.input).safeToSpend).toBe(107027);
  });
});
