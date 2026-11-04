import type { FormState } from "./form";

/** The questions in the step-by-step setup, in order. */
export const SETUP_STEPS = ["balance", "payday", "bills", "income", "food", "pot"] as const;
export type SetupStep = (typeof SETUP_STEPS)[number];

/**
 * Where the setup starts. Someone who has already given their balance but not
 * their payday carries on from the payday question, so nothing is asked twice.
 * (Index into SETUP_STEPS.)
 */
export function firstSetupStep(form: FormState): number {
  if (form.balance.trim() === "") return 0;
  if (form.paydayDate.trim() === "") return 1;
  return 0;
}
