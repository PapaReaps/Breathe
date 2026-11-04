import { describe, expect, it } from "vitest";
import { formatDayLong, weekdayName } from "../src/logic/dates";

describe("writing dates out", () => {
  it("writes the day, date and month in full", () => {
    expect(formatDayLong("2026-11-13")).toBe("Friday 13 November");
    expect(formatDayLong("2026-11-07")).toBe("Saturday 7 November");
    expect(formatDayLong("2028-02-29")).toBe("Tuesday 29 February");
    expect(formatDayLong("2027-01-01")).toBe("Friday 1 January");
  });

  it("names the weekday", () => {
    expect(weekdayName("2026-11-08")).toBe("Sunday");
    expect(weekdayName("2026-11-04")).toBe("Wednesday");
  });
});
