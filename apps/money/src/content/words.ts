import { formatDayLong } from "../logic/dates";
import { formatMoney } from "../logic/money";
import type { MoneyProblem } from "../logic/money";
import type { BreakdownLine, CalculatorResult, Warning } from "../logic/types";

/*
 * Every word the calculator screen shows lives here, so the tone
 * (calm, kind, no shame or pressure) can be checked in one place.
 * tests/wording.test.ts scans these for words we never want to use.
 */

export const words = {
  notSetYet: "Not set yet",
  needsALook: "Needs a look",
  noneAdded: "None yet",

  home: {
    appName: "Breathe Money",
    menuButton: "Menu",
    welcomeTitle: "Welcome",
    welcomeMessage: "Let's find out how much is safe to spend until payday.",
    welcomeButton: "Add your numbers",
    privacyLine: "Nothing you type is saved or sent anywhere.",
    openMenu: "Open the menu",
    questionWaiting: "A quick question is waiting",
  },
  menu: {
    title: "Menu",
    done: "Done",
    back: "Back to the menu",
    toGetYourNumber: "To see your number:",
    names: {
      account: "Your account",
      payday: "Payday",
      bills: "Bills",
      income: "Money coming in",
      essentials: "Food, travel and rainy-day pot",
      holidays: "Bank holidays",
    },
    aboutTitle: "About Breathe Money",
    liveLine: (amount: string) => `Safe to spend now: ${amount}`,
    liveWaiting: "Your number will appear once the basics are in.",
  },
  about: {
    promise: "Breathe will never be about making money. It will always be about helping people.",
    privacy:
      "Nothing you type is saved or sent anywhere. There are no accounts, no tracking and no adverts. For now, refreshing the page clears everything. Saving on your own device comes in the next stage.",
    advice: "Breathe Money is an organisation tool, not financial advice.",
  },

  waitingTitle: "Your safe-to-spend number will appear here",
  needBalance: "Add what is in your everyday account right now.",
  needPayday: "Add the date of your next payday.",
  balanceDateFuture: "The date for your balance can't be in the future. Pick today, or an earlier day.",
  askPaydayRule: (phrase: string) =>
    `Your payday falls on ${phrase}. When do you usually get paid then?`,
  cantReadAmount: (what: string) =>
    `I couldn't read the amount for ${what}. Try something like 12.50.`,
  cantReadDate: (what: string) => `I couldn't read ${what}. You can pick it from the calendar.`,
  cantReadDates: (list: string) =>
    `I couldn't read these bank holiday dates: ${list}. Write them like 2026-12-25, separated by spaces or commas.`,
  unfinishedRow: (name: string, needs: string) =>
    `Finish "${name}" by adding ${needs}, or remove it.`,
  cannotCalculate:
    "Something about these numbers doesn't add up yet. Have a look at the dates and amounts.",

  ui: {
    accountTitle: "Your account",
    balanceLabel: "What is in your everyday account now (£)",
    balanceHint: "Use a minus sign if you are overdrawn.",
    balanceDateLabel: "This balance is from",
    balanceDateHint: "Leave this as today if you have just checked it.",

    paydayTitle: "Payday",
    paydayDateLabel: "Your next payday",
    paydayRuleOptions: {
      "": "Choose one",
      "working-day-before": "The working day before",
      "on-the-day": "On the day itself",
      "next-working-day": "The next working day",
    },

    billsTitle: "Bills before payday",
    billsHint:
      "Add anything that will leave your account before payday. Bills after payday can wait.",
    billName: "What is it?",
    billAmount: "Amount (£)",
    billDue: "Due on",
    addBill: "Add a bill",
    remove: "Remove",

    incomeTitle: "Money coming in before payday",
    incomeHint: "Only things that arrive before payday. Your main pay isn't needed here.",
    incomeName: "What is it?",
    incomeAmount: "Amount (£)",
    incomeDate: "Arrives on",
    incomeSure: "I'm sure it is coming",
    incomeMaybe: "It might come",
    addIncome: "Add money coming in",

    essentialsTitle: "Food, travel and a rainy-day pot",
    foodLabel: "Food and everyday spending, per week (£)",
    foodHint: "I will spread it evenly across the days until payday.",
    travelLabel: "Travel, per week (£)",
    travelHint: "A monthly travel pass counts as a bill, so add that under Bills.",
    bufferLabel: "Rainy-day pot to keep aside (£)",
    bufferHint:
      "Money you would rather not touch. It stays the same however many days are left. Leave it empty for none.",

    holidaysSummary: "Bank holidays (optional)",
    holidaysHint:
      "Days when money doesn't move, written like 2026-12-25 and separated by spaces or commas. Weekends are already handled.",

    breakdownTitle: "Where this number comes from",
    questionTitle: "A quick question",
    yes: "Yes",
    no: "No, not yet",
    clearAnswers: "Start my answers again",
    footerNote: "Breathe Money is an organisation tool, not financial advice.",
  },
} as const;

export function moneyProblemMessage(reason: MoneyProblem): string {
  switch (reason) {
    case "not-a-number":
      return "I couldn't read that as an amount. Try something like 12.50.";
    case "too-many-decimals":
      return "Amounts can have up to two decimal places, like 12.50.";
    case "negative-not-allowed":
      return "This one can't be negative. Try a plain amount like 12.50.";
    case "too-large":
      return "That is bigger than I can handle. Could you check it?";
  }
}

export interface Headline {
  title: string;
  /** null when there is no number to show yet. */
  amount: string | null;
  message: string;
}

export function headlineFor(result: CalculatorResult): Headline {
  const safe = result.safeToSpend;
  if (safe === null) {
    return {
      title: "Let's check your payday date",
      amount: null,
      message:
        "The payday you entered looks like it has already gone by. Add your next payday and I'll work it out.",
    };
  }
  if (safe > 0) {
    return {
      title: "Safe to spend until payday",
      amount: formatMoney(safe),
      message: "That is after setting aside everything you have told me about.",
    };
  }
  if (safe === 0) {
    return {
      title: "Safe to spend until payday",
      amount: formatMoney(0),
      message: "There is nothing spare until payday, but everything you listed is covered.",
    };
  }
  return {
    title: "Things are tight until payday",
    amount: `${formatMoney(-safe)} short`,
    message:
      "Here is where it all goes, so you can see the whole picture. This is a snapshot, not a judgement.",
  };
}

export function paydayLine(paydayDate: string, daysUntilPayday: number | null): string {
  const day = formatDayLong(paydayDate);
  if (daysUntilPayday === null) return `Payday: ${day}`;
  if (daysUntilPayday === 0) return `Payday: ${day} (today)`;
  if (daysUntilPayday === 1) return `Payday: ${day} (tomorrow)`;
  return `Payday: ${day} (in ${daysUntilPayday} days)`;
}

/** Plain-words notes under the number. Questions are handled separately. */
export function describeWarning(warning: Warning): string | null {
  switch (warning.kind) {
    case "payday-passed":
      return "Your payday date has passed. Update it when you can.";
    case "balance-out-of-date":
      return `Your balance is from ${warning.daysOld} days ago, so it may have changed. Update it when you can for a more accurate number.`;
    case "uncertain-income-not-counted":
      return `${formatMoney(warning.amount)} might arrive, but it isn't counted in your number.`;
    case "uncertain-income-would-cover-shortfall":
      return "If that maybe-money does arrive, it would cover the gap. It is safer not to count on it.";
    case "needs-answer":
      return null;
  }
}

export function questionFor(warning: Extract<Warning, { kind: "needs-answer" }>): string {
  if (warning.itemType === "income") {
    return `Has "${warning.name}" already arrived in the balance you entered?`;
  }
  return `Has "${warning.name}" already come out of the balance you entered?`;
}

export function describeLine(line: BreakdownLine): { label: string; amountText: string } {
  const name = line.name ?? "";
  switch (line.kind) {
    case "balance":
      return { label: "In your account", amountText: formatMoney(line.amount) };
    case "income":
      return { label: `Money coming in: ${name}`, amountText: signed(line.amount) };
    case "bill":
      return { label: `Bill: ${name}`, amountText: signed(line.amount) };
    case "pending":
      return { label: `Waiting to leave: ${name}`, amountText: signed(line.amount) };
    case "essential":
      return { label: name, amountText: signed(line.amount) };
    case "buffer":
      return { label: "Your rainy-day pot, kept aside", amountText: signed(line.amount) };
    case "savings":
      return { label: `Saving: ${name}`, amountText: signed(line.amount) };
  }
}

function signed(amount: number): string {
  return amount >= 0 ? `+${formatMoney(amount)}` : formatMoney(amount);
}
