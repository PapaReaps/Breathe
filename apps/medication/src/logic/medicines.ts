/*
 * Breathe Medication's saved information, and the calm rules for today's list.
 * Everything here is plain logic with no screens, so it can be tested on its own.
 *
 * Breathe Medication is a reminder and record tool. It never checks doses, suggests
 * amounts or gives medical advice: that's always for a pharmacist or GP.
 */

/** A time of day in 24-hour form, like "08:00" or "20:30". */
export type TimeOfDay = string;

export interface Medicine {
  id: string;
  /** What the person calls it, in their own words. */
  name: string;
  /** Optional: how much, in their own words ("1 tablet", "5ml"). Never checked. */
  amount: string;
  /** Every day at these times (Stage 1 keeps it to every day). Sorted, no repeats. */
  times: TimeOfDay[];
}

/** The saved state: the medicines, and which doses were taken on which day. */
export interface MedicationData {
  version: 1;
  medicines: Medicine[];
  /** taken["2026-11-16"]["med-1@08:00"] = when Taken was tapped (ISO time). */
  taken: Record<string, Record<string, string>>;
}

export const EMPTY: MedicationData = { version: 1, medicines: [], taken: {} };

export const LIMITS = { name: 60, amount: 40, times: 8, medicines: 50 } as const;

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isTime(value: unknown): value is TimeOfDay {
  return typeof value === "string" && TIME.test(value);
}

/** "2026-11-16" for the day in the phone's own time zone. */
export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function doseKey(medicineId: string, time: TimeOfDay): string {
  return `${medicineId}@${time}`;
}

/** "08:00" → "8:00am", "20:30" → "8:30pm", "12:00" → "12:00pm". */
export function timeLabel(time: TimeOfDay): string {
  const [h, m] = time.split(":").map(Number) as [number, number];
  const suffix = h < 12 ? "am" : "pm";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")}${suffix}`;
}

/** Shorter, for sentences: "8pm", "8:30pm". */
export function shortTimeLabel(time: TimeOfDay): string {
  const full = timeLabel(time);
  return full.replace(":00", "");
}

export type PartOfDay = "morning" | "afternoon" | "evening";

export function partOfDay(time: TimeOfDay): PartOfDay {
  const h = Number(time.slice(0, 2));
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function minutes(time: TimeOfDay): number {
  return Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
}

export interface Dose {
  key: string;
  medicine: Medicine;
  time: TimeOfDay;
  taken: boolean;
}

/** Today's doses, earliest first. Medicines with the same time stay in the order they were added. */
export function dosesFor(data: MedicationData, date: Date): Dose[] {
  const done = data.taken[dayKey(date)] ?? {};
  const doses: Dose[] = [];
  for (const medicine of data.medicines) {
    for (const time of medicine.times) {
      const key = doseKey(medicine.id, time);
      doses.push({ key, medicine, time, taken: typeof done[key] === "string" });
    }
  }
  return doses
    .map((dose, order) => ({ dose, order }))
    .sort((a, b) => minutes(a.dose.time) - minutes(b.dose.time) || a.order - b.order)
    .map(({ dose }) => dose);
}

export interface DoseGroup {
  part: PartOfDay;
  doses: Dose[];
}

export function groupByPart(doses: Dose[]): DoseGroup[] {
  const groups: DoseGroup[] = [];
  for (const dose of doses) {
    const part = partOfDay(dose.time);
    const last = groups[groups.length - 1];
    if (last && last.part === part) last.doses.push(dose);
    else groups.push({ part, doses: [dose] });
  }
  return groups;
}

export type NextLine =
  | { kind: "none" }
  | { kind: "next"; dose: Dose }
  | { kind: "all-done" }
  | { kind: "nothing-left-later" };

/**
 * The one calm line at the top. The next dose not taken yet from now on; "all done" once
 * everything is ticked; and if only earlier ones are left, a gentle line with no blame.
 */
export function nextLine(doses: Dose[], now: Date): NextLine {
  if (doses.length === 0) return { kind: "none" };
  if (doses.every((dose) => dose.taken)) return { kind: "all-done" };
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const upcoming = doses.find((dose) => !dose.taken && minutes(dose.time) >= nowMinutes);
  if (upcoming) return { kind: "next", dose: upcoming };
  return { kind: "nothing-left-later" };
}

/** Ticks a dose as taken (or un-ticks it). Returns new data; the old is never changed. */
export function setTaken(data: MedicationData, date: Date, key: string, taken: boolean, at: Date = new Date()): MedicationData {
  const day = dayKey(date);
  const today = { ...(data.taken[day] ?? {}) };
  if (taken) today[key] = at.toISOString();
  else delete today[key];
  const takenAll = { ...data.taken };
  if (Object.keys(today).length === 0) delete takenAll[day];
  else takenAll[day] = today;
  return { ...data, taken: takenAll };
}

export interface MedicineDraft {
  name: string;
  amount: string;
  times: string[];
}

export type DraftProblem = "name-missing" | "name-long" | "amount-long" | "time-missing" | "time-odd" | "too-many-times";

/** Checks the Add a medicine form. Returns the tidy medicine, or what needs a look. */
export function checkDraft(draft: MedicineDraft, id: string): { ok: true; medicine: Medicine } | { ok: false; problems: DraftProblem[] } {
  const problems: DraftProblem[] = [];
  const name = draft.name.trim().replace(/\s+/g, " ");
  const amount = draft.amount.trim().replace(/\s+/g, " ");
  if (name === "") problems.push("name-missing");
  else if (name.length > LIMITS.name) problems.push("name-long");
  if (amount.length > LIMITS.amount) problems.push("amount-long");
  const filled = draft.times.map((t) => t.trim()).filter((t) => t !== "");
  if (filled.length === 0) problems.push("time-missing");
  else if (filled.some((t) => !isTime(t))) problems.push("time-odd");
  const times = [...new Set(filled.filter(isTime))].sort((a, b) => minutes(a) - minutes(b));
  if (times.length > LIMITS.times) problems.push("too-many-times");
  if (problems.length > 0) return { ok: false, problems };
  return { ok: true, medicine: { id, name, amount, times } };
}

/** Adds a new medicine, or replaces the one with the same id. */
export function putMedicine(data: MedicationData, medicine: Medicine): MedicationData {
  const index = data.medicines.findIndex((m) => m.id === medicine.id);
  if (index === -1) return { ...data, medicines: [...data.medicines, medicine] };
  const old = data.medicines[index]!;
  const medicines = [...data.medicines];
  medicines[index] = medicine;
  // Ticks for times that no longer exist are dropped, so a changed time never shows as taken.
  const removedTimes = old.times.filter((t) => !medicine.times.includes(t));
  return { ...dropTicks({ ...data, medicines }, removedTimes.map((t) => doseKey(medicine.id, t))) };
}

/** Removes a medicine and its ticks. */
export function removeMedicine(data: MedicationData, id: string): MedicationData {
  const medicine = data.medicines.find((m) => m.id === id);
  if (!medicine) return data;
  const rest = { ...data, medicines: data.medicines.filter((m) => m.id !== id) };
  return dropTicks(rest, medicine.times.map((t) => doseKey(id, t)));
}

function dropTicks(data: MedicationData, keys: string[]): MedicationData {
  if (keys.length === 0) return data;
  const taken: MedicationData["taken"] = {};
  for (const [day, ticks] of Object.entries(data.taken)) {
    const kept = Object.fromEntries(Object.entries(ticks).filter(([key]) => !keys.includes(key)));
    if (Object.keys(kept).length > 0) taken[day] = kept;
  }
  return { ...data, taken };
}

/** A new id that isn't used yet. */
export function newId(data: MedicationData, random: () => number = Math.random): string {
  for (;;) {
    const id = "med-" + Math.floor(random() * 36 ** 6).toString(36).padStart(6, "0");
    if (!data.medicines.some((m) => m.id === id)) return id;
  }
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Reads saved data defensively. Anything odd is skipped rather than trusted, so a damaged
 * save can never break the app: at worst some items are left out.
 */
export function readSaved(raw: unknown): MedicationData {
  if (typeof raw !== "object" || raw === null) return EMPTY;
  const record = raw as Record<string, unknown>;
  const medicines: Medicine[] = [];
  const seen = new Set<string>();
  if (Array.isArray(record.medicines)) {
    for (const item of record.medicines.slice(0, LIMITS.medicines)) {
      if (typeof item !== "object" || item === null) continue;
      const m = item as Record<string, unknown>;
      if (typeof m.id !== "string" || !/^med-[a-z0-9]{1,12}$/.test(m.id) || seen.has(m.id)) continue;
      const checked = checkDraft(
        {
          name: typeof m.name === "string" ? m.name : "",
          amount: typeof m.amount === "string" ? m.amount : "",
          times: Array.isArray(m.times) ? m.times.filter((t): t is string => typeof t === "string") : [],
        },
        m.id,
      );
      if (!checked.ok) continue;
      seen.add(m.id);
      medicines.push(checked.medicine);
    }
  }
  const taken: MedicationData["taken"] = {};
  if (typeof record.taken === "object" && record.taken !== null) {
    for (const [day, ticks] of Object.entries(record.taken as Record<string, unknown>)) {
      if (!DAY.test(day) || typeof ticks !== "object" || ticks === null) continue;
      const kept: Record<string, string> = {};
      for (const [key, at] of Object.entries(ticks as Record<string, unknown>)) {
        if (typeof at === "string" && at.length <= 40 && /^med-[a-z0-9]{1,12}@([01]\d|2[0-3]):[0-5]\d$/.test(key)) kept[key] = at;
      }
      if (Object.keys(kept).length > 0) taken[day] = kept;
    }
  }
  return { version: 1, medicines, taken };
}
