import { describe, expect, it } from "vitest";
import { addDays, daysBetween } from "../src/logic/dates";
import { REPEATS, nextOccurrenceOnOrAfter, occurrencesBetween } from "../src/logic/repeat";

// Everything here is fictional.

describe("repeating dates: every week, 2 weeks, 4 weeks", () => {
  it("every week lands on the same weekday", () => {
    expect(occurrencesBetween("2026-11-06", "weekly", "2026-11-06", "2026-11-27")).toEqual([
      "2026-11-06",
      "2026-11-13",
      "2026-11-20",
      "2026-11-27",
    ]);
  });

  it("every 2 weeks skips a week", () => {
    expect(occurrencesBetween("2026-11-06", "fortnightly", "2026-11-01", "2026-12-31")).toEqual([
      "2026-11-06",
      "2026-11-20",
      "2026-12-04",
      "2026-12-18",
    ]);
  });

  it("every 4 weeks is 28 days, which drifts against calendar months on purpose", () => {
    expect(occurrencesBetween("2026-11-06", "four-weekly", "2026-11-01", "2027-02-01")).toEqual([
      "2026-11-06",
      "2026-12-04",
      "2027-01-01",
      "2027-01-29",
    ]);
  });

  it("starts counting from the first date and never goes backwards before it", () => {
    expect(occurrencesBetween("2026-11-13", "weekly", "2026-10-01", "2026-11-20")).toEqual([
      "2026-11-13",
      "2026-11-20",
    ]);
  });

  it("the range includes both of its end days", () => {
    expect(occurrencesBetween("2026-11-06", "weekly", "2026-11-13", "2026-11-13")).toEqual(["2026-11-13"]);
    expect(occurrencesBetween("2026-11-06", "weekly", "2026-11-07", "2026-11-12")).toEqual([]);
  });

  it("works from a first date a long time ago", () => {
    const list = occurrencesBetween("2020-01-03", "weekly", "2026-11-01", "2026-11-30");
    expect(list).toEqual(["2026-11-06", "2026-11-13", "2026-11-20", "2026-11-27"]);
  });
});

describe("repeating dates: every month", () => {
  it("keeps the same day of the month", () => {
    expect(occurrencesBetween("2026-11-13", "monthly", "2026-11-01", "2027-02-28")).toEqual([
      "2026-11-13",
      "2026-12-13",
      "2027-01-13",
      "2027-02-13",
    ]);
  });

  it("a bill on the 31st uses the last day of shorter months, and does not drift", () => {
    expect(occurrencesBetween("2026-01-31", "monthly", "2026-01-01", "2026-06-30")).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
      "2026-04-30",
      "2026-05-31",
      "2026-06-30",
    ]);
  });

  it("the 30th and the 29th in February", () => {
    expect(occurrencesBetween("2026-01-30", "monthly", "2026-02-01", "2026-02-28")).toEqual(["2026-02-28"]);
    expect(occurrencesBetween("2026-01-29", "monthly", "2026-02-01", "2026-02-28")).toEqual(["2026-02-28"]);
  });

  it("leap years: February has a 29th in 2028", () => {
    expect(occurrencesBetween("2027-12-31", "monthly", "2028-02-01", "2028-02-29")).toEqual(["2028-02-29"]);
    expect(occurrencesBetween("2027-12-29", "monthly", "2028-02-01", "2028-02-29")).toEqual(["2028-02-29"]);
    expect(occurrencesBetween("2027-12-31", "monthly", "2027-02-01", "2027-02-28")).toEqual([]);
  });

  it("2100 is not a leap year", () => {
    expect(occurrencesBetween("2100-01-31", "monthly", "2100-02-01", "2100-02-28")).toEqual(["2100-02-28"]);
  });

  it("goes across a new year", () => {
    expect(occurrencesBetween("2026-12-15", "monthly", "2026-12-01", "2027-01-31")).toEqual([
      "2026-12-15",
      "2027-01-15",
    ]);
  });

  it("a monthly item that starts on the 31st of a month with 31 days stays on the 31st", () => {
    expect(occurrencesBetween("2026-10-31", "monthly", "2026-10-01", "2026-12-31")).toEqual([
      "2026-10-31",
      "2026-11-30",
      "2026-12-31",
    ]);
  });
});

describe("a one-off", () => {
  it("is just the one date, if it is in the range", () => {
    expect(occurrencesBetween("2026-11-10", "once", "2026-11-01", "2026-11-30")).toEqual(["2026-11-10"]);
    expect(occurrencesBetween("2026-11-10", "once", "2026-11-11", "2026-11-30")).toEqual([]);
    expect(occurrencesBetween("2026-11-10", "once", "2026-11-01", "2026-11-09")).toEqual([]);
  });
});

describe("the next one on or after a day", () => {
  it("weekly", () => {
    expect(nextOccurrenceOnOrAfter("2026-11-06", "weekly", "2026-11-06")).toBe("2026-11-06");
    expect(nextOccurrenceOnOrAfter("2026-11-06", "weekly", "2026-11-07")).toBe("2026-11-13");
    expect(nextOccurrenceOnOrAfter("2026-11-06", "weekly", "2026-01-01")).toBe("2026-11-06");
  });

  it("monthly with month ends", () => {
    expect(nextOccurrenceOnOrAfter("2026-01-31", "monthly", "2026-02-01")).toBe("2026-02-28");
    expect(nextOccurrenceOnOrAfter("2026-01-31", "monthly", "2026-03-01")).toBe("2026-03-31");
  });

  it("one-off gives its date only while it is still to come", () => {
    expect(nextOccurrenceOnOrAfter("2026-11-10", "once", "2026-11-10")).toBe("2026-11-10");
    expect(nextOccurrenceOnOrAfter("2026-11-10", "once", "2026-11-11")).toBeNull();
  });
});

describe("repeating dates: a big random check against a slow, obvious method", () => {
  // The slow method for weekly kinds: step one by one. For monthly: build month by month.
  function slow(anchor: string, repeat: (typeof REPEATS)[number], from: string, to: string): string[] {
    const out: string[] = [];
    if (repeat === "once") return anchor >= from && anchor <= to ? [anchor] : [];
    if (repeat === "monthly") {
      const [y0, m0, d0] = anchor.split("-").map(Number) as [number, number, number];
      for (let i = 0; i < 400; i++) {
        const y = y0 + Math.floor((m0 - 1 + i) / 12);
        const m = ((m0 - 1 + i) % 12) + 1;
        const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
        const day = Math.min(d0, last);
        const text = `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        if (text >= from && text <= to) out.push(text);
      }
      return out;
    }
    const step = repeat === "weekly" ? 7 : repeat === "fortnightly" ? 14 : 28;
    let day = anchor;
    while (day <= to) {
      if (day >= from) out.push(day);
      day = addDays(day, step);
    }
    return out;
  }

  it("agrees on 20,000 random cases", () => {
    let seed = 12345;
    const random = (n: number): number => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return Math.floor((seed / 4294967296) * n);
    };
    for (let i = 0; i < 20000; i++) {
      const anchor = addDays("2024-01-01", random(1500));
      const from = addDays("2024-01-01", random(1500));
      const to = addDays(from, random(120));
      const repeat = REPEATS[random(REPEATS.length)]!;
      const fast = occurrencesBetween(anchor, repeat, from, to);
      const check = slow(anchor, repeat, from, to);
      expect(fast).toEqual(check);
      const next = nextOccurrenceOnOrAfter(anchor, repeat, from);
      const wanted = slow(anchor, repeat, from, addDays(from, 2500))[0] ?? null;
      expect(next).toBe(wanted);
      for (const day of fast) expect(daysBetween(from, day) >= 0).toBe(true);
    }
  }, 120_000);
});
