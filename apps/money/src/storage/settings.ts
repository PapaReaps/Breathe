import { rememberAppearance } from "../splash";

/*
 * Preferences about how the app looks. Kept apart from the numbers, so
 * "Clear my numbers" never resets them and backups never carry them.
 */

export type Appearance = "system" | "light" | "dark";
export type Accent = "teal" | "blue" | "plum" | "rose" | "green";
export type PotColour = "gold" | "rose" | "green" | "blue" | "lilac";

export type BalanceReminder = "daily" | "three-days" | "weekly" | "never";
export type TextSize = "standard" | "large" | "largest";
/** "system" follows the device's own "more contrast" setting; "more" always uses stronger contrast. */
export type Contrast = "system" | "more";

export interface Settings {
  appearance: Appearance;
  accent: Accent;
  potColour: PotColour;
  /** The short sentence under the number, when things are comfortable. */
  showExplanation: boolean;
  /** The payday date under the number. */
  showPayday: boolean;
  /** How often to gently suggest updating the balance. */
  balanceReminder: BalanceReminder;
  /** Makes every word in the app bigger (on top of the device's own text size). */
  textSize: TextSize;
  contrast: Contrast;
  /** Android app only: ask GitHub once a day whether a newer version is out. Off unless switched on. */
  checkForUpdates: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  appearance: "system",
  accent: "teal",
  potColour: "gold",
  showExplanation: true,
  showPayday: true,
  balanceReminder: "three-days",
  textSize: "standard",
  contrast: "system",
  checkForUpdates: false,
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

export const APPEARANCES: readonly Appearance[] = ["system", "light", "dark"];
export const TEXT_SIZES: readonly TextSize[] = ["standard", "large", "largest"];
export const CONTRASTS: readonly Contrast[] = ["system", "more"];

/** The colour choices. `swatch` is only the little circle shown in Settings. */
export const ACCENTS: ReadonlyArray<{ id: Accent; swatch: string }> = [
  { id: "teal", swatch: "#1f5f5b" },
  { id: "blue", swatch: "#1f4f8f" },
  { id: "plum", swatch: "#6b3a8a" },
  { id: "rose", swatch: "#9b2f55" },
  { id: "green", swatch: "#2f6b2f" },
];

export const POT_COLOURS: ReadonlyArray<{ id: PotColour; swatch: string }> = [
  { id: "gold", swatch: "#f2b705" },
  { id: "rose", swatch: "#f08aab" },
  { id: "green", swatch: "#6cc070" },
  { id: "blue", swatch: "#6aa5ee" },
  { id: "lilac", swatch: "#b98ae0" },
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
    showExplanation: typeof record.showExplanation === "boolean" ? record.showExplanation : DEFAULT_SETTINGS.showExplanation,
    showPayday: typeof record.showPayday === "boolean" ? record.showPayday : DEFAULT_SETTINGS.showPayday,
    balanceReminder: pick(record.balanceReminder, BALANCE_REMINDERS, DEFAULT_SETTINGS.balanceReminder),
    textSize: pick(record.textSize, TEXT_SIZES, DEFAULT_SETTINGS.textSize),
    contrast: pick(record.contrast, CONTRASTS, DEFAULT_SETTINGS.contrast),
    checkForUpdates: record.checkForUpdates === true,
  };
}

export function toSavedSettings(settings: Settings): { format: number } & Settings {
  return {
    format: 1,
    appearance: settings.appearance,
    accent: settings.accent,
    potColour: settings.potColour,
    showExplanation: settings.showExplanation,
    showPayday: settings.showPayday,
    balanceReminder: settings.balanceReminder,
    textSize: settings.textSize,
    contrast: settings.contrast,
    checkForUpdates: settings.checkForUpdates,
  };
}

/** The defaults remove the attribute, so the styles' own starting colours apply. */
export function applySettings(settings: Settings): void {
  const root = document.documentElement;
  const set = (name: string, value: string, isDefault: boolean) => {
    if (isDefault) root.removeAttribute(name);
    else root.setAttribute(name, value);
  };
  set("data-theme", settings.appearance, settings.appearance === "system");
  rememberAppearance(settings.appearance);
  set("data-accent", settings.accent, settings.accent === DEFAULT_SETTINGS.accent);
  set("data-pot", settings.potColour, settings.potColour === DEFAULT_SETTINGS.potColour);
  set("data-text", settings.textSize, settings.textSize === DEFAULT_SETTINGS.textSize);
  set("data-contrast", settings.contrast, settings.contrast === DEFAULT_SETTINGS.contrast);
}
