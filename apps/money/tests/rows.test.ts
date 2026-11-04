import { describe, expect, it } from "vitest";
import { newBillRow, newIncomeRow } from "../src/logic/form";
import { billsTotalLine, idsByDate, incomeTotalLine, isBlankBill, isBlankIncome, summariseBill, summariseIncome, totalOf } from "../src/logic/rows";
import { formatDayShort } from "../src/logic/dates";
import { DEFAULT_SETTINGS, readSettings, toSavedSettings } from "../src/storage/settings";

// Everything here is fictional.
describe("one line per bill", () => {
  it("shows the name, amount and date in a short line", () => {
    const row = { ...newBillRow(), name: "Mum", amount: "100", dueDate: "2026-11-13" };
    expect(summariseBill(row)).toEqual({ title: "Mum", detail: "£100.00 · Fri 13 Nov", unfinished: false });
  });

  it("says kindly what is still missing", () => {
    const row = { ...newBillRow(), name: "", amount: "", dueDate: "" };
    const summary = summariseBill(row);
    expect(summary.title).toBe("Unnamed bill");
    expect(summary.detail).toBe("no amount yet · no date yet");
    expect(summary.unfinished).toBe(true);
  });

  it("marks money that might not come", () => {
    const row = { ...newIncomeRow(), name: "Refund", amount: "30", date: "2026-11-12", reliability: "uncertain" as const };
    expect(summariseIncome(row).detail).toBe("£30.00 · Thu 12 Nov · might come");
  });

  it("keeps what was typed if an amount can't be read yet", () => {
    const row = { ...newBillRow(), name: "Gas", amount: "12.505", dueDate: "2026-11-10" };
    const summary = summariseBill(row);
    expect(summary.detail).toBe("12.505 · Tue 10 Nov");
    expect(summary.unfinished).toBe(true);
  });

  it("formats short days", () => {
    expect(formatDayShort("2026-12-25")).toBe("Fri 25 Dec");
  });
});

describe("empty rows", () => {
  it("knows a row with nothing in it", () => {
    expect(isBlankBill(newBillRow())).toBe(true);
    expect(isBlankIncome(newIncomeRow())).toBe(true);
    expect(isBlankBill({ ...newBillRow(), name: "  " })).toBe(true);
  });

  it("does not treat a partly filled row as empty", () => {
    expect(isBlankBill({ ...newBillRow(), amount: "5" })).toBe(false);
    expect(isBlankBill({ ...newBillRow(), dueDate: "2026-11-10" })).toBe(false);
    expect(isBlankIncome({ ...newIncomeRow(), name: "Refund" })).toBe(false);
  });
});

describe("totals and order", () => {
  it("adds up what can be read and counts the rest", () => {
    expect(totalOf(["100", "50.50", "abc", ""])).toEqual({ pence: 15050, count: 4, unreadable: 2 });
  });

  it("writes a one-line total, or nothing for an empty list", () => {
    expect(billsTotalLine([])).toBeNull();
    expect(incomeTotalLine([])).toBeNull();
    const rows = [
      { ...newBillRow(), amount: "100" },
      { ...newBillRow(), amount: "240" },
    ];
    expect(billsTotalLine(rows)).toBe("2 bills · £340.00 in total");
    expect(billsTotalLine([rows[0]!])).toBe("1 bill · £100.00 in total");
  });

  it("puts the earliest date first, undated rows last, and keeps typed order for ties", () => {
    const rows = [
      { id: "a", date: "2026-11-20" },
      { id: "b", date: "" },
      { id: "c", date: "2026-11-05" },
      { id: "d", date: "2026-11-20" },
    ];
    expect(idsByDate(rows)).toEqual(["c", "a", "d", "b"]);
  });
});

describe("look and colour settings", () => {
  it("accepts the known choices", () => {
    const saved = { format: 1, appearance: "dark", accent: "plum", potColour: "lilac" };
    expect(readSettings(saved)).toEqual({ appearance: "dark", accent: "plum", potColour: "lilac" });
  });

  it("falls back to the default for anything unexpected, one setting at a time", () => {
    expect(readSettings({ appearance: "purple", accent: "blue", potColour: 5 })).toEqual({
      appearance: "system",
      accent: "blue",
      potColour: "gold",
    });
    expect(readSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(readSettings("dark")).toEqual(DEFAULT_SETTINGS);
    expect(readSettings([])).toEqual(DEFAULT_SETTINGS);
    expect(readSettings({ accent: "<script>" })).toEqual(DEFAULT_SETTINGS);
  });

  it("older saves with only the light/dark choice still load", () => {
    expect(readSettings({ format: 1, appearance: "light" })).toEqual({ ...DEFAULT_SETTINGS, appearance: "light" });
  });

  it("what is saved reads back the same", () => {
    const settings = { appearance: "light" as const, accent: "rose" as const, potColour: "green" as const };
    expect(readSettings(toSavedSettings(settings))).toEqual(settings);
  });
});
