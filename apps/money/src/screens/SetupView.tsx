import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { MoneyField } from "../components/MoneyField";
import { words } from "../content/words";
import type { BuildResult, FormState } from "../logic/form";
import { SETUP_STEPS, firstSetupStep } from "../logic/setup";
import type { SetupStep } from "../logic/setup";
import { BillsSection, IncomeSection, PlanUntilSection } from "./FormSections";
import type { FormApi } from "./screenTypes";

const text = words.setup;
const ui = words.ui;

interface SetupViewProps {
  form: FormState;
  today: string;
  built: BuildResult;
  api: FormApi;
  onClose: () => void;
}

/**
 * A gentle walk-through: one question at a time, every one skippable.
 * It uses the same boxes as the Menu pages, and everything is saved as it goes,
 * so stopping halfway loses nothing.
 */
export function SetupView({ form, today, built, api, onClose }: SetupViewProps) {
  const [index, setIndex] = useState(() => firstSetupStep(form));
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  // After the first screen, let screen readers hear each new question.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [index]);

  const total = SETUP_STEPS.length;

  if (index >= total) {
    return (
      <>
        <h3 tabIndex={-1} ref={headingRef}>
          {text.doneTitle}
        </h3>
        {built.status === "ready" ? (
          <p>{text.doneReady}</p>
        ) : (
          <div className="gentle">
            <p>{text.doneNeeds}</p>
            <ul className="plain-list">
              {built.messages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        )}
        <p className="small">{text.changeLater}</p>
        <div className="buttons">
          <button type="button" onClick={onClose}>
            {built.status === "ready" ? text.seeNumber : text.finishLater}
          </button>
          <button type="button" className="secondary" onClick={() => setIndex(total - 1)}>
            {text.back}
          </button>
        </div>
      </>
    );
  }

  const step: SetupStep = SETUP_STEPS[index] ?? "balance";
  const words2 = text[step];
  const goNext = () => setIndex((current) => current + 1);

  function submit(event: FormEvent) {
    event.preventDefault();
    goNext();
  }

  return (
    <form onSubmit={submit} noValidate>
      <p className="small" aria-live="polite">
        {text.progress(index + 1, total)}
      </p>
      <h3 tabIndex={-1} ref={headingRef}>
        {words2.question}
      </h3>
      <p className="hint">{words2.intro}</p>

      {step === "balance" ? (
        <MoneyField
          label={text.balance.label}
          hint={ui.balanceHint}
          value={form.balance}
          onChange={(value) => api.set("balance", value)}
          allowNegative
        />
      ) : null}
      {step === "income" ? (
        <>
          <IncomeSection form={form} today={today} api={api} hideHint />
          <PlanUntilSection form={form} today={today} api={api} compactRule />
        </>
      ) : null}
      {step === "bills" ? <BillsSection form={form} today={today} api={api} hideHint /> : null}
      {step === "food" ? (
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
      ) : null}
      {step === "pot" ? (
        <MoneyField
          label={ui.bufferLabel}
          hint={ui.bufferHint}
          value={form.buffer}
          onChange={(value) => api.set("buffer", value)}
        />
      ) : null}

      <div className="buttons">
        {index > 0 ? (
          <button type="button" className="secondary" onClick={() => setIndex(index - 1)}>
            {text.back}
          </button>
        ) : null}
        {/* One button: "Next" once something is filled in, otherwise it says it's fine to skip. */}
        <button type="submit">
          {stepFilled(step, form) ? text.next : step === "bills" || step === "income" ? text.nothingToAdd : text.skip}
        </button>
      </div>
    </form>
  );
}

/** Has anything been typed for this question yet? */
function stepFilled(step: SetupStep, form: FormState): boolean {
  const typed = (value: string) => value.trim() !== "";
  switch (step) {
    case "income":
      return form.income.some((row) => typed(row.name) || typed(row.amount) || row.date !== "");
    case "balance":
      return typed(form.balance);
    case "bills":
      return form.bills.some((row) => typed(row.name) || typed(row.amount) || row.dueDate !== "");
    case "food":
      return typed(form.foodPerWeek) || typed(form.travelPerWeek);
    case "pot":
      return typed(form.buffer);
  }
}
