import type { BillRow, FormState, IncomeRow } from "../logic/form";
import type { CalculatorResult, Warning } from "../logic/types";
import type { SaveState } from "../storage/useSavedForm";

/** Which page of the menu is open. null means the menu is closed. */
export type PanelId =
  | "menu"
  | "account"
  | "payday"
  | "bills"
  | "income"
  | "essentials"
  | "holidays"
  | "data"
  | "setup"
  | "explain"
  | "about";

export type Outcome = { ok: true; result: CalculatorResult } | { ok: false };
export type NeedsAnswer = Extract<Warning, { kind: "needs-answer" }>;

/** Everything the menu pages can do to the form. */
export interface FormApi {
  set: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  updateBill: (id: string, patch: Partial<BillRow>) => void;
  updateIncome: (id: string, patch: Partial<IncomeRow>) => void;
  addBill: () => void;
  addIncome: () => void;
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
  replaceAll: (form: FormState) => void;
  clearAll: () => Promise<boolean>;
}
