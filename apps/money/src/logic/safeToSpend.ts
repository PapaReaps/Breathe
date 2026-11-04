import {
  daysBetween,
  onOrAfterWorkingDay,
  onOrBeforeWorkingDay,
  toDayNumber,
} from "./dates";
import { InvalidInputError } from "./errors";
import { PAYDAY_RULES } from "./types";
import type {
  Bill,
  BreakdownLine,
  CalculatorInput,
  CalculatorResult,
  DateString,
  ItemType,
  Payday,
  Pence,
  UncertainIncomeItem,
  Warning,
} from "./types";

/*
 * The safe-to-spend calculation.
 *
 * The big rule: every pound is counted in exactly one place.
 * Anything the balance already shows is never counted again.
 * See docs/CALCULATION-DESIGN.md for the full list of rules.
 *
 * This file only works things out. It never changes the information
 * it is given, never saves anything and never shows anything.
 */

const DEFAULT_STALE_AFTER_DAYS = 3;

type Direction = "money-out" | "money-in";
type Decision = "count" | "ignore" | "ask";

interface Period {
  /** The day the balance was entered. */
  asOf: DateString;
  /** Payday after the weekend / bank holiday rule. */
  payday: DateString;
}

// ---------------------------------------------------------------- checks

function checkPence(value: number, what: string, allowNegative = false): void {
  if (!Number.isSafeInteger(value)) {
    throw new InvalidInputError(`${what} must be a whole number of pence.`);
  }
  if (!allowNegative && value < 0) {
    throw new InvalidInputError(`${what} cannot be negative.`);
  }
}

function validate(input: CalculatorInput): void {
  checkPence(input.balance.amount, "The balance", true);
  checkPence(input.buffer, "The buffer");

  toDayNumber(input.today);
  toDayNumber(input.balance.asOf);
  toDayNumber(input.payday.date);
  for (const day of input.nonWorkingDays) toDayNumber(day);

  if (daysBetween(input.balance.asOf, input.today) < 0) {
    throw new InvalidInputError("The balance date cannot be in the future.");
  }
  if (!PAYDAY_RULES.includes(input.payday.ifNotWorkingDay)) {
    throw new InvalidInputError("Unknown weekend payday rule.");
  }
  if (input.staleAfterDays !== undefined) {
    if (!Number.isSafeInteger(input.staleAfterDays) || input.staleAfterDays < 0) {
      throw new InvalidInputError("staleAfterDays must be a whole number, zero or more.");
    }
  }

  for (const bill of input.bills) {
    checkPence(bill.amount, `The bill "${bill.name}"`);
    toDayNumber(bill.dueDate);
  }
  for (const item of input.income) {
    checkPence(item.amount, `The income "${item.name}"`);
    toDayNumber(item.date);
  }
  for (const pending of input.pendingPayments) {
    checkPence(pending.amount, `The pending payment "${pending.name}"`);
  }
  for (const essential of input.essentials) {
    checkPence(essential.amount, `The essential "${essential.name}"`);
  }
  for (const transfer of input.savings) {
    checkPence(transfer.amount, `The savings transfer "${transfer.name}"`);
    toDayNumber(transfer.date);
  }
}

// ---------------------------------------------------------------- payday

/** The day payday really lands, after the weekend / bank holiday answer is applied. */
export function resolvePayday(payday: Payday, nonWorking: ReadonlySet<DateString>): DateString {
  switch (payday.ifNotWorkingDay) {
    case "on-the-day":
      return payday.date;
    case "working-day-before":
      return onOrBeforeWorkingDay(payday.date, nonWorking);
    case "next-working-day":
      return onOrAfterWorkingDay(payday.date, nonWorking);
  }
}

// ---------------------------------------------------------------- one home for every pound

/**
 * Should this item be counted?
 *
 *  - Money going out counts up to AND including payday (the cautious choice).
 *  - Money coming in counts only BEFORE payday (payday's own money belongs to the next period).
 *  - Dated before the balance was entered: the balance already shows it, so ignore it.
 *  - Dated on the day the balance was entered: we cannot tell, so ask.
 *  - Dated after: count it.
 *  - The person's own answer ("alreadyInBalance") always wins over the date.
 *
 * Some items have two possible dates (a weekend bill taken on the next
 * working day). If either date lands in the window, the item is counted.
 */
function decide(
  dates: readonly DateString[],
  direction: Direction,
  alreadyInBalance: boolean | undefined,
  period: Period,
): Decision {
  if (alreadyInBalance === true) return "ignore";

  const withinEnd = (date: DateString): boolean =>
    direction === "money-out" ? date <= period.payday : date < period.payday;
  const candidates = dates.filter(withinEnd);
  if (candidates.length === 0) return "ignore";

  if (alreadyInBalance === false) return "count";
  if (candidates.some((date) => date > period.asOf)) return "count";
  if (candidates.some((date) => date === period.asOf)) return "ask";
  return "ignore";
}

function billDates(bill: Bill, nonWorking: ReadonlySet<DateString>): DateString[] {
  if (bill.takenOn === "next-working-day") {
    return [bill.dueDate, onOrAfterWorkingDay(bill.dueDate, nonWorking)];
  }
  return [bill.dueDate];
}

/**
 * Spreads a weekly amount evenly over a number of days, rounding UP to the next
 * penny. Rounding up is the cautious way: it can only ever make the safe-to-spend
 * figure a fraction of a penny smaller, never larger.
 */
function spreadOverDays(perWeek: Pence, days: number, what: string): Pence {
  const product = perWeek * days;
  if (!Number.isSafeInteger(product)) {
    throw new InvalidInputError(`${what} adds up to too large a number.`);
  }
  const whole = Math.floor(product / 7);
  return product % 7 === 0 ? whole : whole + 1;
}

function needsAnswer(itemType: ItemType, item: { id: string; name: string }): Warning {
  return { kind: "needs-answer", itemType, id: item.id, name: item.name };
}

// ---------------------------------------------------------------- the calculation

export function calculateSafeToSpend(input: CalculatorInput): CalculatorResult {
  validate(input);

  const nonWorking = new Set(input.nonWorkingDays);
  const paydayDate = resolvePayday(input.payday, nonWorking);
  const asOf = input.balance.asOf;
  const period: Period = { asOf, payday: paydayDate };
  const warnings: Warning[] = [];

  const daysOld = daysBetween(asOf, input.today);
  if (daysOld > (input.staleAfterDays ?? DEFAULT_STALE_AFTER_DAYS)) {
    warnings.push({ kind: "balance-out-of-date", daysOld });
  }

  // Payday has already gone by: do not guess. Ask for an updated payday.
  if (paydayDate < input.today) {
    warnings.push({ kind: "payday-passed" });
    return {
      safeToSpend: null,
      paydayDate,
      daysUntilPayday: null,
      daysCovered: null,
      lines: [],
      uncertainIncome: { items: [], total: 0 },
      warnings,
    };
  }

  const lines: BreakdownLine[] = [{ kind: "balance", amount: input.balance.amount }];

  // Pending payments. One that is linked to a bill stands in for that bill,
  // so the same payment is never counted twice.
  const billIds = new Set(input.bills.map((bill) => bill.id));
  const billsCoveredByPending = new Set<string>();
  for (const pending of input.pendingPayments) {
    if (pending.linkedBillId !== undefined && billIds.has(pending.linkedBillId)) {
      billsCoveredByPending.add(pending.linkedBillId);
    }
  }
  for (const pending of input.pendingPayments) {
    if (pending.alreadyInBalance) continue;
    lines.push({ kind: "pending", id: pending.id, name: pending.name, amount: -pending.amount });
  }

  // Bills.
  for (const bill of input.bills) {
    if (billsCoveredByPending.has(bill.id)) continue;
    const decision = decide(billDates(bill, nonWorking), "money-out", bill.alreadyInBalance, period);
    if (decision === "ignore") continue;
    if (decision === "ask") warnings.push(needsAnswer("bill", bill));
    lines.push({ kind: "bill", id: bill.id, name: bill.name, amount: -bill.amount });
  }

  // Income. Uncertain income is never added, only listed.
  const uncertainItems: UncertainIncomeItem[] = [];
  for (const item of input.income) {
    const decision = decide([item.date], "money-in", item.alreadyInBalance, period);
    if (item.reliability === "uncertain") {
      if (decision !== "ignore") {
        uncertainItems.push({ id: item.id, name: item.name, amount: item.amount });
      }
      continue;
    }
    if (decision === "ignore") continue;
    if (decision === "ask") {
      // Cautious: do not add money we are not sure has not already arrived.
      warnings.push(needsAnswer("income", item));
      continue;
    }
    lines.push({ kind: "income", id: item.id, name: item.name, amount: item.amount });
  }

  // Planned essentials: daily amounts for each day from the balance date up to
  // (not including) payday, plus any lump sums.
  const daysCovered = daysBetween(asOf, paydayDate);
  for (const essential of input.essentials) {
    const what = `The essential "${essential.name}"`;
    let total: Pence;
    if (essential.kind === "per-day") total = essential.amount * daysCovered;
    else if (essential.kind === "per-week") total = spreadOverDays(essential.amount, daysCovered, what);
    else total = essential.amount;
    if (!Number.isSafeInteger(total)) {
      throw new InvalidInputError(`${what} adds up to too large a number.`);
    }
    if (total > 0) {
      lines.push(
        essential.kind === "per-week"
          ? {
              kind: "essential",
              id: essential.id,
              name: essential.name,
              amount: -total,
              spread: { perWeek: essential.amount, days: daysCovered },
            }
          : { kind: "essential", id: essential.id, name: essential.name, amount: -total },
      );
    }
  }

  // The rainy-day pot (the "buffer" here) is a one-off amount, always kept back.
  if (input.buffer > 0) {
    lines.push({ kind: "buffer", amount: -input.buffer });
  }

  // Savings: only transfers the person has definitely committed to.
  for (const transfer of input.savings) {
    if (!transfer.committed) continue;
    const decision = decide([transfer.date], "money-out", transfer.alreadyInBalance, period);
    if (decision === "ignore") continue;
    if (decision === "ask") warnings.push(needsAnswer("savings", transfer));
    lines.push({ kind: "savings", id: transfer.id, name: transfer.name, amount: -transfer.amount });
  }

  let safeToSpend: Pence = 0;
  for (const line of lines) {
    safeToSpend += line.amount;
    if (!Number.isSafeInteger(safeToSpend)) {
      throw new InvalidInputError("The amounts add up to too large a number.");
    }
  }

  const uncertainTotal = uncertainItems.reduce((sum, item) => sum + item.amount, 0);
  if (uncertainTotal > 0) {
    warnings.push({ kind: "uncertain-income-not-counted", amount: uncertainTotal });
    if (safeToSpend < 0 && safeToSpend + uncertainTotal >= 0) {
      warnings.push({ kind: "uncertain-income-would-cover-shortfall" });
    }
  }

  return {
    safeToSpend,
    paydayDate,
    daysUntilPayday: daysBetween(input.today, paydayDate),
    daysCovered,
    lines,
    uncertainIncome: { items: uncertainItems, total: uncertainTotal },
    warnings,
  };
}
