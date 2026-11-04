import { addDays, formatDayLong, isWorkingDay, toDayNumber, weekdayName } from "./dates";
import { formatMoney, parseMoney } from "./money";
import { isRepeat, nextOccurrenceOnOrAfter, occurrencesBetween } from "./repeat";
import type { Repeat } from "./repeat";
import { resolvePayday } from "./safeToSpend";
import type {
  Bill,
  CalculatorInput,
  DateString,
  Essential,
  Income,
  PaydayRule,
} from "./types";
import { words } from "../content/words";
import { BUILT_IN_HOLIDAYS, BUILT_IN_LAST_DAY, isHolidayRegion } from "../data/bankHolidays";
import type { HolidayRegion } from "../data/bankHolidays";

/*
 * Turns what is typed into the form into the information the calculator needs.
 * Kept separate from the screen so it can be tested without a browser.
 * It never blames: if something can't be read yet, it returns a gentle message.
 */

let counter = 0;
/**
 * Row ids. They are saved with the numbers, so they must stay unique across visits:
 * a counter alone would start again at 1 and clash with saved rows.
 * (crypto.randomUUID is not available on a phone over plain http, so this builds its own.)
 */
export function nextId(prefix: string): string {
  counter += 1;
  const random = Math.floor(Math.random() * 36 ** 5).toString(36).padStart(5, "0");
  return `${prefix}-${counter}-${random}`;
}

export interface BillRow {
  id: string;
  name: string;
  amount: string;
  dueDate: string;
  /** "once", or how often it comes round. dueDate is the first one. */
  repeat: Repeat;
}

export interface IncomeRow {
  id: string;
  name: string;
  amount: string;
  date: string;
  reliability: "reliable" | "uncertain";
  /** "once", or how often it comes round. date is the first one. */
  repeat: Repeat;
}

export interface FormState {
  balance: string;
  balanceDate: string;
  paydayDate: string;
  paydayRule: PaydayRule | "";
  /** "once" means the one date only. Otherwise payday rolls forward by itself. */
  paydayRepeat: Repeat;
  bills: BillRow[];
  income: IncomeRow[];
  foodPerWeek: string;
  travelPerWeek: string;
  buffer: string;
  /** Extra days when money does not move, typed by the person, on top of their region's list. */
  bankHolidays: string;
  /** Which built-in list of bank holidays to use. "own" means only the typed days. */
  bankHolidayRegion: HolidayRegion;
  /** The person's answers to "is this already in your balance?", by row id. */
  answers: Record<string, boolean>;
}

export function newBillRow(): BillRow {
  return { id: nextId("bill"), name: "", amount: "", dueDate: "", repeat: "once" };
}

export function newIncomeRow(): IncomeRow {
  return { id: nextId("income"), name: "", amount: "", date: "", reliability: "reliable", repeat: "once" };
}

export function emptyForm(): FormState {
  return {
    balance: "",
    balanceDate: "",
    paydayDate: "",
    paydayRule: "",
    paydayRepeat: "once",
    bills: [],
    income: [],
    foodPerWeek: "",
    travelPerWeek: "",
    buffer: "",
    bankHolidays: "",
    bankHolidayRegion: "own",
    answers: {},
  };
}

/**
 * Typing a new balance means "this is what is in my account now", so the balance
 * takes today's date. That way a balance saved last week still says it is from
 * last week when the app is opened again, instead of looking fresh.
 */
export function withBalance(form: FormState, balance: string, today: DateString): FormState {
  if (balance.trim() === "") return { ...form, balance };
  return { ...form, balance, balanceDate: today };
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

/** Numbers saved before regions existed have none, which means "my own list". */
export function regionOf(form: Pick<FormState, "bankHolidayRegion">): HolidayRegion {
  return isHolidayRegion(form.bankHolidayRegion) ? form.bankHolidayRegion : "own";
}

/** Every day money does not move: the built-in list for the region, plus any days typed in. */
export function holidayDays(region: HolidayRegion, typedText: string): DateString[] {
  const typed = parseDayList(typedText).days;
  if (region === "own") return typed;
  return [...new Set([...BUILT_IN_HOLIDAYS[region], ...typed])];
}

/** Is this payday a weekend or a listed bank holiday? */
export function paydayIsNonWorkingDay(
  paydayDate: string,
  bankHolidaysText: string,
  region: HolidayRegion = "own",
): boolean {
  if (!isRealDay(paydayDate)) return false;
  return !isWorkingDay(paydayDate, new Set(holidayDays(region, bankHolidaysText)));
}

/** "a Saturday", "a Sunday" or "a bank holiday". */
export function nonWorkingDayPhrase(paydayDate: string): string {
  const name = weekdayName(paydayDate);
  return name === "Saturday" || name === "Sunday" ? `a ${name}` : "a bank holiday";
}

function repeatOf(value: unknown): Repeat {
  // Numbers saved before repeats existed have no "repeat" at all: that means one date only.
  return isRepeat(value) ? value : "once";
}

/**
 * The weekend question for payday, or null when there is nothing to ask.
 *  - One date only: ask if that date is a weekend or bank holiday (as always).
 *  - Every month: always ask, because some months will land on a weekend.
 *  - Every week / 2 / 4 weeks: ask if the first date or the next one is a weekend or bank holiday.
 */
export function paydayRuleQuestion(form: FormState, today: DateString): string | null {
  if (!isRealDay(form.paydayDate)) return null;
  const repeat = repeatOf(form.paydayRepeat);
  const region = regionOf(form);
  if (repeat === "once") {
    return paydayIsNonWorkingDay(form.paydayDate, form.bankHolidays, region)
      ? words.askPaydayRule(nonWorkingDayPhrase(form.paydayDate))
      : null;
  }
  if (repeat === "monthly") return words.askPaydayRuleMonthly;
  if (paydayIsNonWorkingDay(form.paydayDate, form.bankHolidays, region)) {
    return words.askPaydayRule(nonWorkingDayPhrase(form.paydayDate));
  }
  const next = nextOccurrenceOnOrAfter(form.paydayDate, repeat, today);
  if (next !== null && paydayIsNonWorkingDay(next, form.bankHolidays, region)) {
    return words.askPaydayRule(nonWorkingDayPhrase(next));
  }
  return null;
}

export interface PaydayPlan {
  /** The date as the pattern gives it, before the weekend answer is applied. */
  nominal: DateString;
  /** The day the money really arrives, after the weekend answer. */
  resolved: DateString;
  /** A repeating payday that has come and gone since the balance was entered, if any. */
  paidSince: DateString | null;
}

/**
 * Works out which payday the number is counting down to.
 * A payday that repeats rolls forward by itself, so there is no "payday has passed"
 * for it. It also notices a payday that went by after the balance was entered.
 */
export function planPayday(
  paydayDate: DateString,
  repeat: Repeat,
  rule: PaydayRule,
  holidays: readonly DateString[],
  today: DateString,
  balanceDate: DateString,
): PaydayPlan {
  const nonWorking = new Set(holidays);
  const resolve = (date: DateString): DateString =>
    resolvePayday({ date, ifNotWorkingDay: rule }, nonWorking);

  if (repeat === "once") {
    return { nominal: paydayDate, resolved: resolve(paydayDate), paidSince: null };
  }

  // Look a little way back (a payday moved by the weekend answer) and well ahead.
  const from = addDays(balanceDate < today ? balanceDate : today, -14);
  const to = addDays(today, 70);
  let nominals = occurrencesBetween(paydayDate, repeat, from, to);
  if (nominals.length === 0) {
    const first = nextOccurrenceOnOrAfter(paydayDate, repeat, from);
    nominals = [first ?? paydayDate];
  }
  const dated = nominals.map((nominal) => ({ nominal, resolved: resolve(nominal) }));
  const next = dated.find((item) => item.resolved >= today) ?? dated[dated.length - 1]!;

  let paidSince: DateString | null = null;
  for (const item of dated) {
    if (item.resolved > balanceDate && item.resolved < today) paidSince = item.resolved;
  }
  return { nominal: next.nominal, resolved: next.resolved, paidSince };
}

export type BuildResult =
  | { status: "needs-more"; messages: string[] }
  | {
      status: "ready";
      input: CalculatorInput;
      /** Set when a repeating payday has gone by since the balance was entered. */
      paidSince: DateString | null;
      /** True when a built-in bank holiday list is chosen but payday is past the dates it covers. */
      holidayListEnded: boolean;
    };

export interface BuildOptions {
  /** How many days old a balance can be before the app gently says so. Default 3. */
  staleAfterDays?: number;
}

function blank(text: string): boolean {
  return text.trim() === "";
}

/**
 * The dated copies of one bill or one item of money coming in.
 * One date only: just that date (with the row's own id, as it always was).
 * Repeating: one copy for each time it comes round from the balance date up to payday,
 * each with its own id ("row-id@2026-11-13") so an answer belongs to one date only.
 */
function occurrencesOf(
  rowId: string,
  firstDate: DateString,
  repeat: Repeat,
  from: DateString,
  to: DateString | null,
): Array<{ id: string; date: DateString }> {
  if (repeat === "once") return [{ id: rowId, date: firstDate }];
  if (to === null) return [];
  return occurrencesBetween(firstDate, repeat, from, to).map((date) => ({ id: `${rowId}@${date}`, date }));
}

export function buildInput(form: FormState, today: DateString, options: BuildOptions = {}): BuildResult {
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
  const region = regionOf(form);
  const allHolidays = holidayDays(region, form.bankHolidays);
  const paydayRepeat = repeatOf(form.paydayRepeat);
  const paydayRule: PaydayRule = form.paydayRule === "" ? "on-the-day" : form.paydayRule;
  let plan: PaydayPlan | null = null;
  if (blank(form.paydayDate)) {
    messages.push(words.needPayday);
  } else if (!isRealDay(form.paydayDate)) {
    messages.push(words.cantReadDate("your payday"));
  } else {
    const question = paydayRuleQuestion(form, today);
    if (question !== null && form.paydayRule === "") {
      messages.push(question);
    } else {
      const from = isRealDay(balanceDate) && balanceDate <= today ? balanceDate : today;
      plan = planPayday(form.paydayDate, paydayRepeat, paydayRule, allHolidays, today, from);
    }
  }
  const windowStart = isRealDay(balanceDate) && balanceDate <= today ? balanceDate : today;

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
    for (const item of occurrencesOf(row.id, row.dueDate, repeatOf(row.repeat), windowStart, plan?.resolved ?? null)) {
      const answer = form.answers[item.id];
      bills.push({
        id: item.id,
        name,
        amount: parsed.pence,
        dueDate: item.date,
        ...(answer === undefined ? {} : { alreadyInBalance: answer }),
      });
    }
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
    for (const item of occurrencesOf(row.id, row.date, repeatOf(row.repeat), windowStart, plan?.resolved ?? null)) {
      const answer = form.answers[item.id];
      income.push({
        id: item.id,
        name,
        amount: parsed.pence,
        date: item.date,
        reliability: row.reliability,
        ...(answer === undefined ? {} : { alreadyInBalance: answer }),
      });
    }
  }

  // Food, travel and the rainy-day pot (called "buffer" inside the code)
  const essentials: Essential[] = [];
  if (!blank(form.foodPerWeek)) {
    const parsed = parseMoney(form.foodPerWeek);
    if (!parsed.ok) messages.push(words.cantReadAmount("food and everyday spending"));
    else if (parsed.pence > 0) {
      essentials.push({ id: "food", name: "Food and everyday spending", kind: "per-week", amount: parsed.pence });
    }
  }
  if (!blank(form.travelPerWeek)) {
    const parsed = parseMoney(form.travelPerWeek);
    if (!parsed.ok) messages.push(words.cantReadAmount("travel"));
    else if (parsed.pence > 0) {
      essentials.push({ id: "travel", name: "Travel", kind: "per-week", amount: parsed.pence });
    }
  }
  let buffer = 0;
  if (!blank(form.buffer)) {
    const parsed = parseMoney(form.buffer);
    if (!parsed.ok) messages.push(words.cantReadAmount("your rainy-day pot"));
    else buffer = parsed.pence;
  }

  if (messages.length > 0 || balance === null || plan === null) {
    return { status: "needs-more", messages };
  }

  return {
    status: "ready",
    input: {
      today,
      balance: { amount: balance, asOf: balanceDate },
      payday: { date: plan.nominal, ifNotWorkingDay: paydayRule },
      nonWorkingDays: allHolidays,
      bills,
      income,
      pendingPayments: [],
      essentials,
      buffer,
      savings: [],
      ...(options.staleAfterDays === undefined ? {} : { staleAfterDays: options.staleAfterDays }),
    },
    paidSince: plan.paidSince,
    holidayListEnded: region !== "own" && plan.resolved > BUILT_IN_LAST_DAY,
  };
}

export interface FormSummary {
  account: string;
  payday: string;
  bills: string;
  income: string;
  essentials: string;
  pot: string;
  holidays: string;
}

function plural(count: number, one: string, many: string): string {
  return count === 1 ? `1 ${one}` : `${count} ${many}`;
}

/** A few words about each part of the form, shown in the menu so people know where things are. */
export function describeForm(form: FormState, today?: DateString): FormSummary {
  let account: string = words.notSetYet;
  if (!blank(form.balance)) {
    const parsed = parseMoney(form.balance, { allowNegative: true });
    account = parsed.ok ? formatMoney(parsed.pence) : words.needsALook;
  }

  let payday: string = words.notSetYet;
  if (!blank(form.paydayDate)) {
    if (!isRealDay(form.paydayDate)) {
      payday = words.needsALook;
    } else {
      const repeat = repeatOf(form.paydayRepeat);
      let day = form.paydayDate;
      if (repeat !== "once" && today !== undefined) {
        const rule: PaydayRule = form.paydayRule === "" ? "on-the-day" : form.paydayRule;
        day = planPayday(form.paydayDate, repeat, rule, holidayDays(regionOf(form), form.bankHolidays), today, today).resolved;
      }
      payday = repeat === "once" ? formatDayLong(day) : words.paydaySummary(formatDayLong(day), repeat);
    }
  }

  const billCount = form.bills.filter((row) => !(blank(row.name) && blank(row.amount) && row.dueDate === "")).length;
  const incomeCount = form.income.filter((row) => !(blank(row.name) && blank(row.amount) && row.date === "")).length;

  const setEssentials: string[] = [];
  if (!blank(form.foodPerWeek)) setEssentials.push("food");
  if (!blank(form.travelPerWeek)) setEssentials.push("travel");
  const essentials =
    setEssentials.length === 0
      ? words.notSetYet
      : setEssentials[0]!.charAt(0).toUpperCase() + setEssentials.join(", ").slice(1);

  let pot: string = words.notSetYet;
  if (!blank(form.buffer)) {
    const parsedPot = parseMoney(form.buffer);
    pot = parsedPot.ok ? formatMoney(parsedPot.pence) : words.needsALook;
  }

  const holidayCount = parseDayList(form.bankHolidays).days.length;
  const holidayRegion = regionOf(form);

  return {
    account,
    payday,
    bills: billCount === 0 ? words.noneAdded : plural(billCount, "bill", "bills"),
    income: incomeCount === 0 ? words.noneAdded : plural(incomeCount, "item", "items"),
    essentials,
    pot,
    holidays:
      holidayRegion !== "own"
        ? words.holidaysSummaryRegion(holidayRegion, holidayCount)
        : holidayCount === 0
          ? words.noneAdded
          : plural(holidayCount, "date", "dates"),
  };
}
