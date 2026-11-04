/**
 * The shapes of information the safe-to-spend calculator works with.
 * See docs/CALCULATION-DESIGN.md for the rules these follow.
 */

/** Money as a whole number of pence. £12.50 is 1250. */
export type Pence = number;

/** A calendar day written as "YYYY-MM-DD". No times and no time zones, on purpose. */
export type DateString = string;

/** The balance the person typed in, and the day they typed it. */
export interface BalanceSnapshot {
  amount: Pence; // may be negative (overdrawn)
  asOf: DateString;
}

/** What usually happens when payday falls on a weekend or bank holiday. */
export const PAYDAY_RULES = [
  "working-day-before",
  "on-the-day",
  "next-working-day",
] as const;
export type PaydayRule = (typeof PAYDAY_RULES)[number];

export interface Payday {
  date: DateString;
  ifNotWorkingDay: PaydayRule;
}

/**
 * `alreadyInBalance` is the person's own answer to
 * "Does the balance I entered already show this?"
 * Leave it out when they have not been asked, and the date decides.
 */
export interface Bill {
  id: string;
  name: string;
  amount: Pence;
  dueDate: DateString;
  /** Some bills due on a weekend are really taken on the next working day. */
  takenOn?: "on-due-date" | "next-working-day";
  alreadyInBalance?: boolean;
}

export interface Income {
  id: string;
  name: string;
  amount: Pence;
  date: DateString;
  /** "uncertain" income is never added. It is only shown as "might arrive". */
  reliability: "reliable" | "uncertain";
  alreadyInBalance?: boolean;
}

/** A payment that has started but may not be off the balance yet. */
export interface PendingPayment {
  id: string;
  name: string;
  amount: Pence;
  alreadyInBalance: boolean;
  /** If this is one of the bills, link it so it is only counted once. */
  linkedBillId?: string;
}

export interface Essential {
  id: string;
  name: string;
  kind: "per-day" | "lump-sum";
  amount: Pence;
}

export interface SavingsTransfer {
  id: string;
  name: string;
  amount: Pence;
  date: DateString;
  /** Only transfers the person has definitely committed to are ever subtracted. */
  committed: boolean;
  alreadyInBalance?: boolean;
}

export interface CalculatorInput {
  today: DateString;
  balance: BalanceSnapshot;
  payday: Payday;
  /** Bank holidays and any other days money does not move. Weekends are built in. */
  nonWorkingDays: readonly DateString[];
  bills: readonly Bill[];
  income: readonly Income[];
  pendingPayments: readonly PendingPayment[];
  essentials: readonly Essential[];
  buffer: Pence;
  savings: readonly SavingsTransfer[];
  /** A balance older than this many days gets a gentle "might be out of date" note. Default 3. */
  staleAfterDays?: number;
}

/** One line of "where this number came from". Positive adds, negative subtracts. */
export interface BreakdownLine {
  kind: "balance" | "income" | "bill" | "pending" | "essential" | "buffer" | "savings";
  id?: string;
  name?: string;
  amount: Pence;
}

export type ItemType = "bill" | "income" | "savings";

export type Warning =
  | { kind: "payday-passed" }
  | { kind: "balance-out-of-date"; daysOld: number }
  | { kind: "needs-answer"; itemType: ItemType; id: string; name: string }
  | { kind: "uncertain-income-not-counted"; amount: Pence }
  | { kind: "uncertain-income-would-cover-shortfall" };

export interface UncertainIncomeItem {
  id: string;
  name: string;
  amount: Pence;
}

export interface CalculatorResult {
  /** null means "cannot work this out yet" (for example, payday has already passed). */
  safeToSpend: Pence | null;
  /** Payday after the weekend / bank holiday rule is applied. */
  paydayDate: DateString;
  daysUntilPayday: number | null;
  /** Days of planned food, travel and so on that were included (from the balance date to payday). */
  daysCovered: number | null;
  /** Every number used. Adding up the amounts gives safeToSpend. */
  lines: BreakdownLine[];
  uncertainIncome: { items: UncertainIncomeItem[]; total: Pence };
  warnings: Warning[];
}
