import { useEffect, useState } from "react";
import { MoneyField } from "../components/MoneyField";
import { isNativeApp } from "../platform";
import { RowList } from "../components/RowList";
import { words } from "../content/words";
import { BUILT_IN_LAST_DAY, HOLIDAY_REGIONS } from "../data/bankHolidays";
import { describeForm, paydayRuleQuestion, regionOf } from "../logic/form";
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

interface PaydayProps extends SectionProps {
  /**
   * Setup only: the weekend and bank holiday question becomes one line with a Change link,
   * starting from "the working day before", so the first question stays light.
   */
  compactRule?: boolean;
  /** Menu page only: a button to empty the main money in one go (name, date and how often). */
  removable?: boolean;
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

export function PaydaySection({ form, today, api, compactRule = false, removable = false }: PaydayProps) {
  const hasMainMoney = form.paydayName.trim() !== "" || form.paydayDate !== "" || form.paydayRepeat !== "once";
  const question = paydayRuleQuestion(form, today);
  const [changing, setChanging] = useState(false);
  const needsDefault = compactRule && question !== null && form.paydayRule === "";
  useEffect(() => {
    if (needsDefault) api.set("paydayRule", "working-day-before");
  }, [needsDefault, api]);
  const shortRule = compactRule && !changing && form.paydayRule !== "";
  const repeat: Repeat = REPEATS.includes(form.paydayRepeat) ? form.paydayRepeat : "once";
  // Menu page only: once the date is in, the main money folds into one line, like bills and other money.
  const [open, setOpen] = useState(form.paydayDate === "");
  if (removable && !open && form.paydayDate !== "") {
    const summary = describeForm({ ...form, paydayName: "" }, today).payday;
    return (
      <ul className="menu-list">
        <li>
          <button type="button" className="menu-item" aria-expanded={false} onClick={() => setOpen(true)}>
            <span className="menu-title">{form.paydayName.trim() === "" ? ui.mainMoneyTitle : form.paydayName.trim()}</span>
            <span className="menu-sub">{summary}</span>
            <span className="visually-hidden">{`, ${ui.change}`}</span>
          </button>
        </li>
      </ul>
    );
  }
  const fields = (
    <>
      <div className="field">
        <label htmlFor="payday-name">{ui.paydayNameLabel}</label>
        <p className="hint" id="payday-name-hint">
          {ui.paydayNameHint}
        </p>
        <input
          id="payday-name"
          aria-describedby="payday-name-hint"
          type="text"
          autoComplete="off"
          maxLength={60}
          value={form.paydayName}
          onChange={(event) => api.set("paydayName", event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="payday-date">{ui.paydayDateLabel}</label>
        <p className="hint" id="payday-date-hint">
          {ui.paydayDateHint}
        </p>
        <DateHint value={form.paydayDate} />
        <input
          id="payday-date"
          aria-describedby="payday-date-hint"
          type="date"
          value={form.paydayDate}
          onChange={(event) => api.set("paydayDate", event.target.value)}
        />
        <ClearDate value={form.paydayDate} onClear={() => api.set("paydayDate", "")} />
      </div>
      <div className="field">
        <label htmlFor="payday-repeat">{ui.paydayRepeatLabel}</label>
        {repeat === "once" ? null : <p className="hint">{ui.paydayRepeatHint}</p>}
        <select
          id="payday-repeat"
          value={repeat}
          onChange={(event) => api.set("paydayRepeat", event.target.value as Repeat)}
        >
          {REPEATS.map((choice) => (
            <option key={choice} value={choice}>
              {ui.paydayRepeatOptions[choice]}
            </option>
          ))}
        </select>
      </div>
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
  if (!removable) return fields;
  return (
    <div className="row-editor main-money-editor">
      {fields}
      <div className="buttons">
        {form.paydayDate !== "" ? (
          <button type="button" onClick={() => setOpen(false)}>
            {words.rows.done}
          </button>
        ) : null}
        {hasMainMoney ? (
          <button
            type="button"
            className="secondary"
            onClick={() => {
              api.set("paydayName", "");
              api.set("paydayDate", "");
              api.set("paydayRepeat", "once");
              api.set("paydayRule", "");
            }}
          >
            {ui.removeMainMoney}
          </button>
        ) : null}
      </div>
    </div>
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

export function PotSection({ form, api }: SectionProps) {
  return (
    <MoneyField
      label={ui.bufferLabel}
      hint={ui.bufferHint}
      value={form.buffer}
      onChange={(value) => api.set("buffer", value)}
    />
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
