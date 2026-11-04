import { PAYDAY_RULES } from "../logic/types";
import type { PaydayRule } from "../logic/types";
import type { BillRow, FormState, IncomeRow } from "../logic/form";

/*
 * What gets saved, and how a saved copy or a backup file is checked before it is trusted.
 * Pure code, no browser features, so it can be tested without a browser.
 *
 * Anything read back from the device or from a file is treated as untrusted:
 * it is rebuilt field by field, and anything unexpected is refused, never guessed at.
 */

export const SAVE_FORMAT = 1;
export const BACKUP_APP = "breathe-money";

const MAX_BACKUP_CHARS = 1_000_000;
const MAX_ROWS = 100;
const MAX_NAME = 200;
const MAX_AMOUNT_TEXT = 40;
const MAX_HOLIDAYS_TEXT = 5_000;
const MAX_ANSWERS = 400;
const DATE_OR_BLANK = /^(\d{4}-\d{2}-\d{2})?$/;
const ROW_ID = /^(bill|income)-[a-z0-9-]{1,48}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, max: number): string | null {
  return typeof value === "string" && value.length <= max ? value : null;
}

function dateText(value: unknown): string | null {
  return typeof value === "string" && DATE_OR_BLANK.test(value) ? value : null;
}

function rowId(value: unknown, prefix: "bill" | "income", seen: Set<string>): string | null {
  const id = text(value, 60);
  if (id === null || !id.startsWith(`${prefix}-`) || !ROW_ID.test(id) || seen.has(id)) return null;
  seen.add(id);
  return id;
}

function readBills(raw: unknown): BillRow[] | null {
  if (!Array.isArray(raw) || raw.length > MAX_ROWS) return null;
  const seen = new Set<string>();
  const rows: BillRow[] = [];
  for (const item of raw) {
    if (!isRecord(item)) return null;
    const id = rowId(item.id, "bill", seen);
    const name = text(item.name, MAX_NAME);
    const amount = text(item.amount, MAX_AMOUNT_TEXT);
    const dueDate = dateText(item.dueDate);
    if (id === null || name === null || amount === null || dueDate === null) return null;
    rows.push({ id, name, amount, dueDate });
  }
  return rows;
}

function readIncome(raw: unknown): IncomeRow[] | null {
  if (!Array.isArray(raw) || raw.length > MAX_ROWS) return null;
  const seen = new Set<string>();
  const rows: IncomeRow[] = [];
  for (const item of raw) {
    if (!isRecord(item)) return null;
    const id = rowId(item.id, "income", seen);
    const name = text(item.name, MAX_NAME);
    const amount = text(item.amount, MAX_AMOUNT_TEXT);
    const date = dateText(item.date);
    const reliability = item.reliability;
    if (id === null || name === null || amount === null || date === null) return null;
    if (reliability !== "reliable" && reliability !== "uncertain") return null;
    rows.push({ id, name, amount, date, reliability });
  }
  return rows;
}

function readAnswers(raw: unknown): Record<string, boolean> | null {
  if (!isRecord(raw)) return null;
  const entries = Object.entries(raw);
  if (entries.length > MAX_ANSWERS) return null;
  const answers: Record<string, boolean> = {};
  for (const [key, value] of entries) {
    if (!ROW_ID.test(key) || typeof value !== "boolean") return null;
    answers[key] = value;
  }
  return answers;
}

function readPaydayRule(value: unknown): PaydayRule | "" | null {
  if (value === "") return "";
  if (typeof value === "string" && (PAYDAY_RULES as readonly string[]).includes(value)) {
    return value as PaydayRule;
  }
  return null;
}

/** Rebuilds a form from untrusted data. Returns null if anything is out of place. */
export function readForm(raw: unknown): FormState | null {
  if (!isRecord(raw)) return null;
  const balance = text(raw.balance, MAX_AMOUNT_TEXT);
  const balanceDate = dateText(raw.balanceDate);
  const paydayDate = dateText(raw.paydayDate);
  const paydayRule = readPaydayRule(raw.paydayRule);
  const bills = readBills(raw.bills);
  const income = readIncome(raw.income);
  const foodPerWeek = text(raw.foodPerWeek, MAX_AMOUNT_TEXT);
  const travelPerWeek = text(raw.travelPerWeek, MAX_AMOUNT_TEXT);
  const buffer = text(raw.buffer, MAX_AMOUNT_TEXT);
  const bankHolidays = text(raw.bankHolidays, MAX_HOLIDAYS_TEXT);
  const answers = readAnswers(raw.answers);

  if (
    balance === null || balanceDate === null || paydayDate === null || paydayRule === null ||
    bills === null || income === null || foodPerWeek === null || travelPerWeek === null ||
    buffer === null || bankHolidays === null || answers === null
  ) {
    return null;
  }
  // A row with nothing in it carries no information (it was just opened and never filled in).
  const keptBills = bills.filter((row) => !(row.name.trim() === "" && row.amount.trim() === "" && row.dueDate === ""));
  const keptIncome = income.filter((row) => !(row.name.trim() === "" && row.amount.trim() === "" && row.date === ""));
  return {
    balance, balanceDate, paydayDate, paydayRule, bills: keptBills, income: keptIncome,
    foodPerWeek, travelPerWeek, buffer, bankHolidays, answers,
  };
}

/** A plain copy of the form with exactly the fields we save, and nothing else. */
export function formRecord(form: FormState): FormState {
  return {
    balance: form.balance,
    balanceDate: form.balanceDate,
    paydayDate: form.paydayDate,
    paydayRule: form.paydayRule,
    bills: form.bills.map((row) => ({ id: row.id, name: row.name, amount: row.amount, dueDate: row.dueDate })),
    income: form.income.map((row) => ({
      id: row.id, name: row.name, amount: row.amount, date: row.date, reliability: row.reliability,
    })),
    foodPerWeek: form.foodPerWeek,
    travelPerWeek: form.travelPerWeek,
    buffer: form.buffer,
    bankHolidays: form.bankHolidays,
    answers: { ...form.answers },
  };
}

// ---------------------------------------------------------------- saved on the device

export interface SavedRecord {
  format: number;
  form: FormState;
}

export function toSaved(form: FormState): SavedRecord {
  return { format: SAVE_FORMAT, form: formRecord(form) };
}

/** Null means "this is not something I can safely read". */
export function fromSaved(raw: unknown): FormState | null {
  if (!isRecord(raw) || raw.format !== SAVE_FORMAT) return null;
  return readForm(raw.form);
}

// ---------------------------------------------------------------- backup files

export type BackupProblem = "too-big" | "not-json" | "not-ours" | "newer" | "unreadable";

export type BackupParse =
  | { ok: true; form: FormState; savedOn: string | null }
  | { ok: false; reason: BackupProblem };

export function backupFileName(today: string): string {
  return `breathe-money-backup-${today}.breathe-backup.json`;
}

/** The text of a backup file. It is NOT encrypted, and says so inside the file too. */
export function makeBackupText(form: FormState, today: string): string {
  return JSON.stringify(
    {
      app: BACKUP_APP,
      format: SAVE_FORMAT,
      encrypted: false,
      savedOn: today,
      form: formRecord(form),
    },
    null,
    2,
  );
}

export function parseBackupText(content: string): BackupParse {
  if (content.length > MAX_BACKUP_CHARS) return { ok: false, reason: "too-big" };

  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    return { ok: false, reason: "not-json" };
  }

  if (!isRecord(raw) || raw.app !== BACKUP_APP || typeof raw.format !== "number") {
    return { ok: false, reason: "not-ours" };
  }
  if (raw.format > SAVE_FORMAT) return { ok: false, reason: "newer" };
  if (raw.format !== SAVE_FORMAT) return { ok: false, reason: "not-ours" };

  const form = readForm(raw.form);
  if (form === null) return { ok: false, reason: "unreadable" };

  const savedOn = typeof raw.savedOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.savedOn) ? raw.savedOn : null;
  return { ok: true, form, savedOn };
}
