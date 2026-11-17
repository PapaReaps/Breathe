import { describe, expect, it } from "vitest";
import { dayMark, firstMonth, monthGrid } from "../src/medication/logic/history";
import { dosesFor, setTaken, type MedicationData } from "../src/medication/logic/medicines";

const data: MedicationData = {
  version: 1,
  medicines: [
    { id: "med-blue01", name: "Blue tablet", amount: "", times: ["08:00"], stock: null, added: "2026-11-05" },
    { id: "med-eve001", name: "Evening tablet", amount: "", times: ["20:00"], stock: null, added: "2026-11-10" },
  ],
  taken: {},
};
const today = new Date(2026, 10, 17, 12, 0);

describe("the history calendar", () => {
  it("shows all, some or none logged, never anything harsher", () => {
    let d = setTaken(data, new Date(2026, 10, 12), "med-blue01@08:00", true);
    d = setTaken(d, new Date(2026, 10, 12), "med-eve001@20:00", true);
    d = setTaken(d, new Date(2026, 10, 13), "med-blue01@08:00", true);
    expect(dayMark(d, new Date(2026, 10, 12), today)).toBe("all");
    expect(dayMark(d, new Date(2026, 10, 13), today)).toBe("some");
    expect(dayMark(d, new Date(2026, 10, 14), today)).toBe("none");
  });

  it("days before a medicine was added don't count, so they're never shown as missed", () => {
    expect(dayMark(data, new Date(2026, 10, 1), today)).toBe("empty");
    expect(dosesFor(data, new Date(2026, 10, 7)).map((x) => x.medicine.name)).toEqual(["Blue tablet"]);
    const d = setTaken(data, new Date(2026, 10, 7), "med-blue01@08:00", true);
    expect(dayMark(d, new Date(2026, 10, 7), today)).toBe("all");
  });

  it("days still to come are left blank", () => {
    expect(dayMark(data, new Date(2026, 10, 18), today)).toBe("future");
  });

  it("lays out a month Monday first", () => {
    const november = monthGrid(2026, 10);
    // 1 November 2026 is a Sunday: six blanks first.
    expect(november.slice(0, 6)).toEqual([null, null, null, null, null, null]);
    expect(november[6]!.getDate()).toBe(1);
    expect(november.filter(Boolean)).toHaveLength(30);
  });

  it("starts from the month of the first medicine", () => {
    expect(firstMonth(data, today)).toEqual({ year: 2026, month: 10 });
    expect(firstMonth({ version: 1, medicines: [], taken: {} }, today)).toEqual({ year: 2026, month: 10 });
  });
});
