import { describe, expect, it } from "vitest";
import { newBillRow, newIncomeRow } from "../src/logic/form";
import { billsTotalLine, idsByDate, incomeTotalLine, isBlankBill, isBlankIncome, summariseBill, summariseIncome, totalOf } from "../src/logic/rows";
import { formatDayShort } from "../src/logic/dates";
import { BALANCE_REMINDERS, DEFAULT_SETTINGS, readSettings, reminderDays, toSavedSettings } from "../src/storage/settings";

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
    const saved = { format: 1, appearance: "dark", accent: "plum", potColour: "lilac", showExplanation: false, showPayday: false };
    expect(readSettings(saved)).toEqual({
      appearance: "dark",
      accent: "plum",
      potColour: "lilac",
      showExplanation: false,
      showPayday: false,
      showSavings: true,
      showMoneyName: false,
      breathMotion: true,
      balanceReminder: "three-days",
      textSize: "standard",
      contrast: "system",
      checkForUpdates: false,
      clickSound: "off",
      vibration: "off",
      calendarView: "list",
    });
  });

  it("falls back to the default for anything unexpected, one setting at a time", () => {
    expect(readSettings({ appearance: "purple", accent: "blue", potColour: 5, showExplanation: "no" })).toEqual({
      ...DEFAULT_SETTINGS,
      accent: "blue",
    });
    expect(readSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(readSettings("dark")).toEqual(DEFAULT_SETTINGS);
    expect(readSettings([])).toEqual(DEFAULT_SETTINGS);
    expect(readSettings({ accent: "<script>" })).toEqual(DEFAULT_SETTINGS);
  });

  it("older saves with only the light/dark choice still load", () => {
    expect(readSettings({ format: 1, appearance: "light" })).toEqual({ ...DEFAULT_SETTINGS, appearance: "light" });
  });

  it("the home screen text is shown unless it was switched off", () => {
    expect(DEFAULT_SETTINGS.showExplanation).toBe(true);
    expect(DEFAULT_SETTINGS.showPayday).toBe(true);
    expect(readSettings({ showExplanation: false }).showExplanation).toBe(false);
    expect(readSettings({ showExplanation: false }).showPayday).toBe(true);
    expect(DEFAULT_SETTINGS.showSavings).toBe(true);
    expect(readSettings({ showSavings: false }).showSavings).toBe(false);
    expect(readSettings({ showSavings: "no" }).showSavings).toBe(true);
  });

  it("sounds and vibration stay off unless chosen, and odd values are ignored", () => {
    expect(DEFAULT_SETTINGS.clickSound).toBe("off");
    expect(DEFAULT_SETTINGS.vibration).toBe("off");
    expect(readSettings({ clickSound: "chime", vibration: "firm" })).toMatchObject({ clickSound: "chime", vibration: "firm" });
    expect(readSettings({ clickSound: "<script>", vibration: 3 })).toMatchObject({ clickSound: "off", vibration: "off" });
  });

  it("what is saved reads back the same", () => {
    const settings = {
      appearance: "light" as const,
      accent: "rose" as const,
      potColour: "green" as const,
      showExplanation: false,
      showPayday: true,
      showSavings: false,
      balanceReminder: "weekly" as const,
      textSize: "largest" as const,
      contrast: "more" as const,
      checkForUpdates: true,
      clickSound: "drop" as const,
      vibration: "gentle" as const,
      calendarView: "month" as const,
      showMoneyName: true,
      breathMotion: false,
    };
    expect(readSettings(toSavedSettings(settings))).toEqual(settings);
  });
});

describe("the money's name and the breathing word", () => {
  it("keeps the name private and lets the word breathe, unless the person chooses otherwise", () => {
    expect(readSettings({}).showMoneyName).toBe(false);
    expect(readSettings({}).breathMotion).toBe(true);
    expect(readSettings({ showMoneyName: "yes", breathMotion: 0 }).showMoneyName).toBe(false);
  });
});

describe("the balance reminder setting", () => {
  it("is every 3 days unless the person chooses otherwise", () => {
    expect(DEFAULT_SETTINGS.balanceReminder).toBe("three-days");
    expect(readSettings({}).balanceReminder).toBe("three-days");
    expect(reminderDays(DEFAULT_SETTINGS.balanceReminder)).toBe(3);
  });

  it("turns each choice into a number of days", () => {
    expect(reminderDays("daily")).toBe(0);
    expect(reminderDays("three-days")).toBe(3);
    expect(reminderDays("weekly")).toBe(7);
    expect(reminderDays("never")).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("reads each known choice, and ignores anything else", () => {
    for (const choice of BALANCE_REMINDERS) expect(readSettings({ balanceReminder: choice }).balanceReminder).toBe(choice);
    expect(readSettings({ balanceReminder: "hourly" }).balanceReminder).toBe("three-days");
    expect(readSettings({ balanceReminder: 3 }).balanceReminder).toBe("three-days");
  });
});

describe("list lines for things that repeat", () => {
  it("a repeating bill says how often and from when", () => {
    const row = { ...newBillRow(), name: "Mum", amount: "100", dueDate: "2026-11-13", repeat: "monthly" as const };
    expect(summariseBill(row).detail).toBe("£100.00 · every month from Fri 13 Nov");
    expect(summariseBill({ ...row, repeat: "weekly" }).detail).toBe("£100.00 · every week from Fri 13 Nov");
    expect(summariseBill({ ...row, repeat: "fortnightly" }).detail).toBe("£100.00 · every 2 weeks from Fri 13 Nov");
    expect(summariseBill({ ...row, repeat: "four-weekly" }).detail).toBe("£100.00 · every 4 weeks from Fri 13 Nov");
  });

  it("a one-off reads exactly as before", () => {
    const row = { ...newBillRow(), name: "Mum", amount: "100", dueDate: "2026-11-13" };
    expect(summariseBill(row).detail).toBe("£100.00 · Fri 13 Nov");
  });

  it("repeating money coming in keeps its 'might come' note", () => {
    const row = { ...newIncomeRow(), name: "Shifts", amount: "80", date: "2026-11-13", repeat: "weekly" as const, reliability: "uncertain" as const };
    expect(summariseIncome(row).detail).toBe("£80.00 · every week from Fri 13 Nov · might come");
  });

  it("without a date yet it still reads sensibly", () => {
    const row = { ...newBillRow(), name: "Gym", amount: "10", dueDate: "", repeat: "weekly" as const };
    const line = summariseBill(row);
    expect(line.detail).toBe("£10.00 · every week · no date yet");
    expect(line.unfinished).toBe(true);
  });
});
