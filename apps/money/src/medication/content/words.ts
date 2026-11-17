// All the words people see live here, so the tone can be checked in one place.
// Calm, kind and plain. Never "missed", never red, never blame. Never medical advice.

import type { DraftProblem, PartOfDay } from "../logic/medicines";

export const words = {
  appName: "Breathe Medication",
  menuButton: "Menu",
  switchApp: "Switch Breathe app",
  loading: "Opening your medicines…",

  welcomeTitle: "Take a breath.",
  welcomeTitleTwo: "You've got this.",
  welcomeMessage: "Add your medicines and when you take them. Each day you'll see a calm list, and tap Taken when it's done.",
  welcomeButton: "Add a medicine",

  parts: { morning: "Morning", afternoon: "Afternoon", evening: "Evening" } satisfies Record<PartOfDay, string>,
  next: (name: string, time: string) => `Next: ${name} at ${time}`,
  allDone: "All done for today. Well done.",
  nothingLater: "Nothing else coming up today.",
  notTakenYet: "Not taken yet",
  takenButton: "Taken",
  takenDone: "Taken ✓",
  takenLabel: (name: string, time: string) => `${name} at ${time}: tap if you've taken it`,
  undoLabel: (name: string, time: string) => `${name} at ${time} is ticked as taken. Tap to untick.`,
  doseLine: (time: string, amount: string) => (amount ? `${time} · ${amount}` : time),

  low: {
    title: (name: string) => `${name} is running low`,
    text: (days: number) => (days <= 0 ? "None left by our count. A good time to order more." : days === 1 ? "About 1 day left. A good time to order more." : `About ${days} days left. A good time to order more.`),
    ordered: "I've ordered it",
    update: "Update count",
  },
  leftSummary: (left: number, days: number | null) => (days === null ? `${left} left` : `${left} left · about ${days} ${days === 1 ? "day" : "days"}`),

  history: {
    menuRow: "History",
    menuSub: "A calm record of each day",
    title: "History",
    previous: (month: string) => `Show ${month}`,
    next: (month: string) => `Show ${month}`,
    gridLabel: "Days of the month. Tap a day to see what was due.",
    weekdays: ["M", "T", "W", "T", "F", "S", "S"],
    legendLabel: "What the dots mean",
    marks: { all: "All taken", some: "Some taken", none: "None logged", empty: "Nothing due", future: "Still to come" },
    taken: "Taken ✓",
    notLogged: "Not logged",
    nothingDue: "Nothing was due this day.",
    footnote: "Just a record, with no scores. Questions about missed doses? Check with your pharmacist or GP.",
  },

  notAdvice: "Breathe Medication is a reminder tool, not medical advice. Questions about your medicines? Check with your pharmacist or GP.",
  notSavedLine: "Your medicines couldn't be saved on this device just now, so they'll be gone when you close this page.",
  readProblemLine: "We couldn't read the medicines saved earlier, so we've started fresh.",

  menu: {
    title: "Menu",
    close: "Done",
    yourMedicines: "Your medicines",
    add: "Add a medicine",
    none: "None yet",
    timesSummary: (times: string[]) => (times.length === 1 ? `Every day, ${times[0]}` : `Every day, ${times.join(", ")}`),
    settings: "Settings",
    settingsSub: "Look, text and privacy",
    data: "Your data and backups",
    about: "About Breathe Medication",
    aboutText: [
      "Breathe Medication helps you remember your medicines, calmly. Your list stays on this device, and nothing is sent anywhere.",
      "It's part of Breathe, alongside Breathe Money. It's new and still growing. In the Android app, it can remind you at each time.",
      "It's a reminder tool, not medical advice. It never checks doses. Questions about your medicines? Check with your pharmacist or GP.",
    ],
    back: "← Back to the menu",
  },

  reminders: {
    askTitle: "Would you like reminders?",
    askText: "Your phone can show a gentle note at each time, even when Breathe Medication is closed. Nothing is sent anywhere.",
    askYes: "Yes, remind me",
    askNo: "Not now",
    deniedTitle: "Reminders are turned off for this app",
    deniedText: "To get them, allow notifications for Breathe Medication in your phone's Settings, under Apps.",
    lateTitle: "Reminders may come a little late",
    lateText: "Your phone saves battery by holding them back a few minutes. To have them right on time, allow Alarms and reminders for Breathe Medication.",
    lateButton: "Open the setting",
    menuRow: "Reminders",
    menuOn: "On",
    menuOff: "Off",
    menuWeb: "In the app",
    panelTitle: "Reminders",
    switchOn: "Remind me at each time",
    switchOnHint: "One gentle note per time, even if a few medicines share it. It never shows medicine names, so your lock screen stays private.",
    nudge: "One gentle nudge 30 minutes later",
    nudgeHint: "Only if it's not ticked yet. Then it stays quiet.",
    statusOn: "Reminders are on.",
    statusOff: "Reminders are off.",
    batteryTip: "If reminders don't come, your phone may be stopping them to save battery. Look for Battery in your phone's Settings, then Breathe Medication, and choose Unrestricted or Don't optimise.",
    webText: "Reminders that pop up on your phone come with the Android app. A website can't wake your phone at a set time, so in the browser, keep this list handy and check it.",
  },

  form: {
    addTitle: "Add a medicine",
    editTitle: "Change this medicine",
    name: "What do you call it?",
    nameHint: "Any name that makes sense to you.",
    amount: "How much (optional)",
    amountHint: "For example: 1 tablet, 2 puffs, 5ml.",
    times: "When do you take it?",
    timesHint: "Every day at these times.",
    timeLabel: (n: number) => `Time ${n}`,
    addTime: "+ Add another time",
    removeTime: "Remove",
    removeTimeLabel: (n: number) => `Remove time ${n}`,
    countTitle: "Running low (optional)",
    countHint: "Count what's left, and we'll give you a gentle note about a week before it runs out. Each Taken counts one off.",
    left: "How many are left?",
    perDose: "How many each time?",
    save: "Save",
    cancel: "Cancel",
    remove: "Remove this medicine",
    removeAsk: (name: string) => `Remove ${name}? Its ticks go too.`,
    removeYes: "Yes, remove it",
    removeNo: "Keep it",
    problems: {
      "name-missing": "Add a name, so you know which one it is.",
      "name-long": "That name is a bit long. Try a shorter one (60 letters at most).",
      "amount-long": "Try a shorter amount (40 letters at most).",
      "time-missing": "Add at least one time.",
      "time-odd": "One of the times doesn't look right. Try picking it again.",
      "too-many-times": "That's a lot of times. Eight is the most for one medicine.",
      "left-odd": "Type how many are left as a whole number, like 28.",
      "per-dose-odd": "Type how many you take each time as a whole number, like 1 or 2.",
    } satisfies Record<DraftProblem, string>,
  },
} as const;

/** "Monday 16 November", in the phone's language. */
export function todayLabel(date: Date): string {
  return date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}
