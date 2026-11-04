import type { BillRow, FormState, IncomeRow } from "../logic/form";
import type { CalculatorResult, Warning } from "../logic/types";
import type { Settings } from "../storage/settings";
import type { LockApi } from "../storage/useAppLock";
import type { SaveState } from "../storage/useSavedForm";

/** Which page of the menu is open. null means the menu is closed. */
export type PanelId =
  | "menu"
  | "account"
  | "payday"
  | "bills"
  | "income"
  | "essentials"
  | "pot"
  | "holidays"
  | "data"
  | "setup"
  | "settings"
  | "explain"
  | "about";

export type Outcome = { ok: true; result: CalculatorResult } | { ok: false };
export type NeedsAnswer = Extract<Warning, { kind: "needs-answer" }>;

/** Everything the menu pages can do to the form. */
export interface FormApi {
  set: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  updateBill: (id: string, patch: Partial<BillRow>) => void;
  updateIncome: (id: string, patch: Partial<IncomeRow>) => void;
  /** Add an empty row and return its id, so the page can open it for typing. */
  addBill: () => string;
  addIncome: () => string;
  removeBill: (id: string) => void;
  removeIncome: (id: string) => void;
  answer: (id: string, value: boolean) => void;
  clearAnswers: () => void;
}

/** What the "Your data and backups" page can do. */
export interface DataApi {
  saveState: SaveState;
  persisted: boolean | null;
  downloadBackup: () => void;
  /** Encrypts with the passphrase, then hands the file to the browser. Rejects if encryption isn't possible here. */
  downloadProtectedBackup: (passphrase: string) => Promise<void>;
  replaceAll: (form: FormState) => void;
  clearAll: () => Promise<boolean>;
}

/** What the Settings page can do. */
export interface SettingsApi {
  settings: Settings;
  change: (patch: Partial<Settings>) => void;
  lock: LockApi;
}
