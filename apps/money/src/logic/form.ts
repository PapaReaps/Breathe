import { isWorkingDay, toDayNumber, weekdayName } from "./dates";
import { parseMoney } from "./money";
import type {
  Bill,
  CalculatorInput,
  DateString,
  Essential,
  Income,
  PaydayRule,
} from "./types";
import { words } from "../content/words";

/*
 * Turns what is typed into the form into the information the calculator needs.
 * Kept separate from the screen so it can be tested without a browser.
 * It never blames: if something can't be read yet, it returns a gentle message.
 */

let counter = 0;
/** Simple row ids. (crypto.randomUUID is not available on a phone over plain http.) */
export function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

export interface BillRow {
  id: string;
  name: string;
  amount: string;
  dueDate: string;
}

export interface IncomeRow {
  id: string;
  name: string;
  amount: string;
  date: string;
  reliability: "reliable" | "uncertain";
}

export interface FormState {
  balance: string;
  balanceDate: string;
  paydayDate: string;
  paydayRule: PaydayRule | "";
  bills: BillRow[];
  income: IncomeRow[];
  foodPerDay: string;
  travel: string;
  buffer: string;
  bankHolidays: string;
  /** The person's answers to "is this already in your balance?", by row id. */
  answers: Record<string, boolean>;
}

export function newBillRow(): BillRow {
  return { id: nextId("bill"), name: "", amount: "", dueDate: "" };
}

export function newIncomeRow(): IncomeRow {
  return { id: nextId("income"), name: "", amount: "", date: "", reliability: "reliable" };
}

export function emptyForm(): FormState {
  return {
    balance: "",
    balanceDate: "",
    paydayDate: "",
    paydayRule: "",
    bills: [newBillRow()],
    income: [],
    foodPerDay: "",
    travel: "",
    buffer: "",
    bankHolidays: "",
    answers: {},
  };
}

function isRealDay(date: string): boolean {
  try {
    toDayNumber(date);
    return true;
  } catch {
    return false;
  }
}

/** Reads a typed list of dates. Returns the good ones and the ones it could not read. */
export function parseDayList(text: string): { days: DateString[]; bad: string[] } {
  const days: DateString[] = [];
  const bad: string[] = [];
  for (const part of text.split(/[\s,;]+/)) {
    if (part === "") continue;
    if (isRealDay(part)) days.push(part);
    else bad.push(part);
  }
  return { days, bad };
}

/** Is this payday a weekend or a listed bank holiday? */
export function paydayIsNonWorkingDay(paydayDate: string, bankHolidaysText: string): boolean {
  if (!isRealDay(paydayDate)) return false;
  const { days } = parseDayList(bankHolidaysText);
  return !isWorkingDay(paydayDate, new Set(days));
}

/** "a Saturday", "a Sunday" or "a bank holiday". */
export function nonWorkingDayPhrase(paydayDate: string): string {
  const name = weekdayName(paydayDate);
  return name === "Saturday" || name === "Sunday" ? `a ${name}` : "a bank holiday";
}

export type BuildResult =
  | { status: "needs-more"; messages: string[] }
  | { status: "ready"; input: CalculatorInput };

function blank(text: string): boolean {
  return text.trim() === "";
}

export function buildInput(form: FormState, today: DateString): BuildResult {
  const messages: string[] = [];

  // Balance
  let balance: number | null = null;
  if (blank(form.balance)) {
    messages.push(words.needBalance);
  } else {
    const parsed = parseMoney(form.balance, { allowNegative: true });
    if (parsed.ok) balance = parsed.pence;
    else messages.push(words.cantReadAmount("your account balance"));
  }

  const balanceDate = blank(form.balanceDate) ? today : form.balanceDate;
  if (!isRealDay(balanceDate)) {
    messages.push(words.cantReadDate("the date for your balance"));
  } else if (balanceDate > today) {
    messages.push(words.balanceDateFuture);
  }

  // Bank holidays
  const holidays = parseDayList(form.bankHolidays);
  if (holidays.bad.length > 0) messages.push(words.cantReadDates(holidays.bad.join(", ")));

  // Payday
  let paydayRule: PaydayRule = "on-the-day";
  if (blank(form.paydayDate)) {
    messages.push(words.needPayday);
  } else if (!isRealDay(form.paydayDate)) {
    messages.push(words.cantReadDate("your payday"));
  } else if (paydayIsNonWorkingDay(form.paydayDate, form.bankHolidays)) {
    if (form.paydayRule === "") {
      messages.push(words.askPaydayRule(nonWorkingDayPhrase(form.paydayDate)));
    } else {
      paydayRule = form.paydayRule;
    }
  }

  // Bills
  const bills: Bill[] = [];
  for (const row of form.bills) {
    if (blank(row.name) && blank(row.amount) && row.dueDate === "") continue;
    const name = blank(row.name) ? "Bill" : row.name.trim();
    if (blank(row.amount) || row.dueDate === "") {
      messages.push(words.unfinishedRow(name, "an amount and a due date"));
      continue;
    }
    const parsed = parseMoney(row.amount);
    if (!parsed.ok) {
      messages.push(words.cantReadAmount(`"${name}"`));
      continue;
    }
    if (!isRealDay(row.dueDate)) {
      messages.push(words.cantReadDate(`the due date for "${name}"`));
      continue;
    }
    const answer = form.answers[row.id];
    bills.push({
      id: row.id,
      name,
      amount: parsed.pence,
      dueDate: row.dueDate,
      ...(answer === undefined ? {} : { alreadyInBalance: answer }),
    });
  }

  // Money coming in
  const income: Income[] = [];
  for (const row of form.income) {
    if (blank(row.name) && blank(row.amount) && row.date === "") continue;
    const name = blank(row.name) ? "Money coming in" : row.name.trim();
    if (blank(row.amount) || row.date === "") {
      messages.push(words.unfinishedRow(name, "an amount and a date"));
      continue;
    }
    const parsed = parseMoney(row.amount);
    if (!parsed.ok) {
      messages.push(words.cantReadAmount(`"${name}"`));
      continue;
    }
    if (!isRealDay(row.date)) {
      messages.push(words.cantReadDate(`the date for "${name}"`));
      continue;
    }
    const answer = form.answers[row.id];
    income.push({
      id: row.id,
      name,
      amount: parsed.pence,
      date: row.date,
      reliability: row.reliability,
      ...(answer === undefined ? {} : { alreadyInBalance: answer }),
    });
  }

  // Food, travel and buffer
  const essentials: Essential[] = [];
  if (!blank(form.foodPerDay)) {
    const parsed = parseMoney(form.foodPerDay);
    if (!parsed.ok) messages.push(words.cantReadAmount("food and everyday spending"));
    else if (parsed.pence > 0) {
      essentials.push({ id: "food", name: "Food and everyday spending", kind: "per-day", amount: parsed.pence });
    }
  }
  if (!blank(form.travel)) {
    const parsed = parseMoney(form.travel);
    if (!parsed.ok) messages.push(words.cantReadAmount("travel"));
    else if (parsed.pence > 0) {
      essentials.push({ id: "travel", name: "Travel", kind: "lump-sum", amount: parsed.pence });
    }
  }
  let buffer = 0;
  if (!blank(form.buffer)) {
    const parsed = parseMoney(form.buffer);
    if (!parsed.ok) messages.push(words.cantReadAmount("your safety buffer"));
    else buffer = parsed.pence;
  }

  if (messages.length > 0 || balance === null) {
    return { status: "needs-more", messages };
  }

  return {
    status: "ready",
    input: {
      today,
      balance: { amount: balance, asOf: balanceDate },
      payday: { date: form.paydayDate, ifNotWorkingDay: paydayRule },
      nonWorkingDays: holidays.days,
      bills,
      income,
      pendingPayments: [],
      essentials,
      buffer,
      savings: [],
    },
  };
}
