/*
 * Which phone reminders to set, worked out from the medicines and today's ticks.
 * Plain logic with no phone parts, so it can be tested. The phone side is in ../notify.ts.
 *
 * - One reminder per time of day (several medicines at 8am share one), never per medicine,
 *   so the phone never buzzes three times at once.
 * - One gentle nudge 30 minutes later if it isn't ticked yet (if the person wants it). Then quiet.
 * - The words never name a medicine, so nothing private shows on the lock screen.
 * - Reminders are set two weeks ahead. Every time the app opens (or Taken is tapped on a
 *   reminder) they're topped up again. Just in case the app isn't opened for two weeks, the
 *   last one is a calm note asking to open it, so reminders never stop silently.
 */

import { dayKey, dosesFor, shortTimeLabel, type MedicationData, type TimeOfDay } from "./medicines";

export interface ReminderSettings {
  /** Reminders on the phone. Off until the person says yes. */
  on: boolean;
  /** One gentle nudge 30 minutes later if not ticked yet. */
  nudge: boolean;
  /** We've asked once already, so we don't keep asking. */
  asked: boolean;
}

export const DEFAULT_REMINDERS: ReminderSettings = { on: false, nudge: true, asked: false };

export const NUDGE_MINUTES = 30;
export const DAYS_AHEAD = 14;
/** Android allows a few hundred waiting alarms per app; staying well under keeps it reliable. */
export const MAX_REMINDERS = 60;

export type ReminderKind = "due" | "nudge" | "keep-going";

export interface PlannedReminder {
  id: number;
  at: Date;
  kind: ReminderKind;
  /** The day ("2026-11-16") and time ("20:00") it's about. */
  day: string;
  time: TimeOfDay;
  /** How many medicines are due at that time (for "medicine" or "medicines"). */
  count: number;
  title: string;
  body: string;
}

export const reminderWords = {
  dueTitle: (time: string, count: number) => `Time for your ${time} ${count === 1 ? "medicine" : "medicines"}`,
  dueBody: "Take a breath. Tap Taken when it's done.",
  nudgeTitle: (time: string, count: number) => `A gentle nudge: your ${time} ${count === 1 ? "medicine" : "medicines"}`,
  nudgeBody: "If you've already taken it, tap Taken. This is the only nudge.",
  keepGoingTitle: "Open Breathe Medication",
  keepGoingBody: "Open the app now and then, so your reminders keep coming.",
} as const;

/** A steady whole number for each reminder, the same every time it's worked out (FNV-1a). */
export function reminderId(kind: ReminderKind, day: string, time: TimeOfDay): number {
  let hash = 0x811c9dc5;
  for (const ch of `${kind}|${day}|${time}`) {
    hash ^= ch.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  // Positive, and never 0.
  return (hash >>> 1) || 1;
}

function at(day: Date, time: TimeOfDay): Date {
  const d = new Date(day.getFullYear(), day.getMonth(), day.getDate(), Number(time.slice(0, 2)), Number(time.slice(3, 5)), 0, 0);
  return d;
}

/** Every reminder to set from now on, soonest first. Empty if reminders are off. */
export function planReminders(data: MedicationData, settings: ReminderSettings, now: Date): PlannedReminder[] {
  if (!settings.on || data.medicines.length === 0) return [];
  const plan: PlannedReminder[] = [];
  for (let offset = 0; offset < DAYS_AHEAD; offset += 1) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const key = dayKey(day);
    const waiting = new Map<TimeOfDay, number>();
    for (const dose of dosesFor(data, day)) {
      if (!dose.taken) waiting.set(dose.time, (waiting.get(dose.time) ?? 0) + 1);
    }
    for (const [time, count] of waiting) {
      const due = at(day, time);
      const label = shortTimeLabel(time);
      if (due > now) {
        plan.push({ id: reminderId("due", key, time), at: due, kind: "due", day: key, time, count, title: reminderWords.dueTitle(label, count), body: reminderWords.dueBody });
      }
      const nudge = new Date(due.getTime() + NUDGE_MINUTES * 60_000);
      if (settings.nudge && nudge > now) {
        plan.push({ id: reminderId("nudge", key, time), at: nudge, kind: "nudge", day: key, time, count, title: reminderWords.nudgeTitle(label, count), body: reminderWords.nudgeBody });
      }
    }
  }
  plan.sort((a, b) => a.at.getTime() - b.at.getTime() || (a.kind === "due" ? -1 : 1));
  const kept = plan.slice(0, MAX_REMINDERS - 1);
  const last = kept[kept.length - 1];
  if (last) {
    const keepAt = new Date(last.at.getTime() + 60_000);
    kept.push({ id: reminderId("keep-going", last.day, last.time), at: keepAt, kind: "keep-going", day: last.day, time: last.time, count: 0, title: reminderWords.keepGoingTitle, body: reminderWords.keepGoingBody });
  }
  return kept;
}

/** Reads saved reminder settings, falling back calmly on anything odd. */
export function readReminderSettings(raw: unknown): ReminderSettings {
  if (typeof raw !== "object" || raw === null) return DEFAULT_REMINDERS;
  const r = raw as Record<string, unknown>;
  return { on: r.on === true, nudge: r.nudge !== false, asked: r.asked === true };
}

/** Ticks every dose due at that time on that day (Taken on a reminder covers them all). */
export function takenFromReminder(data: MedicationData, day: string, time: TimeOfDay, at: Date): { day: Date; keys: string[] } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (dayKey(date) !== day || date.getTime() > at.getTime()) return null;
  const keys = dosesFor(data, date)
    .filter((dose) => dose.time === time && !dose.taken)
    .map((dose) => dose.key);
  return { day: date, keys };
}
