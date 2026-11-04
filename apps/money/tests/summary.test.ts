import { describe, expect, it } from "vitest";
import { describeForm, emptyForm, newBillRow, newIncomeRow } from "../src/logic/form";
import { words } from "../src/content/words";

describe("the short summaries shown in the menu", () => {
  it("says 'not set yet' for a fresh form", () => {
    expect(describeForm(emptyForm())).toEqual({
      account: words.notSetYet,
      payday: words.notSetYet,
      bills: words.noneAdded,
      income: words.noneAdded,
      essentials: words.notSetYet,
      pot: words.notSetYet,
      holidays: words.noneAdded,
    });
  });

  it("summarises what has been filled in", () => {
    const summary = describeForm({
      ...emptyForm(),
      balance: "420",
      paydayDate: "2026-11-20",
      bills: [{ ...newBillRow(), name: "Mum", amount: "100", dueDate: "2026-11-10" }, newBillRow()],
      income: [
        { ...newIncomeRow(), name: "A", amount: "5", date: "2026-11-10" },
        { ...newIncomeRow(), name: "B", amount: "6", date: "2026-11-11" },
      ],
      foodPerWeek: "63",
      buffer: "50",
      bankHolidays: "2026-12-25 2026-12-28",
    });
    expect(summary).toEqual({
      account: "£420.00",
      payday: "Friday 20 November",
      bills: "1 bill",
      income: "2 items",
      essentials: "Food",
      pot: "£50.00",
      holidays: "2 dates",
    });
  });

  it("is gentle about things it can't read yet", () => {
    const summary = describeForm({ ...emptyForm(), balance: "abc", paydayDate: "2026-02-30" });
    expect(summary.account).toBe(words.needsALook);
    expect(summary.payday).toBe(words.needsALook);
  });
});
