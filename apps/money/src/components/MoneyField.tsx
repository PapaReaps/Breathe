import { useId } from "react";
import { moneyProblemMessage } from "../content/words";
import { parseMoney } from "../logic/money";

interface MoneyFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  allowNegative?: boolean;
}

/** A box for typing an amount. It explains kindly, right underneath, if it can't read it yet. */
export function MoneyField({ label, value, onChange, hint, allowNegative = false }: MoneyFieldProps) {
  const id = useId();
  const parsed = value.trim() === "" ? null : parseMoney(value, { allowNegative });
  const problem = parsed !== null && !parsed.ok ? moneyProblemMessage(parsed.reason) : null;

  const describedBy = [hint ? `${id}-hint` : "", problem ? `${id}-problem` : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {hint ? (
        <p className="hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      <input
        id={id}
        type="text"
        // The number keypad on a phone has no minus sign, so use the full keyboard when one is needed.
        inputMode={allowNegative ? "text" : "decimal"}
        autoComplete="off"
        placeholder="e.g. 12.50"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={problem ? true : undefined}
        aria-describedby={describedBy || undefined}
      />
      {problem ? (
        <p className="problem" id={`${id}-problem`}>
          {problem}
        </p>
      ) : null}
    </div>
  );
}
