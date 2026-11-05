import type { FormState } from "./form";

/** The questions in the step-by-step setup, in order. */
export const SETUP_STEPS = ["payday", "balance", "bills", "food", "pot"] as const;
export type SetupStep = (typeof SETUP_STEPS)[number];

/**
 * Where the setup starts. It begins with the money coming in. Someone who has already
 * given that date but not their balance carries on from the balance question.
 * (Index into SETUP_STEPS.)
 */
export function firstSetupStep(form: FormState): number {
  if (form.paydayDate.trim() === "") return 0;
  if (form.balance.trim() === "") return 1;
  return 0;
}
