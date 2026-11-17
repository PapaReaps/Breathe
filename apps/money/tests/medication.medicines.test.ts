import { describe, expect, it } from "vitest";
import {
  countFromAmount,
  EMPTY,
  daysLeft,
  markOrdered,
  runningLow,
  checkDraft,
  dayKey,
  dosesFor,
  groupByPart,
  newId,
  nextLine,
  putMedicine,
  readSaved,
  removeMedicine,
  setTaken,
  shortTimeLabel,
  timeLabel,
  type MedicationData,
  type Medicine,
} from "../src/medication/logic/medicines";

const blue: Medicine = { id: "med-blue01", name: "Blue tablet", amount: "1 tablet", times: ["08:00"], stock: null, added: "2026-11-01" };
const vitd: Medicine = { id: "med-vitd01", name: "Vitamin D", amount: "1 capsule", times: ["08:00"], stock: null, added: "2026-11-01" };
const eve: Medicine = { id: "med-eve001", name: "Evening tablet", amount: "", times: ["20:00"], stock: null, added: "2026-11-01" };
const data: MedicationData = { version: 1, medicines: [blue, vitd, eve], taken: {} };
const monday = new Date(2026, 10, 16, 9, 30);

describe("times", () => {
  it("reads like people say them", () => {
    expect(timeLabel("08:00")).toBe("8:00am");
    expect(timeLabel("20:30")).toBe("8:30pm");
    expect(timeLabel("12:00")).toBe("12:00pm");
    expect(timeLabel("00:15")).toBe("12:15am");
    expect(shortTimeLabel("20:00")).toBe("8pm");
    expect(shortTimeLabel("20:30")).toBe("8:30pm");
  });

  it("uses the phone's own day", () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
});

describe("today's list", () => {
  it("puts doses in time order, grouped into morning, afternoon and evening", () => {
    const withLunch = putMedicine(data, { id: "med-lunch1", name: "Lunch", amount: "", times: ["13:00"], stock: null, added: "2026-11-01" });
    const doses = dosesFor(withLunch, monday);
    expect(doses.map((d) => d.medicine.name)).toEqual(["Blue tablet", "Vitamin D", "Lunch", "Evening tablet"]);
    expect(groupByPart(doses).map((g) => [g.part, g.doses.length])).toEqual([
      ["morning", 2],
      ["afternoon", 1],
      ["evening", 1],
    ]);
  });

  it("a medicine taken twice a day shows twice", () => {
    const twice = putMedicine(EMPTY, { ...blue, times: ["08:00", "20:00"] });
    expect(dosesFor(twice, monday).map((d) => d.time)).toEqual(["08:00", "20:00"]);
  });

  it("ticks and un-ticks a dose, only for that day", () => {
    const key = dosesFor(data, monday)[0]!.key;
    const ticked = setTaken(data, monday, key, true, monday);
    expect(dosesFor(ticked, monday)[0]!.taken).toBe(true);
    expect(dosesFor(ticked, new Date(2026, 10, 17))[0]!.taken).toBe(false);
    const unticked = setTaken(ticked, monday, key, false);
    expect(dosesFor(unticked, monday)[0]!.taken).toBe(false);
    expect(unticked.taken).toEqual({});
    expect(data.taken).toEqual({});
  });
});

describe("the one calm line at the top", () => {
  it("says what's next from now on", () => {
    const doses = dosesFor(data, monday);
    const line = nextLine(doses, monday);
    expect(line.kind === "next" && line.dose.medicine.name).toBe("Evening tablet");
  });

  it("says all done once everything is ticked", () => {
    let all = data;
    for (const d of dosesFor(data, monday)) all = setTaken(all, monday, d.key, true);
    expect(nextLine(dosesFor(all, monday), monday)).toEqual({ kind: "all-done" });
  });

  it("never blames: earlier ones left over get a gentle line, not a warning", () => {
    const late = new Date(2026, 10, 16, 22, 0);
    expect(nextLine(dosesFor(data, late), late)).toEqual({ kind: "nothing-left-later" });
  });

  it("has nothing to say with no medicines", () => {
    expect(nextLine([], monday)).toEqual({ kind: "none" });
  });
});

describe("adding a medicine", () => {
  it("tidies the words and sorts the times", () => {
    const result = checkDraft({ name: "  Blue   tablet ", amount: " 1 tablet ", times: ["20:00", "08:00", "", "08:00"], left: "", perDose: "" }, "med-x", { added: "2026-11-16", stock: null });
    expect(result).toEqual({ ok: true, medicine: { id: "med-x", name: "Blue tablet", amount: "1 tablet", times: ["08:00", "20:00"], stock: null, added: "2026-11-16" } });
  });

  it("asks gently for what's missing", () => {
    expect(checkDraft({ name: " ", amount: "", times: [""], left: "", perDose: "" }, "med-x", { added: "2026-11-16", stock: null })).toEqual({ ok: false, problems: ["name-missing", "time-missing"] });
    expect(checkDraft({ name: "A", amount: "", times: ["25:00"], left: "", perDose: "" }, "med-x", { added: "2026-11-16", stock: null })).toEqual({ ok: false, problems: ["time-odd"] });
    expect(checkDraft({ name: "x".repeat(61), amount: "y".repeat(41), times: ["08:00"], left: "", perDose: "" }, "med-x", { added: "2026-11-16", stock: null })).toEqual({
      ok: false,
      problems: ["name-long", "amount-long"],
    });
  });

  it("changing a time drops old ticks for that time, so it never looks taken by mistake", () => {
    const ticked = setTaken(data, monday, "med-blue01@08:00", true);
    const moved = putMedicine(ticked, { ...blue, times: ["09:00"] });
    expect(dosesFor(moved, monday).find((d) => d.medicine.id === blue.id)!.taken).toBe(false);
    expect(moved.medicines.find((m) => m.id === blue.id)!.times).toEqual(["09:00"]);
  });

  it("removing a medicine removes its ticks too", () => {
    const ticked = setTaken(data, monday, "med-blue01@08:00", true);
    const gone = removeMedicine(ticked, blue.id);
    expect(gone.medicines.map((m) => m.id)).toEqual([vitd.id, eve.id]);
    expect(gone.taken).toEqual({});
  });

  it("makes ids that aren't used yet", () => {
    const values = [0, 0, 0.5];
    const id = newId({ ...EMPTY, medicines: [{ ...blue, id: "med-000000" }] }, () => values.shift()!);
    expect(id).not.toBe("med-000000");
    expect(id).toMatch(/^med-[a-z0-9]{6}$/);
  });
});

describe("reading saved data", () => {
  it("keeps good data exactly", () => {
    const ticked = setTaken(data, monday, "med-blue01@08:00", true, monday);
    expect(readSaved(JSON.parse(JSON.stringify(ticked)))).toEqual(ticked);
  });

  it("skips anything odd instead of breaking", () => {
    expect(readSaved(null)).toEqual(EMPTY);
    expect(readSaved("nope")).toEqual(EMPTY);
    const odd = readSaved({
      medicines: [blue, blue, { id: "bad id", name: "x", times: ["08:00"] }, { id: "med-ok1", name: "", times: ["08:00"] }, 5, { id: "med-ok2", name: "Fine", times: ["8am", "09:00"] }],
      taken: { "2026-11-16": { "med-blue01@08:00": "2026-11-16T08:01:00.000Z", "<script>": "x" }, nope: {}, "2026-11-17": "x" },
    });
    expect(odd.medicines.map((m) => m.id)).toEqual(["med-blue01"]);
    expect(odd.taken).toEqual({ "2026-11-16": { "med-blue01@08:00": "2026-11-16T08:01:00.000Z" } });
  });
});

describe("running low (Stage 3)", () => {
  const counted = { ...blue, stock: { left: 10, perDose: 1, ordered: false } };
  const withCount: MedicationData = { version: 1, medicines: [counted, eve], taken: {} };

  it("counts down with each Taken, and back up if it's unticked", () => {
    const ticked = setTaken(withCount, monday, "med-blue01@08:00", true, monday);
    expect(ticked.medicines[0]!.stock!.left).toBe(9);
    expect(setTaken(ticked, monday, "med-blue01@08:00", true, monday)).toBe(ticked);
    const unticked = setTaken(ticked, monday, "med-blue01@08:00", false, monday);
    expect(unticked.medicines[0]!.stock!.left).toBe(10);
  });

  it("never goes below nothing", () => {
    const one = { ...withCount, medicines: [{ ...counted, stock: { left: 0, perDose: 2, ordered: false } }] };
    expect(setTaken(one, monday, "med-blue01@08:00", true, monday).medicines[0]!.stock!.left).toBe(0);
  });

  it("works out days left from the times and how many each time", () => {
    expect(daysLeft({ ...counted, times: ["08:00", "20:00"], stock: { left: 30, perDose: 2, ordered: false } })).toBe(7);
    expect(daysLeft(eve)).toBeNull();
  });

  it("gives a gentle note at about a week left, until it's ordered", () => {
    expect(runningLow(withCount).map((m) => m.id)).toEqual([]);
    const low = { ...withCount, medicines: [{ ...counted, stock: { left: 6, perDose: 1, ordered: false } }] };
    expect(runningLow(low).map((m) => m.id)).toEqual(["med-blue01"]);
    expect(runningLow(markOrdered(low, "med-blue01"))).toEqual([]);
  });

  it("a higher count means a new supply, so the note can come back next time", () => {
    const ordered = { ...counted, stock: { left: 6, perDose: 1, ordered: true } };
    const fewer = checkDraft({ name: "Blue tablet", amount: "", times: ["08:00"], left: "5", perDose: "1" }, ordered.id, ordered);
    expect(fewer.ok && fewer.medicine.stock).toEqual({ left: 5, perDose: 1, ordered: true });
    const more = checkDraft({ name: "Blue tablet", amount: "", times: ["08:00"], left: "28", perDose: "1" }, ordered.id, ordered);
    expect(more.ok && more.medicine.stock).toEqual({ left: 28, perDose: 1, ordered: false });
  });

  it("asks gently about odd counts", () => {
    const base = { name: "A", amount: "", times: ["08:00"] };
    expect(checkDraft({ ...base, left: "lots", perDose: "" }, "med-x", { added: "2026-11-16", stock: null })).toEqual({ ok: false, problems: ["left-odd"] });
    expect(checkDraft({ ...base, left: "20", perDose: "0" }, "med-x", { added: "2026-11-16", stock: null })).toEqual({ ok: false, problems: ["per-dose-odd"] });
    expect(checkDraft({ ...base, left: "", perDose: "x" }, "med-x", { added: "2026-11-16", stock: null })).toMatchObject({ ok: true, medicine: { stock: null } });
  });

  it("keeps old ticks for about a year, then tidies them away", () => {
    const old = { ...withCount, taken: { "2025-01-01": { "med-blue01@08:00": "x" }, "2026-11-01": { "med-blue01@08:00": "y" } } };
    const next = setTaken(old, monday, "med-eve001@20:00", true, monday);
    expect(Object.keys(next.taken).sort()).toEqual(["2026-11-01", "2026-11-16"]);
  });

  it("reads saved counts back, including 'ordered'", () => {
    const saved = { ...withCount, medicines: [{ ...counted, stock: { left: 6, perDose: 1, ordered: true } }] };
    expect(readSaved(JSON.parse(JSON.stringify(saved))).medicines[0]!.stock).toEqual({ left: 6, perDose: 1, ordered: true });
    expect(readSaved({ medicines: [{ id: "med-a", name: "A", times: ["08:00"], stock: { left: -3 } }] }, "2026-11-16").medicines[0]).toMatchObject({ stock: null, added: "2026-11-16" });
  });
});

describe("countFromAmount: how many come off the count each time", () => {
  it("reads a whole number of things you can count", () => {
    expect(countFromAmount("2 tablets")).toBe(2);
    expect(countFromAmount("1 tablet")).toBe(1);
    expect(countFromAmount(" 3 Puffs")).toBe(3);
    expect(countFromAmount("2 capsules in the morning")).toBe(2);
  });
  it("leaves anything else for the person to fill in", () => {
    expect(countFromAmount("5ml")).toBeNull();
    expect(countFromAmount("5 ml")).toBeNull();
    expect(countFromAmount("half a tablet")).toBeNull();
    expect(countFromAmount("0.5 tablet")).toBeNull();
    expect(countFromAmount("0 tablets")).toBeNull();
    expect(countFromAmount("50 tablets")).toBeNull();
    expect(countFromAmount("")).toBeNull();
  });
});
