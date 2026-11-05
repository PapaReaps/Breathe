import { describe, expect, it } from "vitest";
import { comingUp, monthGrid, monthsBetween } from "../src/logic/comingUp";
import { gbp, makeInput } from "./helpers";

const TODAY = "2026-11-04";

describe("Coming up: the days that matter until your money comes in", () => {
  const input = makeInput({
    today: TODAY,
    bills: [
      { id: "rent", name: "Rent share", amount: gbp(450), dueDate: "2026-11-06" },
      { id: "phone", name: "Phone", amount: gbp(25), dueDate: "2026-11-12" },
      { id: "old", name: "Gone already", amount: gbp(9), dueDate: "2026-11-02" },
      { id: "paid", name: "Already paid", amount: gbp(5), dueDate: "2026-11-10", alreadyInBalance: true },
      { id: "after", name: "After money day", amount: gbp(70), dueDate: "2026-11-30" },
      { id: "same", name: "Same day", amount: gbp(12), dueDate: "2026-11-27" },
    ],
    income: [
      { id: "sure", name: "Gift", amount: gbp(20), date: "2026-11-15", reliability: "reliable" },
      { id: "maybe", name: "Refund", amount: gbp(30), date: "2026-11-18", reliability: "uncertain" },
    ],
  });
  const result = comingUp(input, "2026-11-27");

  it("lists bills from today up to and including money day, in date order", () => {
    expect(result.days.map((d) => d.date)).toEqual(["2026-11-06", "2026-11-12", "2026-11-15", "2026-11-27"]);
  });

  it("leaves off money that might come", () => {
    const names = result.days.flatMap((d) => d.items).map((i) => ("name" in i ? i.name : "money day"));
    expect(names).not.toContain("Refund");
    expect(names).toContain("Gift");
  });

  it("skips bills already paid, bills before today and bills after money day", () => {
    const names = result.days.flatMap((d) => d.items).map((i) => ("name" in i ? i.name : ""));
    for (const gone of ["Gone already", "Already paid", "After money day"]) expect(names).not.toContain(gone);
  });

  it("ends with money day, with any bill that day shown first", () => {
    const last = result.days[result.days.length - 1]!;
    expect(last.date).toBe("2026-11-27");
    expect(last.items.map((i) => i.kind)).toEqual(["bill", "money-day"]);
  });

  it("adds up the bills before then", () => {
    expect(result.billCount).toBe(3);
    expect(result.billTotal).toBe(gbp(487));
  });

  it("still shows money day when there are no bills at all", () => {
    const empty = comingUp(makeInput({ today: TODAY, bills: [], income: [] }), "2026-11-27");
    expect(empty.days).toEqual([{ date: "2026-11-27", items: [{ kind: "money-day" }] }]);
    expect(empty.billCount).toBe(0);
  });
});

describe("the month view", () => {
  it("starts on a Monday (1 November 2026 is a Sunday)", () => {
    const cells = monthGrid(2026, 11);
    expect(cells.slice(0, 6)).toEqual([null, null, null, null, null, null]);
    expect(cells[6]).toBe("2026-11-01");
    expect(cells[cells.length - 1]).toBe("2026-11-30");
  });

  it("shows the months from today to money day, across a new year too", () => {
    expect(monthsBetween("2026-11-04", "2026-11-27")).toEqual([{ year: 2026, month: 11 }]);
    expect(monthsBetween("2026-12-20", "2027-01-08")).toEqual([{ year: 2026, month: 12 }, { year: 2027, month: 1 }]);
  });
});
