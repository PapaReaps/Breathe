import { isCurrency } from "../logic/currency";
import type { CurrencyCode } from "../logic/currency";
import { rememberAppearance } from "../splash";
import { CLICK_SOUNDS, VIBRATIONS } from "../feedback";
import type { ClickSound, Vibration } from "../feedback";

/*
 * Preferences about how the app looks. Kept apart from the numbers, so
 * "Clear my numbers" never resets them and backups never carry them.
 */

/** "black" (v0.29.0) is dark mode with a true black background. */
export type Appearance = "system" | "light" | "dark" | "black";
export type Accent =
  | "teal" | "blue" | "plum" | "rose" | "green" | "ocean" | "terracotta" | "slate" | "amber"
  | "indigo" | "coral" | "sage" | "lavender" | "sky" | "berry" | "gold"
  | "deep-teal" | "navy" | "deep-purple" | "burgundy" | "forest" | "deep-orange";
/** The colour of the lines around boxes (v0.29.0). "soft" is the usual grey. */
export type Outline = "soft" | "accent" | "bright" | "gold" | "rose" | "sky" | "none";
export const OUTLINES: ReadonlyArray<{ id: Outline; swatch: string; dark: string }> = [
  { id: "soft", swatch: "#d5d9d6", dark: "#36434a" },
  { id: "accent", swatch: "#1f5f5b", dark: "#7cc4bd" },
  { id: "bright", swatch: "#1f2a30", dark: "#e8eeee" },
  { id: "gold", swatch: "#e0a800", dark: "#e0a800" },
  { id: "rose", swatch: "#e07a9a", dark: "#e07a9a" },
  { id: "sky", swatch: "#4fb3d9", dark: "#4fb3d9" },
  { id: "none", swatch: "#8a979c", dark: "#8a979c" },
];
export type PotColour =
  | "gold" | "rose" | "green" | "blue" | "lilac" | "peach" | "mint" | "sand" | "silver"
  | "deep-gold" | "ruby" | "emerald" | "sapphire" | "amethyst" | "copper" | "jade" | "bronze" | "graphite" | "crimson" | "ocean-deep" | "orchid";

export type BalanceReminder = "daily" | "three-days" | "weekly" | "never";
export type TextSize = "standard" | "large" | "largest";
/** How "Coming up" is shown: a simple list, or a month. */
export type CalendarView = "list" | "month";
export const CALENDAR_VIEWS: ReadonlyArray<CalendarView> = ["list", "month"];
/** "system" follows the device's own "more contrast" setting; "more" always uses stronger contrast. */
export type Contrast = "system" | "more";

export interface Settings {
  appearance: Appearance;
  accent: Accent;
  potColour: PotColour;
  /** The lines around boxes. */
  outline: Outline;
  /** The short sentence under the number, when things are comfortable. */
  showExplanation: boolean;
  /** The payday date under the number. */
  showPayday: boolean;
  /** The Savings badge under the number. Hiding it doesn't change the number: savings are still kept aside. */
  showSavings: boolean;
  /** The main money's own name ("Universal Credit") under the number. Off, so it stays private from people glancing. */
  showMoneyName: boolean;
  /** The word "breathe" above the number breathes slowly. Off keeps it still. Always still with "reduce motion". */
  breathMotion: boolean;
  /** How often to gently suggest updating the balance. */
  balanceReminder: BalanceReminder;
  /** Makes every word in the app bigger (on top of the device's own text size). */
  textSize: TextSize;
  contrast: Contrast;
  /** Android app only: ask GitHub once a day whether a newer version is out. Off unless switched on. */
  checkForUpdates: boolean;
  /** Android app only: the one-time "Hear about new versions?" note has been answered, so it never shows again. */
  updatesAsked: boolean;
  /** A soft sound when a button is tapped. Off unless chosen. */
  clickSound: ClickSound;
  /** A small vibration when a button is tapped, where the phone allows it. Off unless chosen. */
  vibration: Vibration;
  /** Coming up: list first, unless the person picked the month. */
  calendarView: CalendarView;
  /** The money used (v0.35.0). Null until chosen: the pound, so anyone already using the app sees no change. */
  currency: CurrencyCode | null;
}

export const DEFAULT_SETTINGS: Settings = {
  appearance: "system",
  accent: "teal",
  potColour: "gold",
  outline: "soft",
  showExplanation: true,
  showPayday: true,
  showSavings: true,
  showMoneyName: false,
  breathMotion: true,
  balanceReminder: "three-days",
  textSize: "standard",
  contrast: "system",
  checkForUpdates: false,
  updatesAsked: false,
  clickSound: "off",
  vibration: "off",
  calendarView: "list",
  currency: null,
};

export const SETTINGS_KEY = "settings";

export const BALANCE_REMINDERS: readonly BalanceReminder[] = ["daily", "three-days", "weekly", "never"];

/**
 * How many days old a balance can be before the app says so.
 * "Every day" means anything older than today; "never" is a number too big to reach.
 */
export function reminderDays(choice: BalanceReminder): number {
  switch (choice) {
    case "daily":
      return 0;
    case "three-days":
      return 3;
    case "weekly":
      return 7;
    case "never":
      return Number.MAX_SAFE_INTEGER;
  }
}

export const APPEARANCES: readonly Appearance[] = ["system", "light", "dark", "black"];
export const TEXT_SIZES: readonly TextSize[] = ["standard", "large", "largest"];
export const CONTRASTS: readonly Contrast[] = ["system", "more"];

/** The colour choices. `swatch` is only the little circle shown in Settings. */
/** Each colour's light shade (swatch) and dark shade, so the circles show what you'll get. */
export const ACCENTS: ReadonlyArray<{ id: Accent; swatch: string; dark: string }> = [
  { id: "teal", swatch: "#1f5f5b", dark: "#7cc4bd" },
  { id: "blue", swatch: "#1f4f8f", dark: "#8ab4f0" },
  { id: "plum", swatch: "#6b3a8a", dark: "#c9a0e6" },
  { id: "rose", swatch: "#9b2f55", dark: "#f0a3bf" },
  { id: "green", swatch: "#2f6b2f", dark: "#9fd49a" },
  { id: "ocean", swatch: "#1a5670", dark: "#86c5db" },
  { id: "terracotta", swatch: "#9a4523", dark: "#f0a888" },
  { id: "slate", swatch: "#44525c", dark: "#b9c6ce" },
  { id: "amber", swatch: "#855300", dark: "#f2c46d" },
  { id: "indigo", swatch: "#3f3fa0", dark: "#a9acf5" },
  { id: "coral", swatch: "#a6402c", dark: "#f4a090" },
  { id: "sage", swatch: "#4f6b2e", dark: "#b5cf8f" },
  { id: "lavender", swatch: "#5e4a9a", dark: "#c7b8f0" },
  { id: "sky", swatch: "#1d5f86", dark: "#8fd0f0" },
  { id: "berry", swatch: "#8a1f4f", dark: "#f08fb8" },
  { id: "gold", swatch: "#7a5a00", dark: "#f0c95a" },
  { id: "deep-teal", swatch: "#0d4a45", dark: "#26b3a6" },
  { id: "navy", swatch: "#16306b", dark: "#5b8cf0" },
  { id: "deep-purple", swatch: "#4a1f78", dark: "#a777f0" },
  { id: "burgundy", swatch: "#6e1630", dark: "#e0607f" },
  { id: "forest", swatch: "#1e4d22", dark: "#4fbf5a" },
  { id: "deep-orange", swatch: "#8a3600", dark: "#f08a3c" },
];

export const POT_COLOURS: ReadonlyArray<{ id: PotColour; swatch: string; dark: string }> = [
  { id: "gold", swatch: "#f2b705", dark: "#ffd479" },
  { id: "rose", swatch: "#f08aab", dark: "#ffb3cd" },
  { id: "green", swatch: "#6cc070", dark: "#a8e6a0" },
  { id: "blue", swatch: "#6aa5ee", dark: "#9cc7ff" },
  { id: "lilac", swatch: "#b98ae0", dark: "#d9b3f5" },
  { id: "peach", swatch: "#f7a072", dark: "#ffc29e" },
  { id: "mint", swatch: "#6fd1b8", dark: "#96e0cf" },
  { id: "sand", swatch: "#d9bd84", dark: "#e8cf98" },
  { id: "silver", swatch: "#b8c2c8", dark: "#c9d4da" },
  { id: "deep-gold", swatch: "#6b3d00", dark: "#ffcf5c" },
  { id: "ruby", swatch: "#7a0f2c", dark: "#ff8fae" },
  { id: "emerald", swatch: "#0b5530", dark: "#6fe3a0" },
  { id: "sapphire", swatch: "#17327f", dark: "#8fb0ff" },
  { id: "amethyst", swatch: "#4a1d7a", dark: "#c79bf7" },
  { id: "copper", swatch: "#7a3010", dark: "#ff9f70" },
  { id: "jade", swatch: "#0a5244", dark: "#5fdcc0" },
  { id: "bronze", swatch: "#5a3a10", dark: "#e0b066" },
  { id: "graphite", swatch: "#232c33", dark: "#b3c1ca" },
  { id: "crimson", swatch: "#7d1212", dark: "#ff8a8a" },
  { id: "ocean-deep", swatch: "#0b4058", dark: "#6fcbee" },
  { id: "orchid", swatch: "#701858", dark: "#f08fd6" },
];

function pick<T extends string>(value: unknown, allowed: ReadonlyArray<T>, fallback: T): T {
  return typeof value === "string" && (allowed as ReadonlyArray<string>).includes(value) ? (value as T) : fallback;
}

/** Anything unexpected falls back to the default for that one setting. Never throws. */
export function readSettings(raw: unknown): Settings {
  const record = typeof raw === "object" && raw !== null && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  return {
    appearance: pick(record.appearance, APPEARANCES, DEFAULT_SETTINGS.appearance),
    accent: pick(record.accent, ACCENTS.map((a) => a.id), DEFAULT_SETTINGS.accent),
    potColour: pick(record.potColour, POT_COLOURS.map((p) => p.id), DEFAULT_SETTINGS.potColour),
    outline: pick(record.outline, OUTLINES.map((o) => o.id), DEFAULT_SETTINGS.outline),
    showExplanation: typeof record.showExplanation === "boolean" ? record.showExplanation : DEFAULT_SETTINGS.showExplanation,
    showPayday: typeof record.showPayday === "boolean" ? record.showPayday : DEFAULT_SETTINGS.showPayday,
    showSavings: typeof record.showSavings === "boolean" ? record.showSavings : DEFAULT_SETTINGS.showSavings,
    showMoneyName: record.showMoneyName === true,
    breathMotion: record.breathMotion !== false,
    balanceReminder: pick(record.balanceReminder, BALANCE_REMINDERS, DEFAULT_SETTINGS.balanceReminder),
    textSize: pick(record.textSize, TEXT_SIZES, DEFAULT_SETTINGS.textSize),
    contrast: pick(record.contrast, CONTRASTS, DEFAULT_SETTINGS.contrast),
    checkForUpdates: record.checkForUpdates === true,
    updatesAsked: record.updatesAsked === true,
    clickSound: pick(record.clickSound, CLICK_SOUNDS, DEFAULT_SETTINGS.clickSound),
    vibration: pick(record.vibration, VIBRATIONS, DEFAULT_SETTINGS.vibration),
    calendarView: pick(record.calendarView, CALENDAR_VIEWS, DEFAULT_SETTINGS.calendarView),
    currency: isCurrency(record.currency) ? record.currency : null,
  };
}

export function toSavedSettings(settings: Settings): { format: number } & Settings {
  return {
    format: 1,
    appearance: settings.appearance,
    accent: settings.accent,
    potColour: settings.potColour,
    outline: settings.outline,
    showExplanation: settings.showExplanation,
    showPayday: settings.showPayday,
    showSavings: settings.showSavings,
    showMoneyName: settings.showMoneyName,
    breathMotion: settings.breathMotion,
    balanceReminder: settings.balanceReminder,
    textSize: settings.textSize,
    contrast: settings.contrast,
    checkForUpdates: settings.checkForUpdates,
    updatesAsked: settings.updatesAsked,
    clickSound: settings.clickSound,
    vibration: settings.vibration,
    calendarView: settings.calendarView,
    currency: settings.currency,
  };
}

/** The defaults remove the attribute, so the styles' own starting colours apply. */
/** The opening reads this before the app loads, so a still "breathe" stays still from the very start. */
function rememberBreath(moving: boolean): void {
  try {
    if (moving) localStorage.removeItem("breathe-still");
    else localStorage.setItem("breathe-still", "1");
  } catch {
    // Not available: the opening just breathes as usual.
  }
}

export function applySettings(settings: Settings): void {
  const root = document.documentElement;
  const set = (name: string, value: string, isDefault: boolean) => {
    if (isDefault) root.removeAttribute(name);
    else root.setAttribute(name, value);
  };
  // Jet black is dark mode (so every colour choice works) with a true black background on top.
  set("data-theme", settings.appearance === "black" ? "dark" : settings.appearance, settings.appearance === "system");
  set("data-black", "", settings.appearance !== "black");
  set("data-outline", settings.outline, settings.outline === DEFAULT_SETTINGS.outline);
  rememberAppearance(settings.appearance);
  set("data-accent", settings.accent, settings.accent === DEFAULT_SETTINGS.accent);
  set("data-pot", settings.potColour, settings.potColour === DEFAULT_SETTINGS.potColour);
  set("data-text", settings.textSize, settings.textSize === DEFAULT_SETTINGS.textSize);
  set("data-contrast", settings.contrast, settings.contrast === DEFAULT_SETTINGS.contrast);
  set("data-breath", "still", settings.breathMotion);
  rememberBreath(settings.breathMotion);
}
