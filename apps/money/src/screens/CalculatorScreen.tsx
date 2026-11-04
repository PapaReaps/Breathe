import { useMemo, useState } from "react";
import { MoneyField } from "../components/MoneyField";
import {
  describeLine,
  describeWarning,
  headlineFor,
  paydayLine,
  questionFor,
  words,
} from "../content/words";
import { InvalidInputError } from "../logic/errors";
import {
  buildInput,
  emptyForm,
  newBillRow,
  newIncomeRow,
  nonWorkingDayPhrase,
  paydayIsNonWorkingDay,
} from "../logic/form";
import type { BillRow, FormState, IncomeRow } from "../logic/form";
import { calculateSafeToSpend } from "../logic/safeToSpend";
import { localToday } from "../logic/today";
import type { CalculatorResult, PaydayRule, Warning } from "../logic/types";

type Outcome = { ok: true; result: CalculatorResult } | { ok: false };
type NeedsAnswer = Extract<Warning, { kind: "needs-answer" }>;

const ui = words.ui;

export default function CalculatorScreen() {
  const [today] = useState(localToday);
  const [form, setForm] = useState<FormState>(emptyForm);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const updateBill = (id: string, patch: Partial<BillRow>) =>
    setForm((current) => ({
      ...current,
      bills: current.bills.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    }));

  const updateIncome = (id: string, patch: Partial<IncomeRow>) =>
    setForm((current) => ({
      ...current,
      income: current.income.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    }));

  const answer = (id: string, value: boolean) =>
    setForm((current) => ({ ...current, answers: { ...current.answers, [id]: value } }));

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

  const askRule = paydayIsNonWorkingDay(form.paydayDate, form.bankHolidays);

  return (
    <main className="page">
      <header>
        <h1>Breathe Money</h1>
        <p className="lead">{words.pageIntro}</p>
      </header>

      <ResultCard
        built={built}
        outcome={outcome}
        hasAnswers={Object.keys(form.answers).length > 0}
        onAnswer={answer}
        onClearAnswers={() => set("answers", {})}
      />

      <section className="card" aria-labelledby="account-title">
        <h2 id="account-title">{ui.accountTitle}</h2>
        <MoneyField
          label={ui.balanceLabel}
          hint={ui.balanceHint}
          value={form.balance}
          onChange={(value) => set("balance", value)}
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
            onChange={(event) => set("balanceDate", event.target.value)}
          />
        </div>
      </section>

      <section className="card" aria-labelledby="payday-title">
        <h2 id="payday-title">{ui.paydayTitle}</h2>
        <div className="field">
          <label htmlFor="payday-date">{ui.paydayDateLabel}</label>
          <input
            id="payday-date"
            type="date"
            value={form.paydayDate}
            onChange={(event) => set("paydayDate", event.target.value)}
          />
        </div>
        {askRule ? (
          <div className="field">
            <label htmlFor="payday-rule">
              {`Your payday falls on ${nonWorkingDayPhrase(form.paydayDate)}. When do you usually get paid then?`}
            </label>
            <select
              id="payday-rule"
              value={form.paydayRule}
              onChange={(event) => set("paydayRule", event.target.value as PaydayRule | "")}
            >
              {Object.entries(ui.paydayRuleOptions).map(([value, text]) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </section>

      <section className="card" aria-labelledby="bills-title">
        <h2 id="bills-title">{ui.billsTitle}</h2>
        <p className="hint">{ui.billsHint}</p>
        {form.bills.map((bill, index) => (
          <div className="row" key={bill.id} role="group" aria-label={`Bill ${index + 1}`}>
            <div className="field">
              <label htmlFor={`${bill.id}-name`}>{ui.billName}</label>
              <input
                id={`${bill.id}-name`}
                type="text"
                autoComplete="off"
                value={bill.name}
                onChange={(event) => updateBill(bill.id, { name: event.target.value })}
              />
            </div>
            <MoneyField
              label={ui.billAmount}
              value={bill.amount}
              onChange={(value) => updateBill(bill.id, { amount: value })}
            />
            <div className="field">
              <label htmlFor={`${bill.id}-due`}>{ui.billDue}</label>
              <input
                id={`${bill.id}-due`}
                type="date"
                value={bill.dueDate}
                onChange={(event) => updateBill(bill.id, { dueDate: event.target.value })}
              />
            </div>
            <button
              type="button"
              className="secondary"
              onClick={() =>
                set(
                  "bills",
                  form.bills.filter((row) => row.id !== bill.id),
                )
              }
            >
              {ui.remove}
              <span className="visually-hidden">{` bill ${index + 1}`}</span>
            </button>
          </div>
        ))}
        <button type="button" onClick={() => set("bills", [...form.bills, newBillRow()])}>
          {ui.addBill}
        </button>
      </section>

      <section className="card" aria-labelledby="income-title">
        <h2 id="income-title">{ui.incomeTitle}</h2>
        <p className="hint">{ui.incomeHint}</p>
        {form.income.map((item, index) => (
          <div className="row" key={item.id} role="group" aria-label={`Money coming in ${index + 1}`}>
            <div className="field">
              <label htmlFor={`${item.id}-name`}>{ui.incomeName}</label>
              <input
                id={`${item.id}-name`}
                type="text"
                autoComplete="off"
                value={item.name}
                onChange={(event) => updateIncome(item.id, { name: event.target.value })}
              />
            </div>
            <MoneyField
              label={ui.incomeAmount}
              value={item.amount}
              onChange={(value) => updateIncome(item.id, { amount: value })}
            />
            <div className="field">
              <label htmlFor={`${item.id}-date`}>{ui.incomeDate}</label>
              <input
                id={`${item.id}-date`}
                type="date"
                value={item.date}
                onChange={(event) => updateIncome(item.id, { date: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor={`${item.id}-reliability`}>How sure are you?</label>
              <select
                id={`${item.id}-reliability`}
                value={item.reliability}
                onChange={(event) =>
                  updateIncome(item.id, {
                    reliability: event.target.value === "uncertain" ? "uncertain" : "reliable",
                  })
                }
              >
                <option value="reliable">{ui.incomeSure}</option>
                <option value="uncertain">{ui.incomeMaybe}</option>
              </select>
            </div>
            <button
              type="button"
              className="secondary"
              onClick={() =>
                set(
                  "income",
                  form.income.filter((row) => row.id !== item.id),
                )
              }
            >
              {ui.remove}
              <span className="visually-hidden">{` money coming in ${index + 1}`}</span>
            </button>
          </div>
        ))}
        <button type="button" onClick={() => set("income", [...form.income, newIncomeRow()])}>
          {ui.addIncome}
        </button>
      </section>

      <section className="card" aria-labelledby="essentials-title">
        <h2 id="essentials-title">{ui.essentialsTitle}</h2>
        <MoneyField
          label={ui.foodLabel}
          value={form.foodPerDay}
          onChange={(value) => set("foodPerDay", value)}
        />
        <MoneyField
          label={ui.travelLabel}
          value={form.travel}
          onChange={(value) => set("travel", value)}
        />
        <MoneyField
          label={ui.bufferLabel}
          hint={ui.bufferHint}
          value={form.buffer}
          onChange={(value) => set("buffer", value)}
        />
      </section>

      <details className="card">
        <summary>{ui.holidaysSummary}</summary>
        <div className="field">
          <label htmlFor="bank-holidays">{ui.holidaysHint}</label>
          <textarea
            id="bank-holidays"
            rows={3}
            value={form.bankHolidays}
            onChange={(event) => set("bankHolidays", event.target.value)}
          />
        </div>
      </details>

      <footer>
        <p className="small">{ui.footerNote}</p>
        <p className="small">{`Breathe will never be about making money. It will always be about helping people.`}</p>
      </footer>
    </main>
  );
}

interface ResultCardProps {
  built: ReturnType<typeof buildInput>;
  outcome: Outcome | null;
  hasAnswers: boolean;
  onAnswer: (id: string, value: boolean) => void;
  onClearAnswers: () => void;
}

function ResultCard({ built, outcome, hasAnswers, onAnswer, onClearAnswers }: ResultCardProps) {
  if (built.status === "needs-more") {
    return (
      <section className="card result" aria-live="polite" aria-labelledby="result-title">
        <h2 id="result-title">{words.waitingTitle}</h2>
        <ul className="plain-list">
          {built.messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      </section>
    );
  }

  if (outcome === null || !outcome.ok) {
    return (
      <section className="card result" aria-live="polite" aria-labelledby="result-title">
        <h2 id="result-title">{words.waitingTitle}</h2>
        <p>{words.cannotCalculate}</p>
      </section>
    );
  }

  const { result } = outcome;
  const head = headlineFor(result);
  const questions = result.warnings.filter((w): w is NeedsAnswer => w.kind === "needs-answer");
  const notes = result.warnings
    .map(describeWarning)
    .filter((text): text is string => text !== null);

  return (
    <section className="card result" aria-live="polite" aria-labelledby="result-title">
      <h2 id="result-title">{head.title}</h2>
      {head.amount !== null ? <p className="big-number">{head.amount}</p> : null}
      <p>{head.message}</p>
      {result.safeToSpend !== null ? (
        <p className="small">{paydayLine(result.paydayDate, result.daysUntilPayday)}</p>
      ) : null}

      {notes.length > 0 ? (
        <ul className="plain-list notes">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}

      {questions.length > 0 ? (
        <div className="question" role="group" aria-labelledby="question-title">
          <h3 id="question-title">{words.ui.questionTitle}</h3>
          {questions.map((question) => (
            <div key={question.id} className="question-item">
              <p>{questionFor(question)}</p>
              <div className="buttons">
                <button type="button" onClick={() => onAnswer(question.id, true)}>
                  {words.ui.yes}
                </button>
                <button type="button" className="secondary" onClick={() => onAnswer(question.id, false)}>
                  {words.ui.no}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {hasAnswers ? (
        <button type="button" className="link" onClick={onClearAnswers}>
          {words.ui.clearAnswers}
        </button>
      ) : null}

      {result.lines.length > 0 ? (
        <div className="breakdown">
          <h3>{words.ui.breakdownTitle}</h3>
          <ul className="plain-list">
            {result.lines.map((line, index) => {
              const described = describeLine(line);
              return (
                <li key={`${line.kind}-${line.id ?? index}`}>
                  <span>{described.label}</span>
                  <span className="amount">{described.amountText}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
