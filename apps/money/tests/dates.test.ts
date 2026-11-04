import { describe, expect, it } from "vitest";
import {
  addDays,
  dayOfWeek,
  daysBetween,
  onOrAfterWorkingDay,
  onOrBeforeWorkingDay,
} from "../src/logic/dates";
import { InvalidInputError } from "../src/logic/errors";

describe("dates", () => {
  it("adds days across month ends, year ends and leap years", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29"); // 2028 is a leap year
    expect(addDays("2027-02-28", 1)).toBe("2027-03-01"); // 2027 is not
    expect(addDays("2026-11-04", -4)).toBe("2026-10-31");
  });

  it("counts days between dates across a year end and a leap day", () => {
    expect(daysBetween("2026-12-29", "2027-01-04")).toBe(6);
    expect(daysBetween("2028-02-26", "2028-03-01")).toBe(4);
    expect(daysBetween("2027-02-26", "2027-03-01")).toBe(3);
    expect(daysBetween("2026-11-13", "2026-11-04")).toBe(-9);
  });

  it("knows the day of the week", () => {
    expect(dayOfWeek("2026-11-04")).toBe(3); // Wednesday
    expect(dayOfWeek("2026-11-07")).toBe(6); // Saturday
    expect(dayOfWeek("2026-11-08")).toBe(0); // Sunday
  });

  it("rejects dates that do not exist or are written the wrong way", () => {
    for (const bad of ["2026-02-30", "2027-02-29", "2026-13-01", "04/11/2026", "2026-1-5", ""]) {
      expect(() => daysBetween(bad, "2026-11-04")).toThrow(InvalidInputError);
    }
    expect(daysBetween("2028-02-29", "2028-03-01")).toBe(1); // a real leap day is fine
  });

  it("moves forward to the next working day, skipping weekends and bank holidays", () => {
    const none = new Set<string>();
    expect(onOrAfterWorkingDay("2026-11-06", none)).toBe("2026-11-06"); // Friday stays
    expect(onOrAfterWorkingDay("2026-11-07", none)).toBe("2026-11-09"); // Saturday to Monday
    expect(onOrAfterWorkingDay("2026-11-08", new Set(["2026-11-09"]))).toBe("2026-11-10");
  });

  it("moves back to the working day before, skipping weekends and bank holidays", () => {
    const none = new Set<string>();
    expect(onOrBeforeWorkingDay("2026-11-08", none)).toBe("2026-11-06"); // Sunday to Friday
    expect(onOrBeforeWorkingDay("2026-11-09", new Set(["2026-11-09"]))).toBe("2026-11-06");
  });
});
