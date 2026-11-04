import { useMemo, useState } from "react";
import { InvalidInputError } from "../logic/errors";
import { buildInput, emptyForm, newBillRow, newIncomeRow } from "../logic/form";
import type { FormState } from "../logic/form";
import { calculateSafeToSpend } from "../logic/safeToSpend";
import { localToday } from "../logic/today";
import { HomeView } from "./HomeView";
import { MenuSheet } from "./MenuSheet";
import type { FormApi, Outcome, PanelId } from "./screenTypes";

/**
 * Holds everything that is typed, works out the number, and decides what to show:
 * the calm home screen, or the menu on top of it.
 */
export default function CalculatorScreen() {
  const [today] = useState(localToday);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [panel, setPanel] = useState<PanelId | null>(null);

  const api: FormApi = {
    set: (key, value) => setForm((current) => ({ ...current, [key]: value })),
    updateBill: (id, patch) =>
      setForm((current) => ({
        ...current,
        bills: current.bills.map((row) => (row.id === id ? { ...row, ...patch } : row)),
      })),
    updateIncome: (id, patch) =>
      setForm((current) => ({
        ...current,
        income: current.income.map((row) => (row.id === id ? { ...row, ...patch } : row)),
      })),
    addBill: () => setForm((current) => ({ ...current, bills: [...current.bills, newBillRow()] })),
    addIncome: () => setForm((current) => ({ ...current, income: [...current.income, newIncomeRow()] })),
    removeBill: (id) =>
      setForm((current) => ({ ...current, bills: current.bills.filter((row) => row.id !== id) })),
    removeIncome: (id) =>
      setForm((current) => ({ ...current, income: current.income.filter((row) => row.id !== id) })),
    answer: (id, value) =>
      setForm((current) => ({ ...current, answers: { ...current.answers, [id]: value } })),
    clearAnswers: () => setForm((current) => ({ ...current, answers: {} })),
  };

  const built = useMemo(() => buildInput(form, today), [form, today]);

  const outcome = useMemo<Outcome | null>(() => {
    if (built.status !== "ready") return null;
    try {
      return { ok: true, result: calculateSafeToSpend(built.input) };
    } catch (error) {
      if (error instanceof InvalidInputError) return { ok: false };
      throw error;
    }
  }, [built]);

  // "Fresh" means nothing important has been typed yet, so we say a proper hello.
  const fresh = built.status === "needs-more" && form.balance.trim() === "" && form.paydayDate === "";

  return (
    <>
      <HomeView built={built} outcome={outcome} fresh={fresh} onOpen={setPanel} />
      <MenuSheet
        panel={panel}
        onPanel={setPanel}
        form={form}
        today={today}
        built={built}
        outcome={outcome}
        api={api}
      />
    </>
  );
}
