import { formatDayLong } from "../logic/dates";
import { formatMoney } from "../logic/money";
import type { MoneyProblem } from "../logic/money";
import type { BreakdownLine, CalculatorResult, Warning } from "../logic/types";

/*
 * Every word the calculator screen shows lives here, so the tone
 * (calm, kind, no shame or pressure) can be checked in one place.
 * tests/wording.test.ts scans these for words we never want to use.
 */

const words_every = {
  weekly: "every week",
  fortnightly: "every 2 weeks",
  "four-weekly": "every 4 weeks",
  monthly: "every month",
} as const;

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
    privacyLine: "Your numbers stay on this device. Nothing is sent anywhere.",
    howKept: "How your numbers are kept",
    updateReady: (version: string) => `Version ${version} of Breathe Money is ready.`,
    updateLink: "Get it",
    loading: "Opening your numbers…",
    potLabel: "Rainy-day pot",
    potKept: "kept aside",
    potLine: (amount: string) => `Rainy-day pot: ${amount} kept aside`,
    notSavedLine:
      "Your numbers couldn't be saved on this device just now, so they'll be gone when you close this page. A backup file can help.",
    notSavedLink: "More about saving",
    readProblemLine:
      "We couldn't read the numbers saved earlier, so we've started fresh. Your next change will replace them.",
    openMenu: "Open the menu",
    questionWaiting: "A quick question is waiting",
    paidSince: (day: string) =>
      `You've had a payday (${day}) since you last updated your balance. Update it when you can, and your number can include your pay.`,
    updateBalance: "Update my balance",
  },
  menu: {
    title: "Menu",
    done: "Done",
    back: "Back to the menu",
    backToMore: "Back to Settings",
    moreTitle: "Settings",
    toGetYourNumber: "To see your number:",
    names: {
      account: "Your account",
      payday: "Payday",
      bills: "Bills",
      income: "Money coming in",
      essentials: "Food and travel",
      pot: "Rainy-day pot",
      holidays: "Bank holidays",
      data: "Your data and backups",
      settings: "App options",
    },
    aboutTitle: "About Breathe Money",
    liveLine: (amount: string) => `Safe to spend now: ${amount}`,
    liveWaiting: "Your number will appear once the basics are in.",
  },
  data: {
    title: "Your data and backups",
    intro:
      "Your numbers are kept on this device, inside your web browser. There is no server and no account, and nothing you type is sent anywhere.",
    limitsTitle: "Good to know",
    limits: [
      "They are not encrypted. Anyone who can open this browser on this device could see them.",
      "Your browser can remove them, for example if you clear your browsing data or the device runs low on space.",
      "If you share this device, think about whether you want your numbers on it.",
    ],
    persistedYes: "Your browser has agreed to keep these numbers unless you clear them yourself.",
    persistedNo: "Your browser hasn't promised to keep these numbers. A backup file is a good idea.",
    persistedUnknown: "We can't tell whether your browser will keep these numbers. A backup file is a good idea.",
    stateSaved: "Your latest changes are saved on this device.",
    stateSaving: "Saving…",
    stateIdle: "Nothing to save yet.",
    stateNotSaved:
      "Your numbers can't be saved on this device right now. You can keep using the app, but they'll be gone when you close this page. A backup file can help.",
    backupTitle: "Save a backup file",
    backupIntro:
      "A backup file is yours to keep wherever you like. Breathe Money never uploads it and has no copy.",
    protectedTitle: "Protected with a passphrase (recommended)",
    protectedIntro: "The file is encrypted. Without your passphrase, nobody can read what's in it.",
    protectedForget: "If you forget this passphrase, nobody, including us, can open this backup.",
    passphraseLabel: "Choose a passphrase",
    passphraseHint: "At least 10 characters. A short sentence you'll remember works well.",
    passphraseAgainLabel: "Type the passphrase again",
    showPassphrase: "Show what I'm typing",
    passphraseProblem: {
      "too-short": "That passphrase is a little short. Try at least 10 characters.",
      different: "The two passphrases aren't the same yet. Have another look at both.",
    },
    protectedButton: "Save a protected backup",
    protectedWorking: "Protecting your backup…",
    protectedDone: "Your browser has been asked to save the protected file. Look in your downloads folder.",
    protectedUnavailable:
      "Protected backups need a secure web address (one starting https://). They aren't available on this copy of the app, but a plain backup still works.",
    plainTitle: "Plain backup (not protected)",
    backupNotice:
      "This file is not encrypted. Anyone who finds it can read your numbers, so keep it somewhere private.",
    backupButton: "Save a plain backup file",
    backupDone: "Your browser has been asked to save the file. Look in your downloads folder.",
    backupDoneApp: "Your backup file is ready. If you chose somewhere to keep it, like Files or Drive, it's there now.",
    unlockTitle: "This backup is protected",
    unlockIntro: "Type the passphrase you chose when you saved it. Nothing changes until you've seen what's inside.",
    unlockLabel: "Passphrase for this backup",
    unlockButton: "Open the backup",
    unlockWorking: "Opening…",
    unlockCancel: "Not now",
    unlockWrong:
      "That passphrase doesn't open this backup. Passphrases are case-sensitive, so check capital letters and spaces, then try again.",
    unlockNoCrypto:
      "This copy of the app can't open protected backups, because it isn't on a secure web address (one starting https://). Try the published app instead.",
    restoreTitle: "Use a backup file",
    restoreIntro: "Choose a backup file you saved earlier. You'll see what's in it before anything changes.",
    restoreChoose: "Choose a backup file",
    restorePreview: (savedOn: string | null) =>
      savedOn === null ? "This backup contains:" : `This backup was saved on ${savedOn} and contains:`,
    restoreReplace: "Replace my numbers",
    restoreKeep: "Keep what I have",
    restoredDone: "Done. Your numbers have been replaced with the ones in the backup.",
    restoreProblem: {
      "too-big": "That file is much bigger than a Breathe Money backup, so it was left alone.",
      "not-json": "That doesn't look like a Breathe Money backup file, so it was left alone.",
      "not-ours": "That file isn't a Breathe Money backup, so it was left alone.",
      newer: "That backup was made by a newer version of Breathe Money. Update the app, then try again.",
      unreadable: "Something in that backup doesn't look right, so it was left alone. Nothing has changed.",
    },
    clearTitle: "Clear my numbers",
    clearIntro: "This removes your numbers from this device. Backup files you've saved aren't affected.",
    clearButton: "Clear my numbers",
    clearSure: "Remove everything from this device?",
    clearYes: "Yes, clear them",
    clearNo: "No, keep them",
    clearedDone: "Your numbers have been cleared from this device.",
    clearedPartly:
      "Your numbers are cleared from the screen, but we couldn't confirm the saved copy on this device was removed.",
  },
  about: {
    promise: "Breathe will never be about making money. It will always be about helping people.",
    privacy:
      "There are no accounts, no tracking and no adverts. Your numbers are kept on your own device, inside your browser, and are never sent anywhere. They are not encrypted, so see Your data and backups for what that means.",
    advice: "Breathe Money is an organisation tool, not financial advice.",
  },

  rows: {
    unnamedBill: "Unnamed bill",
    unnamedIncome: "Unnamed item",
    noAmount: "no amount yet",
    noDate: "no date yet",
    every: words_every,
    mightCome: "might come",
    done: "Done",
    remove: "Remove",
    billsNone: "No bills added yet.",
    incomeNone: "Nothing added yet.",
    totalBills: (count: number, total: string) =>
      `${count === 1 ? "1 bill" : `${count} bills`} \u00b7 ${total} in total`,
    totalIncome: (count: number, total: string) =>
      `${count === 1 ? "1 item" : `${count} items`} \u00b7 ${total} in total`,
    someUnreadable: "Some amounts still need a look, so they aren't in the total.",
    tapToEdit: "Tap one to change it.",
  },
  settings: {
    title: "Settings",
    appearanceTitle: "Light or dark",
    appearanceIntro: "Choose how Breathe Money looks. Your choices here are saved on this device only, and clearing your numbers doesn't change them.",
    options: {
      system: "Match my device",
      light: "Light",
      dark: "Dark",
    },
    systemHint: "Follows your phone or computer's own setting.",
    accentTitle: "App colour",
    accentIntro: "The colour of buttons and your main number.",
    accents: {
      teal: "Teal",
      blue: "Blue",
      plum: "Plum",
      rose: "Rose",
      green: "Green",
    },
    potTitle: "Rainy-day pot colour",
    potIntro: "The colour of your pot. Pick one that makes you smile.",
    potColours: {
      gold: "Gold",
      rose: "Rose",
      green: "Green",
      blue: "Blue",
      lilac: "Lilac",
    },
    reminderTitle: "Balance reminder",
    reminderIntro:
      "How often should I gently remind you to update your balance? It is only a note under your number, and you can switch it off.",
    reminderOptions: {
      daily: "Every day",
      "three-days": "Every 3 days",
      weekly: "Once a week",
      never: "Don't remind me",
    },
    reminderDefaultHint: "This is the usual choice.",
    homeTitle: "Home screen",
    homeIntro:
      "Once you know your way around, you can hide the extra writing under your number. Anything important still shows, like when things are tight or your balance needs updating.",
    showExplanation: "Show the short sentence under my number",
    showPayday: "Show the payday date",
    potPreview: "Preview",
    potPreviewAmount: "£100.00",
    textSizeTitle: "Text size",
    textSizeIntro: "Makes all the writing in Breathe Money bigger. Your phone or browser's own text size works too, and adds to this.",
    textSizes: {
      standard: "Standard",
      large: "Larger",
      largest: "Largest",
    },
    contrastTitle: "Contrast",
    contrastIntro: "Higher contrast uses darker writing and stronger outlines, so everything stands out more.",
    contrasts: {
      system: "Match my device",
      more: "Higher contrast",
    },
    contrastSystemHint: "Uses higher contrast if your phone or computer asks for it.",
    lockTitle: "Privacy screen",
    lockIntro:
      "Ask for a PIN when Breathe Money opens, and when you come back to it after a minute away. This stops someone glancing at your numbers.",
    lockHonest:
      "It's a privacy screen, not encryption. Your numbers on this device are still not encrypted, so someone determined, with your device, could still find them.",
    lockOff: "The privacy screen is off.",
    lockOn: "The privacy screen is on.",
    pinLabel: "Choose a PIN",
    pinHint: "4 to 12 numbers. Pick one that isn't your bank card PIN.",
    pinAgainLabel: "Type the PIN again",
    pinProblem: {
      "too-short": "Use at least 4 numbers.",
      "too-long": "Use 12 numbers or fewer.",
      "numbers-only": "Use numbers only.",
      different: "The two PINs aren't the same yet. Have another look at both.",
    },
    lockTurnOn: "Turn on the privacy screen",
    lockTurnedOn: "Done. Breathe Money will ask for your PIN next time it opens.",
    lockCouldNotSave: "The PIN couldn't be kept on this device just now, so the privacy screen is still off.",
    lockNow: "Lock now",
    lockTurnOff: "Turn off the privacy screen",
    lockTurnedOff: "The privacy screen is off.",
    updatesTitle: "Updates",
    updatesIntro:
      "This app doesn't update itself. It can check whether a newer version of Breathe Money is out, so you know when to get it.",
    updatesHonest:
      "Checking asks GitHub one question: what's the newest version? Your numbers are never sent. GitHub can see that a phone asked, as with visiting any website.",
    updatesToggle: "Check once a day when I open the app",
    updatesCheckNow: "Check now",
    updatesChecking: "Checking…",
    updatesUpToDate: (version: string) => `You have the newest version (${version}).`,
    updatesNewer: (version: string) => `Version ${version} is ready.`,
    updatesGet: "Get the new version",
    updatesUnknown: "Couldn't check just now. You may be offline. Nothing has changed.",
    updatesHowTo: "Download the file, then install it over this one. Your numbers stay.",
  },
  lock: {
    title: "Welcome back",
    intro: "Type your PIN to open Breathe Money.",
    pinLabel: "Your PIN",
    open: "Open",
    checking: "Checking…",
    wrong: "That PIN doesn't match. Have another go.",
    pause: (seconds: number) =>
      `Let's pause for a moment. You can try again in ${seconds === 1 ? "1 second" : `${seconds} seconds`}.`,
    opening: "Opening Breathe Money…",
    forgotButton: "Forgotten your PIN?",
    forgotTitle: "Forgotten your PIN?",
    forgotIntro:
      "That's all right. The privacy screen can be removed, but to keep your numbers private, removing it also clears your numbers from this device.",
    forgotBackup: "If you saved a backup file, you can use it afterwards to get your numbers back.",
    forgotYes: "Remove the lock and clear my numbers",
    forgotNo: "Go back",
    forgotProblem: "That didn't work just now. Please try again.",
  },
  setup: {
    title: "Setting up",
    progress: (step: number, total: number) => `Question ${step} of ${total}`,
    next: "Next",
    back: "Back",
    skip: "Skip this one",
    nothingToAdd: "Nothing to add",
    menuItem: "Step-by-step setup",
    balance: {
      question: "What's in your everyday account right now?",
      intro: "Check your banking app and type what you see. You can change it any time.",
      label: "Everyday account balance (£)",
    },
    payday: {
      question: "When is your next payday?",
      intro: "Pick the date from the calendar.",
    },
    bills: {
      question: "Any bills before then?",
      intro: "Add anything that will leave your account before payday. If there's nothing, just carry on.",
    },
    income: {
      question: "Any other money coming in before payday?",
      intro: "Like a refund, or money you're owed. Your main pay isn't needed here.",
    },
    food: {
      question: "What do you usually spend on food and travel each week?",
      intro: "A rough amount is fine.",
    },
    pot: {
      question: "Would you like a rainy-day pot?",
      intro: "Money kept aside for the unexpected.",
    },
    doneTitle: "All set",
    doneReady: "That's everything. Your number is waiting on the main screen.",
    doneNeeds: "Nearly there. To see your number:",
    changeLater: "You can change anything later from the Menu.",
    seeNumber: "See my number",
    finishLater: "Finish later",
  },

  waitingTitle: "Your safe-to-spend number will appear here",
  needBalance: "Add what is in your everyday account right now.",
  needPayday: "Add the date of your next payday.",
  balanceDateFuture: "The date for your balance can't be in the future. Pick today, or an earlier day.",
  askPaydayRule: (phrase: string) =>
    `Your payday falls on ${phrase}. When do you usually get paid then?`,
  holidaysSummaryRegion: (
    region: "england-and-wales" | "scotland" | "northern-ireland",
    extra: number,
  ) => {
    const name = { "england-and-wales": "England and Wales", scotland: "Scotland", "northern-ireland": "Northern Ireland" }[region];
    return extra === 0 ? name : `${name} + ${extra === 1 ? "1 extra" : `${extra} extra`}`;
  },
  holidayListEnded: (until: string) =>
    `The built-in bank holidays only go up to ${until}. You can add later ones yourself in the Menu, under Bank holidays.`,
  askPaydayRuleMonthly:
    "Sometimes your payday will fall on a weekend or bank holiday. When do you usually get paid then?",
  paydaySummary: (day: string, repeat: "weekly" | "fortnightly" | "four-weekly" | "monthly") =>
    `${day} \u00b7 ${words_every[repeat]}`,
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
    paydayRepeatLabel: "How often are you paid?",
    paydayRepeatHint:
      "If you're paid on a regular pattern, I'll move on to your next payday by myself once this one has gone by.",
    paydayRepeatOptions: {
      once: "Just this one date",
      weekly: "Every week",
      fortnightly: "Every 2 weeks",
      "four-weekly": "Every 4 weeks",
      monthly: "Every month",
    },
    repeatLabel: "How often?",
    repeatOptions: {
      once: "Just once",
      weekly: "Every week",
      fortnightly: "Every 2 weeks",
      "four-weekly": "Every 4 weeks",
      monthly: "Every month",
    },
    repeatBillHint: "Only the ones that come round before payday are counted.",
    repeatIncomeHint: "Only the ones that arrive before payday are counted.",
    billDueRepeating: "Next due on",
    incomeDateRepeating: "Next arrives on",
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

    essentialsTitle: "Food and travel",
    potTitle: "Rainy-day pot",
    foodLabel: "Food and everyday spending, per week (£)",
    foodHint: "I will spread it evenly across the days until payday.",
    travelLabel: "Travel, per week (£)",
    travelHint: "A monthly travel pass counts as a bill, so add that under Bills.",
    bufferLabel: "Rainy-day pot to keep aside (£)",
    bufferHint:
      "Money you would rather not touch. It stays the same however many days are left. Leave it empty for none.",

    holidaysSummary: "Bank holidays",
    holidaysRegionLabel: "Where do you live?",
    holidaysRegionHint:
      "I'll use the official bank holidays for that part of the UK, so you don't have to type them. Weekends are already handled.",
    holidaysRegionOptions: {
      own: "I'll type my own",
      "england-and-wales": "England and Wales",
      scotland: "Scotland",
      "northern-ireland": "Northern Ireland",
    },
    holidaysCovers: (until: string) => `The built-in list goes up to ${until}. The dates come from GOV.UK.`,
    holidaysHint:
      "Extra days when money doesn't move (optional), written like 2026-12-25 and separated by spaces or commas. These are added to the list above.",
    holidaysHintOwn:
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
      return `Your balance is from ${warning.daysOld === 1 ? "yesterday" : `${warning.daysOld} days ago`}, so it may have changed. Update it when you can for a more accurate number.`;
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
      return {
        label: line.spread
          ? `${name} (${line.spread.days === 1 ? "1 day" : `${line.spread.days} days`} of ${formatMoney(line.spread.perWeek)} a week)`
          : name,
        amountText: signed(line.amount),
      };
    case "buffer":
      return { label: "Your rainy-day pot, kept aside", amountText: signed(line.amount) };
    case "savings":
      return { label: `Saving: ${name}`, amountText: signed(line.amount) };
  }
}

function signed(amount: number): string {
  return amount >= 0 ? `+${formatMoney(amount)}` : formatMoney(amount);
}
