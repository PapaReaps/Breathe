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
  /** Every day at these times. Sorted, no repeats. */
  times: TimeOfDay[];
  /** Optional tablet count (Stage 3), for a gentle note before it runs out. */
  stock: Stock | null;
  /** The day it was added ("2026-11-16"), so the history doesn't show earlier days as empty. */
  added: string;
}

/** How many are left, how many each Taken uses, and whether more has been ordered. */
export interface Stock {
  left: number;
  perDose: number;
  /** "I've ordered it" was tapped, so the running-low note rests until the count goes up again. */
  ordered: boolean;
}

/** The saved state: the medicines, and which doses were taken on which day. */
export interface MedicationData {
  version: 1;
  medicines: Medicine[];
  /** taken["2026-11-16"]["med-1@08:00"] = when Taken was tapped (ISO time). */
  taken: Record<string, Record<string, string>>;
}

export const EMPTY: MedicationData = { version: 1, medicines: [], taken: {} };

export const LIMITS = { name: 60, amount: 40, times: 8, medicines: 50, left: 9999, perDose: 20 } as const;

/** The running-low note shows when about this many days are left. */
export const LOW_DAYS = 7;

/** Ticks older than this are tidied away, so the saved list never grows forever. */
export const KEEP_DAYS = 400;

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
  const day = dayKey(date);
  const done = data.taken[day] ?? {};
  const doses: Dose[] = [];
  for (const medicine of data.medicines) {
    // Not yet added on that day, so it isn't counted (the history never shows it as missed).
    if (medicine.added > day) continue;
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
  const was = typeof today[key] === "string";
  if (was === taken) return data;
  if (taken) today[key] = at.toISOString();
  else delete today[key];
  const cutoff = dayKey(new Date(at.getFullYear(), at.getMonth(), at.getDate() - KEEP_DAYS));
  const takenAll: MedicationData["taken"] = {};
  for (const [d, ticks] of Object.entries(data.taken)) if (d >= cutoff) takenAll[d] = ticks;
  if (Object.keys(today).length === 0) delete takenAll[day];
  else takenAll[day] = today;
  // The tablet count goes down with each Taken, and back up if it's unticked.
  const id = key.slice(0, key.indexOf("@"));
  const medicines = data.medicines.map((m) => {
    if (m.id !== id || m.stock === null) return m;
    const left = taken ? Math.max(0, m.stock.left - m.stock.perDose) : Math.min(LIMITS.left, m.stock.left + m.stock.perDose);
    return { ...m, stock: { ...m.stock, left } };
  });
  return { ...data, medicines, taken: takenAll };
}

/** About how many days are left, or null without a count. Whole days, rounded down. */
export function daysLeft(medicine: Medicine): number | null {
  if (medicine.stock === null || medicine.times.length === 0) return null;
  return Math.floor(medicine.stock.left / (medicine.stock.perDose * medicine.times.length));
}

/** Medicines with about a week or less left, not yet ordered. */
export function runningLow(data: MedicationData): Medicine[] {
  return data.medicines.filter((m) => {
    const days = daysLeft(m);
    return days !== null && days <= LOW_DAYS && m.stock !== null && !m.stock.ordered;
  });
}

/** "I've ordered it": the note rests until the count goes up. */
export function markOrdered(data: MedicationData, id: string): MedicationData {
  return {
    ...data,
    medicines: data.medicines.map((m) => (m.id === id && m.stock ? { ...m, stock: { ...m.stock, ordered: true } } : m)),
  };
}

export interface MedicineDraft {
  name: string;
  amount: string;
  times: string[];
  /** Tablets left, as typed. Blank means no count. */
  left: string;
  /** How many each time, as typed. Blank means 1. */
  perDose: string;
}

export type DraftProblem =
  | "name-missing"
  | "name-long"
  | "amount-long"
  | "time-missing"
  | "time-odd"
  | "too-many-times"
  | "left-odd"
  | "per-dose-odd";

/** What a changed medicine keeps from before: the day it was added, and its count. */
export interface Kept {
  added: string;
  stock: Stock | null;
}

function wholeNumber(text: string, min: number, max: number): number | null {
  const t = text.trim();
  if (!/^\d{1,5}$/.test(t)) return null;
  const n = Number(t);
  return n >= min && n <= max ? n : null;
}

/** Checks the Add a medicine form. Returns the tidy medicine, or what needs a look. */
/**
 * "2 tablets" means 2 come off the count each time. Only for things you can count one by one
 * (tablets, capsules, puffs and so on), and only a plain whole number at the start: "5ml" or
 * "half a tablet" give null, and the person fills it in themselves.
 */
const COUNTABLE = /^(tablet|tab|pill|capsule|cap|puff|spray|drop|sachet|patch|lozenge|pastille|injection|pen|dose)s?$/i;
export function countFromAmount(amount: string): number | null {
  const match = /^\s*(\d{1,2})\s*([a-z]+)/i.exec(amount);
  if (!match) return null;
  const n = Number(match[1]);
  if (!COUNTABLE.test(match[2]!) || n < 1 || n > LIMITS.perDose) return null;
  return n;
}

export function checkDraft(draft: MedicineDraft, id: string, kept: Kept): { ok: true; medicine: Medicine } | { ok: false; problems: DraftProblem[] } {
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
  let stock: Stock | null = null;
  if (draft.left.trim() !== "") {
    const left = wholeNumber(draft.left, 0, LIMITS.left);
    const perDose = draft.perDose.trim() === "" ? 1 : wholeNumber(draft.perDose, 1, LIMITS.perDose);
    if (left === null) problems.push("left-odd");
    if (perDose === null) problems.push("per-dose-odd");
    if (left !== null && perDose !== null) {
      // A higher count means a new supply arrived, so the running-low note can come back next time.
      const ordered = kept.stock !== null && left <= kept.stock.left ? kept.stock.ordered : false;
      stock = { left, perDose, ordered };
    }
  }
  if (problems.length > 0) return { ok: false, problems };
  return { ok: true, medicine: { id, name, amount, times, stock, added: kept.added } };
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
export function readSaved(raw: unknown, today: string = dayKey(new Date())): MedicationData {
  if (typeof raw !== "object" || raw === null) return EMPTY;
  const record = raw as Record<string, unknown>;
  const medicines: Medicine[] = [];
  const seen = new Set<string>();
  if (Array.isArray(record.medicines)) {
    for (const item of record.medicines.slice(0, LIMITS.medicines)) {
      if (typeof item !== "object" || item === null) continue;
      const m = item as Record<string, unknown>;
      if (typeof m.id !== "string" || !/^med-[a-z0-9]{1,12}$/.test(m.id) || seen.has(m.id)) continue;
      const rawStock = typeof m.stock === "object" && m.stock !== null ? (m.stock as Record<string, unknown>) : null;
      // A count that doesn't make sense is dropped, never the medicine itself.
      const okCount = (n: unknown, min: number, max: number): n is number => Number.isInteger(n) && (n as number) >= min && (n as number) <= max;
      const goodStock = rawStock !== null && okCount(rawStock.left, 0, LIMITS.left) && okCount(rawStock.perDose, 1, LIMITS.perDose);
      const left = goodStock ? String(rawStock.left) : "";
      const perDose = goodStock ? String(rawStock.perDose) : "1";
      const added = typeof m.added === "string" && DAY.test(m.added) ? m.added : today;
      const checked = checkDraft(
        {
          name: typeof m.name === "string" ? m.name : "",
          amount: typeof m.amount === "string" ? m.amount : "",
          times: Array.isArray(m.times) ? m.times.filter((t): t is string => typeof t === "string") : [],
          left,
          perDose,
        },
        m.id,
        { added, stock: null },
      );
      if (!checked.ok) continue;
      seen.add(m.id);
      const medicine = checked.medicine;
      if (medicine.stock && rawStock?.ordered === true) medicine.stock = { ...medicine.stock, ordered: true };
      medicines.push(medicine);
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
