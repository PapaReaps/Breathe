import { useEffect, useState } from "react";
import { MoneyField } from "../components/MoneyField";
import { isNativeApp } from "../platform";
import { changeSavings, savingsNow } from "../logic/savings";
import { formatMoney } from "../logic/money";
import { RowList } from "../components/RowList";
import { words } from "../content/words";
import { BUILT_IN_LAST_DAY, HOLIDAY_REGIONS } from "../data/bankHolidays";
import { paydayRuleQuestion, regionOf, stopRow } from "../logic/form";
import type { FormState } from "../logic/form";
import { billsTotalLine, incomeTotalLine, isBlankBill, isBlankIncome, summariseBill, summariseIncome } from "../logic/rows";
import { REPEATS } from "../logic/repeat";
import type { Repeat } from "../logic/repeat";
import type { PaydayRule } from "../logic/types";
import type { FormApi } from "./screenTypes";

/* One small component for each page of the menu that asks for something. */

const ui = words.ui;

interface SectionProps {
  form: FormState;
  today: string;
  api: FormApi;
  /** The setup walk-through already says this in its own words. */
  hideHint?: boolean;
}

interface PlanUntilProps extends SectionProps {
  /**
   * Setup only: one line saying which money the number plans until, and the weekend
   * question as one line with a Change link (starting from "the working day before").
   */
  compactRule?: boolean;
}

export function AccountSection({ form, today, api }: SectionProps) {
  // Most people type their balance straight after checking it, so the date only shows when it matters.
  const fromAnotherDay = form.balanceDate !== "" && form.balanceDate !== today;
  const [pickingDate, setPickingDate] = useState(false);
  const showDate = fromAnotherDay || pickingDate;
  return (
    <>
      <MoneyField
        label={ui.balanceLabel}
        hint={ui.balanceHint}
        value={form.balance}
        onChange={(value) => api.set("balance", value)}
        allowNegative
      />
      {showDate ? (
        <div className="field">
          <label htmlFor="balance-date">{ui.balanceDateLabel}</label>
          <p className="hint">{ui.balanceDateHint}</p>
          <input
            id="balance-date"
            type="date"
            max={today}
            value={form.balanceDate || today}
            onChange={(event) => api.set("balanceDate", event.target.value)}
          />
        </div>
      ) : (
        <p className="hint">
          {ui.balanceCheckedToday}{" "}
          <button type="button" className="link" onClick={() => setPickingDate(true)}>
            {ui.balanceOtherDay}
          </button>
        </p>
      )}
    </>
  );
}

/**
 * Android's calendar has no "Clear" button, so once a date is picked it can't be emptied there.
 * This small link does it, and only shows when there's a date to clear.
 */
/** Android shows an empty date box as a blank strip, so say what it's for. Not needed in browsers, which show dd/mm/yyyy. */
function DateHint({ value }: { value: string }) {
  if (value !== "" || !isNativeApp()) return null;
  return <p className="hint date-hint">{ui.pickDate}</p>;
}

function ClearDate({ value, onClear }: { value: string; onClear: () => void }) {
  if (value === "") return null;
  return (
    <button type="button" className="link clear-date" onClick={onClear}>
      {ui.clearDate}
    </button>
  );
}

/** "How often?" for a bill or for money coming in, with a short hint when it repeats. */
function RepeatField({
  id,
  value,
  hint,
  onChange,
}: {
  id: string;
  value: Repeat;
  hint: string;
  onChange: (value: Repeat) => void;
}) {
  const current: Repeat = REPEATS.includes(value) ? value : "once";
  return (
    <div className="field">
      <label htmlFor={id}>{ui.repeatLabel}</label>
      {current === "once" ? null : <p className="hint">{hint}</p>}
      <select id={id} value={current} onChange={(event) => onChange(event.target.value as Repeat)}>
        {REPEATS.map((choice) => (
          <option key={choice} value={choice}>
            {ui.repeatOptions[choice]}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Which money coming in the number plans until. Chosen automatically (the biggest regular
 * payment) unless the person picks one, plus the weekend question for that payment.
 */
export function PlanUntilSection({ form, today, api, compactRule = false }: PlanUntilProps) {
  const question = paydayRuleQuestion(form, today);
  const [changing, setChanging] = useState(false);
  const needsDefault = compactRule && question !== null && form.paydayRule === "";
  useEffect(() => {
    if (needsDefault) api.set("paydayRule", "working-day-before");
  }, [needsDefault, api]);
  const shortRule = compactRule && !changing && form.paydayRule !== "";
  const stop = stopRow(form, today);
  const autoStop = stopRow({ ...form, planUntil: "" }, today);
  const nameOf = (row: { name: string } | null) => (row === null ? "" : row.name.trim());
  const choices = form.income.filter((row) => row.date !== "");

  const rule = (
    <>
      {question !== null && shortRule ? (
        <p className="hint">
          {ui.paydayRuleShort(ui.paydayRulePhrases[form.paydayRule as PaydayRule])}{" "}
          <button type="button" className="link" onClick={() => setChanging(true)}>
            {ui.change}
          </button>
        </p>
      ) : null}
      {question !== null && !shortRule ? (
        <div className="field">
          <label htmlFor="payday-rule">{question}</label>
          <select
            id="payday-rule"
            value={form.paydayRule}
            onChange={(event) => api.set("paydayRule", event.target.value as PaydayRule | "")}
          >
            {Object.entries(ui.paydayRuleOptions).map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </>
  );

  if (compactRule) {
    if (stop === null) return null;
    return (
      <div className="plan-until-note">
        <p className="hint">{ui.planUntilSetup(nameOf(stop))}</p>
        {rule}
      </div>
    );
  }

  if (choices.length === 0) return <p className="hint">{ui.planUntilNothingYet}</p>;
  return (
    <>
      <div className="field">
        <label htmlFor="plan-until">{ui.planUntilLabel}</label>
        <p className="hint" id="plan-until-hint">
          {ui.planUntilHint}
        </p>
        <select
          id="plan-until"
          aria-describedby="plan-until-hint"
          value={choices.some((row) => row.id === form.planUntil) ? form.planUntil : ""}
          onChange={(event) => api.set("planUntil", event.target.value)}
        >
          <option value="">{ui.planUntilAuto(nameOf(autoStop))}</option>
          {choices.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name.trim() === "" ? words.rows.unnamedIncome : row.name.trim()}
            </option>
          ))}
        </select>
      </div>
      {rule}
    </>
  );
}

export function BillsSection({ form, api, hideHint = false }: SectionProps) {
  return (
    <>
      {hideHint ? null : <p className="hint">{ui.billsHint}</p>}
      <RowList
        rows={form.bills}
        itemName="bill"
        summarise={summariseBill}
        dateOf={(bill) => bill.dueDate}
        isBlank={isBlankBill}
        onAdd={api.addBill}
        onRemove={api.removeBill}
        addLabel={ui.addBill}
        emptyLine={words.rows.billsNone}
        totalLine={billsTotalLine(form.bills)}
        renderFields={(bill) => (
          <>
            <div className="field">
              <label htmlFor={`${bill.id}-name`}>{ui.billName}</label>
              <input
                id={`${bill.id}-name`}
                type="text"
                autoComplete="off"
                value={bill.name}
                onChange={(event) => api.updateBill(bill.id, { name: event.target.value })}
              />
            </div>
            <MoneyField
              label={ui.billAmount}
              value={bill.amount}
              onChange={(value) => api.updateBill(bill.id, { amount: value })}
            />
            <div className="field">
              <label htmlFor={`${bill.id}-due`}>{bill.repeat && bill.repeat !== "once" ? ui.billDueRepeating : ui.billDue}</label>
              <DateHint value={bill.dueDate} />
              <input
                id={`${bill.id}-due`}
                type="date"
                value={bill.dueDate}
                onChange={(event) => api.updateBill(bill.id, { dueDate: event.target.value })}
              />
              <ClearDate value={bill.dueDate} onClear={() => api.updateBill(bill.id, { dueDate: "" })} />
            </div>
            <RepeatField
              id={`${bill.id}-repeat`}
              value={bill.repeat}
              hint={ui.repeatBillHint}
              onChange={(value) => api.updateBill(bill.id, { repeat: value })}
            />
          </>
        )}
      />
    </>
  );
}

export function IncomeSection({ form, api, hideHint = false }: SectionProps) {
  return (
    <>
      {hideHint ? null : <p className="hint">{ui.incomeHint}</p>}
      <RowList
        rows={form.income}
        itemName="item"
        summarise={summariseIncome}
        dateOf={(item) => item.date}
        isBlank={isBlankIncome}
        onAdd={api.addIncome}
        onRemove={api.removeIncome}
        addLabel={ui.addIncome}
        emptyLine={words.rows.incomeNone}
        totalLine={incomeTotalLine(form.income)}
        renderFields={(item) => (
          <>
            <div className="field">
              <label htmlFor={`${item.id}-name`}>{ui.incomeName}</label>
              <input
                id={`${item.id}-name`}
                type="text"
                autoComplete="off"
                value={item.name}
                onChange={(event) => api.updateIncome(item.id, { name: event.target.value })}
              />
            </div>
            <MoneyField
              label={ui.incomeAmount}
              value={item.amount}
              onChange={(value) => api.updateIncome(item.id, { amount: value })}
            />
            <div className="field">
              <label htmlFor={`${item.id}-date`}>{item.repeat && item.repeat !== "once" ? ui.incomeDateRepeating : ui.incomeDate}</label>
              <DateHint value={item.date} />
              <input
                id={`${item.id}-date`}
                type="date"
                value={item.date}
                onChange={(event) => api.updateIncome(item.id, { date: event.target.value })}
              />
              <ClearDate value={item.date} onClear={() => api.updateIncome(item.id, { date: "" })} />
            </div>
            <RepeatField
              id={`${item.id}-repeat`}
              value={item.repeat}
              hint={ui.repeatIncomeHint}
              onChange={(value) => api.updateIncome(item.id, { repeat: value })}
            />
          </>
        )}
      />
    </>
  );
}

export function EssentialsSection({ form, api }: SectionProps) {
  return (
    <>
      <MoneyField
        label={ui.foodLabel}
        hint={ui.foodHint}
        value={form.foodPerWeek}
        onChange={(value) => api.set("foodPerWeek", value)}
      />
      <MoneyField
        label={ui.travelLabel}
        hint={ui.travelHint}
        value={form.travelPerWeek}
        onChange={(value) => api.set("travelPerWeek", value)}
      />
    </>
  );
}

/**
 * Savings: the total kept aside, with Add and Take out so nobody has to work out a new total.
 * The money stays in the everyday account; only the amount kept aside changes.
 */
export function PotSection({ form, api }: SectionProps) {
  const s = words.savings;
  const now = savingsNow(form.buffer);
  const [mode, setMode] = useState<"add" | "take" | "type" | null>(null);
  const [amount, setAmount] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [last, setLast] = useState<{ kind: "add" | "take"; amount: string; before: string } | null>(null);

  // Something that can't be read, or "type a new total": the plain box, as before.
  if (now === null || mode === "type") {
    return (
      <>
        <MoneyField label={ui.bufferLabel} hint={ui.bufferHint} value={form.buffer} onChange={(value) => api.set("buffer", value)} />
        {now !== null ? (
          <button type="button" className="link" onClick={() => setMode(null)}>
            {s.backToButtons}
          </button>
        ) : null}
      </>
    );
  }

  function start(kind: "add" | "take") {
    setMode(kind);
    setAmount("");
    setProblem(null);
    setLast(null);
  }

  function confirm(kind: "add" | "take") {
    const result = changeSavings(form.buffer, amount, kind);
    if (!result.ok) {
      setProblem(result.reason === "more-than-saved" ? s.moreThanSaved(formatMoney(now ?? 0)) : s.cantRead);
      return;
    }
    // Savings are kept separately: only the savings total changes, never the balance or the number.
    setLast({ kind, amount: formatMoney(savingsNow(amount) ?? 0), before: form.buffer });
    api.set("buffer", result.text);
    setMode(null);
    setAmount("");
    setProblem(null);
  }

  const typed = savingsNow(amount);
  const amountText = typed !== null && typed > 0 ? formatMoney(typed) : "";

  return (
    <>
      <p className="hint">{s.intro}</p>
      <div className="savings-card">
        <span className="small">{s.keptAside}</span>
        <strong>{formatMoney(now)}</strong>
      </div>

      {mode === "add" || mode === "take" ? (
        <>
          <MoneyField label={mode === "add" ? s.howMuchAdd : s.howMuchTake} value={amount} onChange={setAmount} />
          {problem ? <p className="gentle small">{problem}</p> : null}
          <div className="buttons">
            <button type="button" onClick={() => confirm(mode)}>
              {mode === "add" ? s.addButton(amountText) : s.takeButton(amountText)}
            </button>
            <button type="button" className="secondary" onClick={() => setMode(null)}>
              {s.cancel}
            </button>
          </div>
          {amountText ? <p className="gentle small">{mode === "add" ? s.addNote(amountText) : s.takeNote(amountText)}</p> : null}
        </>
      ) : (
        <>
          <div className="buttons savings-buttons">
            <button type="button" onClick={() => start("add")}>
              {s.add}
            </button>
            {now > 0 ? (
              <button type="button" className="secondary" onClick={() => start("take")}>
                {s.take}
              </button>
            ) : null}
          </div>
          <p className="small" aria-live="polite">
            {last ? (
              <>
                {last.kind === "add" ? s.added(last.amount) : s.tookOut(last.amount)}{" "}
                <button
                  type="button"
                  className="link"
                  onClick={() => {
                    api.set("buffer", last.before);
                    setLast(null);
                  }}
                >
                  {s.undo}
                </button>
              </>
            ) : null}
          </p>
          <button type="button" className="link" onClick={() => setMode("type")}>
            {s.typeTotal}
          </button>
        </>
      )}
    </>
  );
}

export function HolidaysSection({ form, api }: SectionProps) {
  const region = regionOf(form);
  const until = `the end of ${BUILT_IN_LAST_DAY.slice(0, 4)}`;
  return (
    <>
      <fieldset className="choice-group">
        <legend>{ui.holidaysRegionLabel}</legend>
        <p className="hint">{ui.holidaysRegionHint}</p>
        {HOLIDAY_REGIONS.map((choice) => (
          <label key={choice} className="choice">
            <input
              type="radio"
              name="holiday-region"
              value={choice}
              checked={region === choice}
              onChange={() => api.set("bankHolidayRegion", choice)}
            />
            <span>{ui.holidaysRegionOptions[choice]}</span>
          </label>
        ))}
        {region === "own" ? null : <p className="hint">{ui.holidaysCovers(until)}</p>}
      </fieldset>
      <div className="field">
        <label htmlFor="bank-holidays">{region === "own" ? ui.holidaysHintOwn : ui.holidaysHint}</label>
        <textarea
          id="bank-holidays"
          rows={4}
          value={form.bankHolidays}
          onChange={(event) => api.set("bankHolidays", event.target.value)}
        />
      </div>
    </>
  );
}
