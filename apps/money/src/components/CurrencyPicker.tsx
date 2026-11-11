import { useState } from "react";
import { words } from "../content/words";
import { CURRENCIES, MAIN_CURRENCIES } from "../logic/currency";
import type { CurrencyCode } from "../logic/currency";

const text = words.currency;

/** The sign for a currency, in the phone's style ("£", "€", "kr"). */
function symbolOf(code: CurrencyCode): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: code, currencyDisplay: "narrowSymbol" })
      .formatToParts(1)
      .find((part) => part.type === "currency")?.value ?? code;
  } catch {
    return code;
  }
}

/**
 * Choosing the money (v0.35.0): pound, euro and US dollar first, the rest in a list
 * under "More currencies". Only the symbol changes: nothing is converted.
 */
export function CurrencyPicker({ value, onChange, name }: { value: CurrencyCode; onChange: (code: CurrencyCode) => void; name: string }) {
  const isMain = MAIN_CURRENCIES.includes(value);
  const [more, setMore] = useState(!isMain);
  const others = CURRENCIES.filter((code) => !MAIN_CURRENCIES.includes(code));

  return (
    <div className="currency-pick">
      <div role="radiogroup" aria-label={text.title}>
        {MAIN_CURRENCIES.map((code) => (
          <label key={code} className="choice currency-row">
            <input type="radio" name={name} value={code} checked={value === code} onChange={() => onChange(code)} />
            <span className="currency-sign" aria-hidden="true">
              {symbolOf(code)}
            </span>
            <span>{text.names[code]}</span>
          </label>
        ))}
      </div>
      {more ? (
        <label className="field currency-more">
          <span>{text.moreLabel}</span>
          <select
            value={isMain ? "" : value}
            onChange={(event) => {
              if (event.target.value !== "") onChange(event.target.value as CurrencyCode);
            }}
          >
            <option value="">{text.choose}</option>
            {others.map((code) => (
              <option key={code} value={code}>
                {`${symbolOf(code)}  ${text.names[code]} (${code})`}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <button type="button" className="link currency-more-link" onClick={() => setMore(true)}>
          {text.more}
        </button>
      )}
    </div>
  );
}
