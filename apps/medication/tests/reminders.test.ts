import { describe, expect, it } from "vitest";
import { setTaken, type MedicationData } from "../src/logic/medicines";
import {
  DAYS_AHEAD,
  DEFAULT_REMINDERS,
  MAX_REMINDERS,
  planReminders,
  readReminderSettings,
  reminderId,
  takenFromReminder,
} from "../src/logic/reminders";

const data: MedicationData = {
  version: 1,
  medicines: [
    { id: "med-blue01", name: "Blue tablet", amount: "1 tablet", times: ["08:00"] },
    { id: "med-vitd01", name: "Vitamin D", amount: "", times: ["08:00"] },
    { id: "med-eve001", name: "Evening tablet", amount: "", times: ["20:00"] },
  ],
  taken: {},
};
const on = { on: true, nudge: true, asked: true };
const morning = new Date(2026, 10, 16, 7, 0);

describe("planning reminders", () => {
  it("sets nothing while reminders are off", () => {
    expect(planReminders(data, DEFAULT_REMINDERS, morning)).toEqual([]);
    expect(planReminders({ ...data, medicines: [] }, on, morning)).toEqual([]);
  });

  it("one reminder per time, not per medicine, with a nudge 30 minutes later", () => {
    const today = planReminders(data, on, morning).filter((r) => r.day === "2026-11-16");
    expect(today.map((r) => [r.kind, r.at.getHours() + ":" + String(r.at.getMinutes()).padStart(2, "0"), r.count])).toEqual([
      ["due", "8:00", 2],
      ["nudge", "8:30", 2],
      ["due", "20:00", 1],
      ["nudge", "20:30", 1],
    ]);
    expect(today[0]!.title).toBe("Time for your 8am medicines");
    expect(today[2]!.title).toBe("Time for your 8pm medicine");
  });

  it("never names a medicine, so nothing private shows on the lock screen", () => {
    for (const r of planReminders(data, on, morning)) {
      for (const m of data.medicines) {
        expect(r.title + r.body).not.toContain(m.name);
      }
    }
  });

  it("skips anything already ticked, and its nudge", () => {
    let ticked = setTaken(data, morning, "med-blue01@08:00", true);
    ticked = setTaken(ticked, morning, "med-vitd01@08:00", true);
    const today = planReminders(ticked, on, morning).filter((r) => r.day === "2026-11-16");
    expect(today.map((r) => r.kind + "@" + r.time)).toEqual(["due@20:00", "nudge@20:00"]);
  });

  it("if only some at that time are ticked, the reminder stays, for the rest", () => {
    const some = setTaken(data, morning, "med-blue01@08:00", true);
    const first = planReminders(some, on, morning)[0]!;
    expect([first.kind, first.time, first.count]).toEqual(["due", "08:00", 1]);
  });

  it("leaves out the past, but still nudges if the reminder has just gone", () => {
    const justAfter = new Date(2026, 10, 16, 8, 10);
    const first = planReminders(data, on, justAfter)[0]!;
    expect([first.kind, first.time]).toEqual(["nudge", "08:00"]);
  });

  it("no nudges when the person doesn't want them", () => {
    expect(planReminders(data, { ...on, nudge: false }, morning).some((r) => r.kind === "nudge")).toBe(false);
  });

  it("plans two weeks ahead, stays under the phone's limit, and ends with a calm 'open the app' note", () => {
    const plan = planReminders(data, on, morning);
    expect(plan.length).toBeLessThanOrEqual(MAX_REMINDERS);
    expect(plan[plan.length - 1]!.kind).toBe("keep-going");
    const days = new Set(plan.map((r) => r.day));
    expect(days.size).toBeGreaterThan(1);
    expect(days.size).toBeLessThanOrEqual(DAYS_AHEAD);
    for (let i = 1; i < plan.length; i += 1) expect(plan[i]!.at.getTime()).toBeGreaterThanOrEqual(plan[i - 1]!.at.getTime());
    expect(new Set(plan.map((r) => r.id)).size).toBe(plan.length);
  });

  it("each reminder keeps the same id every time, so old ones can be found and cancelled", () => {
    expect(reminderId("due", "2026-11-16", "08:00")).toBe(reminderId("due", "2026-11-16", "08:00"));
    expect(reminderId("due", "2026-11-16", "08:00")).not.toBe(reminderId("nudge", "2026-11-16", "08:00"));
    expect(reminderId("due", "2026-11-16", "08:00")).toBeGreaterThan(0);
    expect(reminderId("due", "2026-11-16", "08:00")).toBeLessThan(2 ** 31);
  });
});

describe("Taken on a reminder", () => {
  it("ticks every medicine due at that time that day", () => {
    const result = takenFromReminder(data, "2026-11-16", "08:00", new Date(2026, 10, 16, 8, 5));
    expect(result!.keys).toEqual(["med-blue01@08:00", "med-vitd01@08:00"]);
  });

  it("ignores odd or future days", () => {
    expect(takenFromReminder(data, "nope", "08:00", morning)).toBeNull();
    expect(takenFromReminder(data, "2026-02-31", "08:00", morning)).toBeNull();
    expect(takenFromReminder(data, "2026-11-20", "08:00", morning)).toBeNull();
  });
});

describe("saved reminder settings", () => {
  it("start off, with the nudge ready", () => {
    expect(readReminderSettings(null)).toEqual({ on: false, nudge: true, asked: false });
    expect(readReminderSettings({ on: true, nudge: false, asked: true })).toEqual({ on: true, nudge: false, asked: true });
    expect(readReminderSettings({ on: "yes" })).toEqual({ on: false, nudge: true, asked: false });
  });
});
