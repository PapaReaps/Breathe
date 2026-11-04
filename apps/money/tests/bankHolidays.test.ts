import { describe, expect, it } from "vitest";
import {
  BUILT_IN_FIRST_YEAR,
  BUILT_IN_HOLIDAYS,
  BUILT_IN_LAST_DAY,
  HOLIDAY_REGIONS,
  isHolidayRegion,
} from "../src/data/bankHolidays";
import { buildInput, describeForm, emptyForm, holidayDays, paydayRuleQuestion } from "../src/logic/form";
import type { FormState } from "../src/logic/form";
import { words } from "../src/content/words";
import { dayOfWeek, toDayNumber } from "../src/logic/dates";
import { calculateSafeToSpend } from "../src/logic/safeToSpend";
import { fromSaved, makeBackupText, parseBackupText, toSaved } from "../src/storage/savedData";

// Everything about people here is fictional. The dates come from the official GOV.UK list.
const TODAY = "2026-11-04";
const regions = ["england-and-wales", "scotland", "northern-ireland"] as const;

function filled(overrides: Partial<FormState> = {}): FormState {
  return { ...emptyForm(), balance: "420", paydayDate: "2026-11-20", ...overrides };
}

describe("the built-in bank holiday list is well formed", () => {
  it("every date is a real day, in order, with no repeats", () => {
    for (const region of regions) {
      const dates = BUILT_IN_HOLIDAYS[region];
      expect(dates.length).toBeGreaterThan(30);
      for (const date of dates) toDayNumber(date); // throws if not a real day
      expect([...dates].sort()).toEqual([...dates]);
      expect(new Set(dates).size).toBe(dates.length);
    }
  });

  it("never lands on a weekend (weekend holidays are moved to a weekday)", () => {
    for (const region of regions) {
      for (const date of BUILT_IN_HOLIDAYS[region]) {
        const weekday = dayOfWeek(date);
        expect(weekday !== 0 && weekday !== 6).toBe(true);
      }
    }
  });

  it("covers every year from the first year to the last day, for every region", () => {
    const lastYear = Number(BUILT_IN_LAST_DAY.slice(0, 4));
    for (const region of regions) {
      for (let year = BUILT_IN_FIRST_YEAR; year <= lastYear; year++) {
        const inYear = BUILT_IN_HOLIDAYS[region].filter((d) => d.startsWith(`${year}-`));
        expect(inYear.length).toBeGreaterThanOrEqual(7);
      }
      const last = BUILT_IN_HOLIDAYS[region][BUILT_IN_HOLIDAYS[region].length - 1]!;
      expect(last <= BUILT_IN_LAST_DAY).toBe(true);
      expect(last.startsWith(`${lastYear}-`)).toBe(true);
    }
  });

  it("matches facts from the official list", () => {
    const e = BUILT_IN_HOLIDAYS["england-and-wales"];
    const s = BUILT_IN_HOLIDAYS.scotland;
    const n = BUILT_IN_HOLIDAYS["northern-ireland"];
    // Christmas Day 2026 is a Friday; Boxing Day (Saturday) moves to Monday 28th.
    for (const list of [e, s, n]) {
      expect(list).toContain("2026-12-25");
      expect(list).toContain("2026-12-28");
      expect(list).not.toContain("2026-12-26");
    }
    // 2027: Christmas and Boxing Day are a weekend, so Monday 27th and Tuesday 28th.
    expect(e).toContain("2027-12-27");
    expect(e).toContain("2027-12-28");
    // Easter 2027
    expect(e).toContain("2027-03-26");
    expect(e).toContain("2027-03-29");
    // Regional differences
    expect(s).toContain("2026-11-30"); // St Andrew's Day
    expect(e).not.toContain("2026-11-30");
    expect(s).toContain("2026-01-02"); // 2nd January
    expect(e).not.toContain("2026-01-02");
    expect(s).toContain("2026-08-03"); // Scottish summer bank holiday
    expect(e).toContain("2026-08-31");
    expect(s).not.toContain("2026-08-31");
    expect(n).toContain("2026-03-17"); // St Patrick's Day
    expect(n).toContain("2026-07-13"); // Battle of the Boyne, moved to Monday
    expect(e).not.toContain("2026-03-17");
    // Easter Monday is not a Scottish bank holiday, but is in the other two.
    expect(s).not.toContain("2026-04-06");
    expect(e).toContain("2026-04-06");
    expect(n).toContain("2026-04-06");
  });

  it("knows its regions", () => {
    expect(HOLIDAY_REGIONS).toEqual(["own", "england-and-wales", "scotland", "northern-ireland"]);
    expect(isHolidayRegion("scotland")).toBe(true);
    expect(isHolidayRegion("wales")).toBe(false);
    expect(isHolidayRegion(3)).toBe(false);
  });
});

describe("choosing a region", () => {
  it("'my own' uses only the typed days, exactly as before", () => {
    expect(holidayDays("own", "2026-12-25 2026-12-28")).toEqual(["2026-12-25", "2026-12-28"]);
    expect(holidayDays("own", "")).toEqual([]);
  });

  it("a region adds its dates, plus anything typed, without repeats", () => {
    const days = holidayDays("scotland", "2026-11-30 2026-11-12");
    expect(days).toContain("2026-11-30");
    expect(days).toContain("2026-11-12");
    expect(days.filter((d) => d === "2026-11-30")).toHaveLength(1);
    expect(days).toContain("2026-12-28");
  });

  it("a payday on a bank holiday in your region asks the weekend question", () => {
    // Monday 30 November 2026 is St Andrew's Day in Scotland only.
    const base = filled({ paydayDate: "2026-11-30" });
    expect(paydayRuleQuestion(base, TODAY)).toBeNull();
    expect(paydayRuleQuestion({ ...base, bankHolidayRegion: "england-and-wales" }, TODAY)).toBeNull();
    expect(paydayRuleQuestion({ ...base, bankHolidayRegion: "scotland" }, TODAY)).toBe(words.askPaydayRule("a bank holiday"));
  });

  it("the payday really moves, using the region's dates", () => {
    const form = filled({
      paydayDate: "2026-11-30",
      bankHolidayRegion: "scotland",
      paydayRule: "working-day-before",
    });
    const built = buildInput(form, TODAY);
    if (built.status !== "ready") throw new Error("expected ready");
    expect(calculateSafeToSpend(built.input).paydayDate).toBe("2026-11-27");
    // The same form in England has no holiday that day, so it stays put.
    const england = buildInput({ ...form, bankHolidayRegion: "england-and-wales" }, TODAY);
    if (england.status !== "ready") throw new Error("expected ready");
    expect(calculateSafeToSpend(england.input).paydayDate).toBe("2026-11-30");
  });

  it("a repeating payday skips the holiday too (Boxing Day moved to Monday 28 Dec)", () => {
    const form = filled({
      paydayDate: "2026-12-04",
      paydayRepeat: "weekly",
      bankHolidayRegion: "england-and-wales",
      paydayRule: "next-working-day",
    });
    // Payday Fridays: 4, 11, 18, 25 Dec (Christmas Day) so the 25th moves to the next working day, which is Tuesday 29th.
    const built = buildInput(form, "2026-12-24");
    if (built.status !== "ready") throw new Error("expected ready");
    expect(calculateSafeToSpend(built.input).paydayDate).toBe("2026-12-29");
  });

  it("typed days are still used on top of the region", () => {
    const form = filled({
      paydayDate: "2026-11-12",
      bankHolidayRegion: "england-and-wales",
      bankHolidays: "2026-11-12",
    });
    expect(paydayRuleQuestion(form, TODAY)).toBe(words.askPaydayRule("a bank holiday"));
  });

  it("the calculator is given every holiday day", () => {
    const built = buildInput(filled({ bankHolidayRegion: "northern-ireland", bankHolidays: "2026-11-12" }), TODAY);
    if (built.status !== "ready") throw new Error("expected ready");
    expect(built.input.nonWorkingDays).toContain("2026-07-13");
    expect(built.input.nonWorkingDays).toContain("2026-11-12");
  });

  it("numbers saved before this stage have no region, which means 'my own'", () => {
    const old = filled() as unknown as Record<string, unknown>;
    delete old.bankHolidayRegion;
    const built = buildInput(old as unknown as FormState, TODAY);
    expect(built.status).toBe("ready");
  });
});

describe("when the built-in list runs out", () => {
  it("says so when the payday is after the last day it covers", () => {
    const form = filled({ paydayDate: "2029-01-12", bankHolidayRegion: "england-and-wales" });
    const built = buildInput(form, "2029-01-05");
    if (built.status !== "ready") throw new Error("expected ready");
    expect(built.holidayListEnded).toBe(true);
  });

  it("stays quiet while the list still covers payday, and for 'my own'", () => {
    const covered = buildInput(filled({ bankHolidayRegion: "scotland" }), TODAY);
    if (covered.status !== "ready") throw new Error("expected ready");
    expect(covered.holidayListEnded).toBe(false);
    const own = buildInput(filled({ paydayDate: "2029-01-12" }), "2029-01-05");
    if (own.status !== "ready") throw new Error("expected ready");
    expect(own.holidayListEnded).toBe(false);
  });
});

describe("the menu summary", () => {
  it("names the region, and counts extra days", () => {
    expect(describeForm(filled({ bankHolidayRegion: "scotland" }), TODAY).holidays).toBe(words.holidaysSummaryRegion("scotland", 0));
    expect(describeForm(filled({ bankHolidayRegion: "scotland", bankHolidays: "2026-11-12 2026-11-13" }), TODAY).holidays).toBe(
      words.holidaysSummaryRegion("scotland", 2),
    );
    expect(describeForm(filled(), TODAY).holidays).toBe(words.noneAdded);
    expect(describeForm(filled({ bankHolidays: "2026-11-12" }), TODAY).holidays).toBe("1 date");
  });
});

describe("saving the region", () => {
  it("is saved and comes back, in saves and in backup files", () => {
    const form = filled({ bankHolidayRegion: "northern-ireland", bankHolidays: "2026-11-12" });
    expect(fromSaved(toSaved(form))).toEqual(form);
    expect(parseBackupText(makeBackupText(form, TODAY))).toEqual({ ok: true, form, savedOn: TODAY });
  });

  it("an older save without a region opens as 'my own'", () => {
    const form = filled({ bankHolidays: "2026-11-12" });
    const record = JSON.parse(JSON.stringify(toSaved(form)));
    delete record.form.bankHolidayRegion;
    record.format = 2;
    expect(fromSaved(record)).toEqual({ ...form, bankHolidayRegion: "own" });
  });

  it("refuses a region it does not know", () => {
    const record = JSON.parse(makeBackupText(filled(), TODAY));
    record.form.bankHolidayRegion = "atlantis";
    expect(parseBackupText(JSON.stringify(record))).toEqual({ ok: false, reason: "unreadable" });
    record.form.bankHolidayRegion = 4;
    expect(parseBackupText(JSON.stringify(record))).toEqual({ ok: false, reason: "unreadable" });
  });
});
