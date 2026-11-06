import { formatDayShort } from "../logic/dates";
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
    welcomeMessage: "Let's find out how much is safe to spend until your money comes in. No rush, and you can skip anything.",
    breathLine: "Take a breath. You've got this.",
    welcomeButton: "Add your numbers",
    privacyLine: "Your numbers stay on this device. Nothing is sent anywhere.",
    howKept: "How your numbers are kept",
    updateReady: (version: string) => `Version ${version} of Breathe Money is ready.`,
    updateLink: "Get it",
    loading: "Opening your numbers…",
    potLabel: "Savings",
    potKept: "kept aside",
    potLine: (amount: string) => `Savings: ${amount} kept aside`,
    notSavedLine:
      "Your numbers couldn't be saved on this device just now, so they'll be gone when you close this page. A backup file can help.",
    notSavedLink: "More about saving",
    readProblemLine:
      "We couldn't read the numbers saved earlier, so we've started fresh. Your next change will replace them.",
    openMenu: "Open the menu",
    questionWaiting: "A quick question is waiting",
    paidSince: (day: string) =>
      `Money has come in (${day}) since you last updated your balance. Update it when you can, and your number can include it.`,
    updateBalance: "Update my balance",
  },
  menu: {
    title: "Menu",
    done: "Done",
    back: "Back to the menu",
    backToMore: "Back to Settings",
    backToOptions: "Back to App options",
    backToHelp: "Back to Help and sharing",
    helpTitle: "Help and sharing",
    optionsIntro: "Tap one to change it. Your choice shows on the right.",
    optionGroups: {
      look: "Look and colours",
      text: "Text and contrast",
      home: "Home screen",
      reminder: "Balance reminder",
      sounds: "Sounds and vibration",
      privacy: "Privacy screen",
      updates: "Updates",
    },
    homeAll: "Everything shown",
    homeNone: "Just the number",
    homeSome: "Some hidden",
    on: "On",
    off: "Off",
    moreTitle: "Settings",
    toGetYourNumber: "To see your number:",
    names: {
      account: "Your account",
      payday: "Next money in",
      bills: "Bills",
      income: "Money coming in",
      essentials: "Food and travel",
      pot: "Savings",
      holidays: "Bank holidays",
      data: "Your data and backups",
      settings: "App options",
    },
    aboutTitle: "About Breathe Money",
    shareTitle: "Share Breathe Money",
    reportTitle: "Report a problem",
    tipTitle: "Leave a tip",
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
    stateKept: "Your numbers are saved on this device.",
    keepCopy: "A backup file keeps a copy somewhere safe, in case your phone or browser clears them.",
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
  comingUp: {
    title: "Coming up",
    menuSub: "Bills and money days",
    intro: "From today until your money comes in.",
    viewLabel: "Show as",
    views: { list: "List", month: "Month" },
    today: "Today",
    tomorrow: "tomorrow",
    inDays: (days: number) => `in ${days} days`,
    moneyDay: "Your money comes in",
    moneyDayNamed: (name: string) => (name === "" ? "Your money comes in" : `${name} comes in`),
    bill: "Bill",
    moneyIn: "Money coming in",
    billTotal: (count: number, total: string) => `${count === 1 ? "1 bill" : `${count} bills`} before then · ${total}`,
    noBills: "No bills before then.",
    nothing: "Nothing on this day.",
    waiting: "Once your balance and the date your money comes in are added, you'll see your bills and money days here.",
  },
  tip: {
    intro: "Breathe Money is free, always. If it's helped and you'd like to say thanks, you can leave a tip.",
    gentle: "Only if you can spare it. Tips don't unlock anything.",
    buttonLabel: (amount: string) => `Leave a ${amount} tip`,
    opens: "Tapping one opens Stripe's secure payment page. You can pay by card, Google Pay or Apple Pay.",
    privacy: "Breathe never sees your card details, and nothing about your numbers is sent.",
    thanks: "Thank you. Stripe's page is open now. When you're finished, close it to come back here.",
  },
  share: {
    intro: "Know someone who might like Breathe Money? Show them this code, or send them the link. It's free.",
    switchLabel: "Which phone does your friend have?",
    kinds: { android: "Android", web: "iPhone or computer" },
    titles: { android: "Breathe Money for Android", web: "Breathe Money in the browser" },
    hints: {
      android:
        "Your friend points their phone camera at the code, and the download starts straight away. Android asks them once to allow the install. That's normal.",
      web: "For iPhones and computers. Your friend points their camera at the code, and it opens straight away, with nothing to install.",
    },
    qrLabel: (title: string) => `QR code for ${title}. The same link is written below.`,
    copy: "Copy link",
    share: "Share",
    copied: "Link copied. You can paste it into a message.",
    notCopied: "That link couldn't be copied here. You can press and hold it to copy it instead.",
  },
  report: {
    intro: "Something not working as you expected, or an idea to make Breathe Money better? We'd love to hear it.",
    how: "This opens a page on GitHub, where Breathe Money is made. You'll need a free GitHub account to send it.",
    privacy:
      "Nothing is sent from the app itself. Please don't include your real numbers: a rough description is plenty.",
    button: "Open the report page",
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
      ocean: "Ocean",
      terracotta: "Terracotta",
      slate: "Slate",
      amber: "Amber",
    },
    potTitle: "Savings colour",
    potIntro: "The colour of your savings. Pick one that makes you smile.",
    potColours: {
      gold: "Gold",
      rose: "Rose",
      green: "Green",
      blue: "Blue",
      lilac: "Lilac",
      peach: "Peach",
      mint: "Mint",
      sand: "Sand",
      silver: "Silver",
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
    showPayday: "Show the date your money comes in",
    showSavings: "Show my savings under the number",
    showSavingsHint: "Your savings are still kept aside. This only hides the reminder.",
    showMoneyName: "Show what your money is called",
    showMoneyNameHint: "Like \"Universal Credit comes in…\". Off, so anyone glancing at your screen can't see it.",
    breathMotion: "Let \"breathe\" breathe",
    breathMotionHint: "The word above your number breathes slowly. Switch off to keep it still.",
    soundTitle: "Sound when I tap",
    soundIntro: "A soft sound when you tap a button. You'll hear each one as you choose it. It plays at your phone's media volume.",
    sounds: {
      off: "Off",
      tap: "Soft tap",
      click: "Classic click",
      wood: "Wooden block",
      pebble: "Pebble",
      bubble: "Bubble",
      drop: "Water drop",
      pop: "Soft pop",
      marimba: "Marimba",
      chime: "Gentle chime",
      breath: "Little breath",
      tick: "Clock tick",
      heartbeat: "Heartbeat",
    },
    vibrateTitle: "Vibrate when I tap",
    vibrateIntro: "A small buzz when you tap a button. You'll feel each one as you choose it.",
    vibrations: {
      off: "Off",
      gentle: "Gentle",
      medium: "Medium",
      firm: "Firm",
    },
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
      "This app can check whether a newer version of Breathe Money is out, then download and install it for you when you say so.",
    updatesHonest:
      "Checking asks GitHub one question: what's the newest version? Downloading fetches the new app from GitHub too. Your numbers are never sent. GitHub can see that a phone asked, as with visiting any website.",
    updatesToggle: "Check once a day when I open the app",
    updatesCheckNow: "Check now",
    updatesYouHave: (version: string) => `You have version ${version}.`,
    updatesChecking: "Checking…",
    updatesUpToDate: (version: string) => `You have the newest version (${version}).`,
    updatesNewer: (version: string) => `Version ${version} is ready.`,
    updatesUnknown: "Couldn't check just now. You may be offline. Nothing has changed.",
    updatesHowTo: "It installs over this one, and your numbers stay.",
    updatesInstall: "Download and install",
    updatesDownloading: (percent: number | null) => (percent === null ? "Downloading…" : `Downloading… ${percent}%`),
    updatesInstalling: "Android will now ask if you want to update. Tap Update.",
    updatesPermission:
      "Android needs your OK first. On the next screen, switch on \"Allow from this source\", then come back here and tap Install now. You only need to do this once.",
    updatesOpenPermission: "Open the setting",
    updatesInstallNow: "Install now",
    updatesNotDownloaded: "The new version couldn't be downloaded just now. You may be offline. You can try again, or get it from GitHub instead.",
    updatesOrGithub: "Or get it from GitHub",
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
    mainMoney: "Your main money",
    menuItem: "Step-by-step setup",
    balance: {
      question: "What's in your everyday account right now?",
      intro: "Check your banking app and type what you see. You can change it any time.",
      label: "Everyday account balance (£)",
    },
    payday: {
      question: "When does your main money next come in?",
      intro: "What it is, when it next comes in, and how often.",
    },
    bills: {
      question: "Any bills before then?",
      intro: "Add anything that will leave your account before your money comes in. If there's nothing, just carry on.",
    },
    income: {
      question: "Any other money coming in before then?",
      intro: "Like a refund, or money you're owed. If there's nothing, just carry on.",
    },
    food: {
      question: "What do you usually spend on food and travel each week?",
      intro: "A rough amount is fine.",
    },
    pot: {
      question: "Would you like to keep some savings aside?",
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
  needPayday: "Add the date your money next comes in.",
  balanceDateFuture: "The date for your balance can't be in the future. Pick today, or an earlier day.",
  askPaydayRule: (phrase: string) =>
    `Your money is due on ${phrase}. When does it usually arrive then?`,
  holidaysSummaryRegion: (
    region: "england-and-wales" | "scotland" | "northern-ireland",
    extra: number,
  ) => {
    const name = { "england-and-wales": "England and Wales", scotland: "Scotland", "northern-ireland": "Northern Ireland" }[region];
    return extra === 0 ? name : `${name} + ${extra === 1 ? "1 extra" : `${extra} extra`}`;
  },
  holidayListEnded: (until: string) =>
    `The built-in bank holidays only go up to ${until}. You can add later ones yourself in Settings, under Bank holidays.`,
  askPaydayRuleMonthly:
    "Sometimes the date will fall on a weekend or bank holiday. When does your money usually arrive then?",
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

    paydayTitle: "Money coming in",
    paydayNameLabel: "What is it? (optional)",
    paydayNameHint: "Like wages, Universal Credit, a pension or PIP.",
    paydayDateLabel: "When it next comes in",
    paydayDateHint: "Your number lasts until this day.",
    paydayRepeatLabel: "How often does it come?",
    paydayRepeatHint:
      "If it comes on a regular pattern, I'll move on to the next date by myself once this one has gone by.",
    otherIncomeTitle: "Any other money coming in before then?",
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
    repeatBillHint: "Only the ones that come round before your money comes in are counted.",
    repeatIncomeHint: "Only the ones that arrive before your main money are counted.",
    billDueRepeating: "Next due on",
    incomeDateRepeating: "Next arrives on",
    paydayRuleShort: (phrase: string) => `If that day is a weekend or bank holiday, it comes ${phrase}.`,
    paydayRulePhrases: {
      "working-day-before": "the working day before",
      "on-the-day": "on the day itself",
      "next-working-day": "the next working day",
    },
    change: "Change",
    balanceCheckedToday: "Checked today.",
    balanceOtherDay: "Checked it on another day?",
    paydayRuleOptions: {
      "": "Choose one",
      "working-day-before": "The working day before",
      "on-the-day": "On the day itself",
      "next-working-day": "The next working day",
    },

    billsTitle: "Bills before your money comes in",
    billsHint:
      "Add anything that will leave your account before your money comes in. Bills after that can wait.",
    billName: "What is it?",
    billAmount: "Amount (£)",
    billDue: "Due on",
    addBill: "Add a bill",
    remove: "Remove",

    incomeTitle: "Money coming in",
    incomeHint: "Only things that arrive before your main money, like a refund or money you're owed.",
    incomeName: "What is it?",
    incomeAmount: "Amount (£)",
    incomeDate: "Arrives on",
    incomeSure: "I'm sure it is coming",
    incomeMaybe: "It might come",
    addIncome: "Add money coming in",

    essentialsTitle: "Food and travel",
    potTitle: "Savings",
    foodLabel: "Food and everyday spending, per week (£)",
    foodHint: "I will spread it evenly across the days until your money comes in.",
    travelLabel: "Travel, per week (£)",
    travelHint: "A monthly travel pass counts as a bill, so add that under Bills.",
    bufferLabel: "Savings to keep aside (£)",
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
    billsGroup: (count: number) => `Bills (${count})`,
    moneyLine: (name: string, day: string, days: number | null) =>
      `${name.trim() === "" ? "Your money" : name.trim()} comes in ${day}${days === null ? "" : days === 0 ? " (today)" : days === 1 ? " (tomorrow)" : ` (in ${days} days)`}`,
    moneyLineNote: "It isn't in this list: your number is what's safe to spend until it arrives.",
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
      title: "Let's check when your money comes in",
      amount: null,
      message:
        "The date you entered for your money looks like it has already gone by. Add the next date and I'll work it out.",
    };
  }
  if (safe > 0) {
    return {
      title: "Safe to spend until your money comes in",
      amount: formatMoney(safe),
      message: "That is after setting aside everything you have told me about.",
    };
  }
  if (safe === 0) {
    return {
      title: "Safe to spend until your money comes in",
      amount: formatMoney(0),
      message: "There is nothing spare until your money comes in, but everything you listed is covered.",
    };
  }
  return {
    title: "Things are tight until your money comes in",
    amount: `${formatMoney(-safe)} short`,
    message:
      "Here is where it all goes, so you can see the whole picture. This is a snapshot, not a judgement.",
  };
}

/** One short line under the number: "Money comes in Fri 27 Nov · 21 days". */
export function paydayLine(paydayDate: string, daysUntilPayday: number | null, name = ""): string {
  const day = formatDayShort(paydayDate);
  const what = name.trim() === "" ? "Money" : name.trim();
  if (daysUntilPayday === null) return `${what} comes in ${day}`;
  if (daysUntilPayday === 0) return `${what} comes in today, ${day}`;
  if (daysUntilPayday === 1) return `${what} comes in tomorrow, ${day}`;
  return `${what} comes in ${day} · ${daysUntilPayday} days`;
}

/** Plain-words notes under the number. Questions are handled separately. */
export function describeWarning(warning: Warning): string | null {
  switch (warning.kind) {
    case "payday-passed":
      return "The date your money comes in has passed. Update it when you can.";
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
      return { label: "Your savings, kept aside", amountText: signed(line.amount) };
    case "savings":
      return { label: `Saving: ${name}`, amountText: signed(line.amount) };
  }
}

function signed(amount: number): string {
  return amount >= 0 ? `+${formatMoney(amount)}` : formatMoney(amount);
}
