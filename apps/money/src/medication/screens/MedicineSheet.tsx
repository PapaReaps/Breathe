import { useState } from "react";
import { words } from "../content/words";
import { checkDraft, countFromAmount, dayKey, LIMITS, type DraftProblem, type Medicine } from "../logic/medicines";
import Sheet from "./Sheet";

const form = words.form;

interface Props {
  /** The medicine to change, or null to add a new one. */
  medicine: Medicine | null;
  newId: () => string;
  onSave: (medicine: Medicine) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
  /** Opened from the menu: Back goes there. */
  onBack?: () => void;
}

/** Add a medicine, or change one. Its name, an optional amount, and the times each day. */
export default function MedicineSheet({ medicine, newId, onSave, onRemove, onClose, onBack }: Props) {
  const [name, setName] = useState(medicine?.name ?? "");
  const [amount, setAmount] = useState(medicine?.amount ?? "");
  const [times, setTimes] = useState<string[]>(medicine?.times.length ? [...medicine.times] : ["08:00"]);
  const [left, setLeft] = useState(medicine?.stock ? String(medicine.stock.left) : "");
  const [perDose, setPerDose] = useState(medicine?.stock ? String(medicine.stock.perDose) : "1");
  // Until the person changes it themselves, "How many come off each time?" follows "How much"
  // ("2 tablets" fills in 2). A saved count is theirs already, so it's left alone.
  const [perDoseTouched, setPerDoseTouched] = useState(medicine?.stock != null);
  const [problems, setProblems] = useState<DraftProblem[]>([]);
  const [askRemove, setAskRemove] = useState(false);

  const has = (p: DraftProblem) => problems.includes(p);
  const nameProblem = has("name-missing") ? "name-missing" : has("name-long") ? "name-long" : null;
  const timeProblem = has("time-missing") ? "time-missing" : has("time-odd") ? "time-odd" : has("too-many-times") ? "too-many-times" : null;

  function save() {
    const kept = medicine ? { added: medicine.added, stock: medicine.stock } : { added: dayKey(new Date()), stock: null };
    const result = checkDraft({ name, amount, times, left, perDose }, medicine?.id ?? newId(), kept);
    if (!result.ok) {
      setProblems(result.problems);
      // Take the person straight to the first thing that needs a look.
      const first = result.problems[0]!;
      const id = first.startsWith("name")
        ? "med-name"
        : first === "amount-long"
          ? "med-amount"
          : first === "left-odd"
            ? "med-left"
            : first === "per-dose-odd"
              ? "med-per-dose"
              : "med-time-0";
      requestAnimationFrame(() => document.getElementById(id)?.focus());
      return;
    }
    onSave(result.medicine);
  }

  return (
    <Sheet title={medicine ? form.editTitle : form.addTitle} onClose={onClose} onBack={onBack}>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <div className="field">
          <label htmlFor="med-name">{form.name}</label>
          <p className="hint" id="med-name-hint">
            {form.nameHint}
          </p>
          <input
            id="med-name"
            value={name}
            maxLength={LIMITS.name + 20}
            autoComplete="off"
            aria-describedby={nameProblem ? "med-name-hint med-name-problem" : "med-name-hint"}
            aria-invalid={nameProblem ? true : undefined}
            onChange={(event) => setName(event.target.value)}
          />
          {nameProblem ? (
            <p className="problem" id="med-name-problem">
              {form.problems[nameProblem]}
            </p>
          ) : null}
        </div>

        <div className="field">
          <label htmlFor="med-amount">{form.amount}</label>
          <p className="hint" id="med-amount-hint">
            {form.amountHint}
          </p>
          <input
            id="med-amount"
            value={amount}
            maxLength={LIMITS.amount + 20}
            autoComplete="off"
            aria-describedby="med-amount-hint"
            aria-invalid={has("amount-long") ? true : undefined}
            onChange={(event) => {
              setAmount(event.target.value);
              if (!perDoseTouched) setPerDose(String(countFromAmount(event.target.value) ?? 1));
            }}
          />
          {has("amount-long") ? <p className="problem">{form.problems["amount-long"]}</p> : null}
        </div>

        <fieldset className="field" style={{ border: "none", padding: 0, margin: "0 0 1rem" }}>
          <legend style={{ fontWeight: 600, padding: 0 }}>{form.times}</legend>
          <p className="hint">{form.timesHint}</p>
          {times.map((time, i) => (
            <div className="time-row" key={i}>
              <label className="visually-hidden" htmlFor={`med-time-${i}`} style={{ position: "absolute", left: "-9999px" }}>
                {form.timeLabel(i + 1)}
              </label>
              <input
                id={`med-time-${i}`}
                type="time"
                value={time}
                aria-invalid={timeProblem ? true : undefined}
                onChange={(event) => setTimes(times.map((t, j) => (j === i ? event.target.value : t)))}
              />
              {times.length > 1 ? (
                <button type="button" className="secondary" aria-label={form.removeTimeLabel(i + 1)} onClick={() => setTimes(times.filter((_, j) => j !== i))}>
                  {form.removeTime}
                </button>
              ) : null}
            </div>
          ))}
          {timeProblem ? <p className="problem">{form.problems[timeProblem]}</p> : null}
          {times.length < LIMITS.times ? (
            <button type="button" className="link" onClick={() => setTimes([...times, ""])}>
              {form.addTime}
            </button>
          ) : null}
        </fieldset>

        <fieldset className="field" style={{ border: "none", padding: 0, margin: "0 0 1rem" }}>
          <legend style={{ fontWeight: 600, padding: 0 }}>{form.countTitle}</legend>
          <p className="hint">{form.countHint}</p>
          <div className="count-row">
            <div>
              <label htmlFor="med-left">{form.left}</label>
              <input
                id="med-left"
                inputMode="numeric"
                value={left}
                autoComplete="off"
                aria-invalid={has("left-odd") ? true : undefined}
                onChange={(event) => setLeft(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="med-per-dose">{form.perDose}</label>
              <input
                id="med-per-dose"
                inputMode="numeric"
                value={perDose}
                autoComplete="off"
                aria-invalid={has("per-dose-odd") ? true : undefined}
                onChange={(event) => {
                  setPerDose(event.target.value);
                  setPerDoseTouched(true);
                }}
              />
            </div>
          </div>
          {has("left-odd") ? <p className="problem">{form.problems["left-odd"]}</p> : null}
          {has("per-dose-odd") ? <p className="problem">{form.problems["per-dose-odd"]}</p> : null}
        </fieldset>

        <div className="sheet-buttons">
          <button type="submit">{form.save}</button>
          <button type="button" className="secondary" onClick={onClose}>
            {form.cancel}
          </button>
        </div>
      </form>

      {medicine ? (
        <div className="remove-line">
          {askRemove ? (
            <>
              <p>{form.removeAsk(medicine.name)}</p>
              <div className="sheet-buttons">
                <button type="button" onClick={() => onRemove(medicine.id)}>
                  {form.removeYes}
                </button>
                <button type="button" className="secondary" onClick={() => setAskRemove(false)}>
                  {form.removeNo}
                </button>
              </div>
            </>
          ) : (
            <button type="button" className="link" onClick={() => setAskRemove(true)}>
              {form.remove}
            </button>
          )}
        </div>
      ) : null}
    </Sheet>
  );
}
