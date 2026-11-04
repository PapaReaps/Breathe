import { MoneyField } from "../components/MoneyField";
import { RowList } from "../components/RowList";
import { words } from "../content/words";
import { nonWorkingDayPhrase, paydayIsNonWorkingDay } from "../logic/form";
import type { FormState } from "../logic/form";
import { billsTotalLine, incomeTotalLine, isBlankBill, isBlankIncome, summariseBill, summariseIncome } from "../logic/rows";
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

export function AccountSection({ form, today, api }: SectionProps) {
  return (
    <>
      <MoneyField
        label={ui.balanceLabel}
        hint={ui.balanceHint}
        value={form.balance}
        onChange={(value) => api.set("balance", value)}
        allowNegative
      />
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
    </>
  );
}

export function PaydaySection({ form, api }: SectionProps) {
  const askRule = paydayIsNonWorkingDay(form.paydayDate, form.bankHolidays);
  return (
    <>
      <div className="field">
        <label htmlFor="payday-date">{ui.paydayDateLabel}</label>
        <input
          id="payday-date"
          type="date"
          value={form.paydayDate}
          onChange={(event) => api.set("paydayDate", event.target.value)}
        />
      </div>
      {askRule ? (
        <div className="field">
          <label htmlFor="payday-rule">{words.askPaydayRule(nonWorkingDayPhrase(form.paydayDate))}</label>
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
              <label htmlFor={`${bill.id}-due`}>{ui.billDue}</label>
              <input
                id={`${bill.id}-due`}
                type="date"
                value={bill.dueDate}
                onChange={(event) => api.updateBill(bill.id, { dueDate: event.target.value })}
              />
            </div>
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
              <label htmlFor={`${item.id}-date`}>{ui.incomeDate}</label>
              <input
                id={`${item.id}-date`}
                type="date"
                value={item.date}
                onChange={(event) => api.updateIncome(item.id, { date: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor={`${item.id}-reliability`}>How sure are you?</label>
              <select
                id={`${item.id}-reliability`}
                value={item.reliability}
                onChange={(event) =>
                  api.updateIncome(item.id, {
                    reliability: event.target.value === "uncertain" ? "uncertain" : "reliable",
                  })
                }
              >
                <option value="reliable">{ui.incomeSure}</option>
                <option value="uncertain">{ui.incomeMaybe}</option>
              </select>
            </div>
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
  return (
    <div className="field">
      <label htmlFor="bank-holidays">{ui.holidaysHint}</label>
      <textarea
        id="bank-holidays"
        rows={4}
        value={form.bankHolidays}
        onChange={(event) => api.set("bankHolidays", event.target.value)}
      />
    </div>
  );
}
