import { useEffect, useMemo, useState } from "react";
import { InvalidInputError } from "../logic/errors";
import { buildInput, newBillRow, newIncomeRow, withBalance } from "../logic/form";
import { calculateSafeToSpend } from "../logic/safeToSpend";
import { localToday } from "../logic/today";
import { HomeView } from "./HomeView";
import { MenuSheet } from "./MenuSheet";
import { backupFileName, makeBackupText } from "../storage/savedData";
import { downloadTextFile } from "../storage/download";
import { encryptedBackupFileName, makeEncryptedBackupText } from "../storage/encryptedBackup";
import { reminderDays } from "../storage/settings";
import { useSettings } from "../storage/useSettings";
import { useAppLock } from "../storage/useAppLock";
import { words } from "../content/words";
import { LockScreen } from "./LockScreen";
import { useSavedForm } from "../storage/useSavedForm";
import { formatMoney } from "../logic/money";
import type { DataApi, FormApi, Outcome, PanelId, SettingsApi } from "./screenTypes";

/**
 * Holds everything that is typed, works out the number, and decides what to show:
 * the calm home screen, or the menu on top of it.
 */
export default function CalculatorScreen() {
  const [today, setToday] = useState(localToday);
  const [panel, setPanel] = useState<PanelId | null>(null);
  const saved = useSavedForm();
  const { form, update } = saved;
  const appearance = useSettings();
  const lock = useAppLock();

  // Locking closes the menu, so nothing is left showing behind the privacy screen.
  useEffect(() => {
    if (lock.status !== "open") setPanel(null);
  }, [lock.status]);

  // If the app has been left open overnight, "today" must move on with the calendar.
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") setToday(localToday());
    };
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  }, []);

  const api: FormApi = {
    set: (key, value) =>
      update((current) =>
        key === "balance"
          ? withBalance(current, value as string, today)
          : { ...current, [key]: value },
      ),
    updateBill: (id, patch) =>
      update((current) => ({
        ...current,
        bills: current.bills.map((row) => (row.id === id ? { ...row, ...patch } : row)),
      })),
    updateIncome: (id, patch) =>
      update((current) => ({
        ...current,
        income: current.income.map((row) => (row.id === id ? { ...row, ...patch } : row)),
      })),
    addBill: () => {
      const row = newBillRow();
      update((current) => ({ ...current, bills: [...current.bills, row] }));
      return row.id;
    },
    addIncome: () => {
      const row = newIncomeRow();
      update((current) => ({ ...current, income: [...current.income, row] }));
      return row.id;
    },
    removeBill: (id) =>
      update((current) => ({ ...current, bills: current.bills.filter((row) => row.id !== id) })),
    removeIncome: (id) =>
      update((current) => ({ ...current, income: current.income.filter((row) => row.id !== id) })),
    answer: (id, value) =>
      update((current) => ({ ...current, answers: { ...current.answers, [id]: value } })),
    clearAnswers: () => update((current) => ({ ...current, answers: {} })),
  };

  const data: DataApi = {
    saveState: saved.saveState,
    persisted: saved.persisted,
    downloadBackup: () => downloadTextFile(backupFileName(today), makeBackupText(form, today)),
    downloadProtectedBackup: async (passphrase) => {
      const content = await makeEncryptedBackupText(form, today, passphrase);
      downloadTextFile(encryptedBackupFileName(today), content);
    },
    replaceAll: saved.replaceAll,
    clearAll: saved.clearAll,
  };

  const settings: SettingsApi = { settings: appearance.settings, change: appearance.change, lock };

  const staleAfterDays = reminderDays(appearance.settings.balanceReminder);
  const built = useMemo(() => buildInput(form, today, { staleAfterDays }), [form, today, staleAfterDays]);

  const outcome = useMemo<Outcome | null>(() => {
    if (built.status !== "ready") return null;
    try {
      return { ok: true, result: calculateSafeToSpend(built.input) };
    } catch (error) {
      if (error instanceof InvalidInputError) return { ok: false };
      throw error;
    }
  }, [built]);

  // The rainy-day pot, shown as one quiet line when there is one.
  const potAmount =
    built.status === "ready" && outcome !== null && outcome.ok && outcome.result.safeToSpend !== null && built.input.buffer > 0
      ? formatMoney(built.input.buffer)
      : null;

  // "Fresh" means nothing important has been typed yet, so we say a proper hello.
  const fresh = built.status === "needs-more" && form.balance.trim() === "" && form.paydayDate === "";

  if (lock.status === "checking") {
    return (
      <main className="home-main">
        <p className="home-message">{words.lock.opening}</p>
      </main>
    );
  }

  if (lock.status === "locked") {
    return (
      <LockScreen
        lock={lock}
        onForgot={async () => {
          const cleared = await saved.clearAll();
          if (!cleared) return false;
          return lock.turnOff();
        }}
      />
    );
  }

  return (
    <>
      <HomeView
        built={built}
        outcome={outcome}
        fresh={fresh}
        potAmount={potAmount}
        showExplanation={appearance.settings.showExplanation}
        showPayday={appearance.settings.showPayday}
        loading={!saved.loaded}
        notSaved={saved.saveState === "not-saved"}
        readProblem={saved.readProblem}
        onOpen={setPanel}
      />
      <MenuSheet
        panel={panel}
        onPanel={setPanel}
        form={form}
        today={today}
        built={built}
        outcome={outcome}
        api={api}
        data={data}
        settings={settings}
      />
    </>
  );
}
