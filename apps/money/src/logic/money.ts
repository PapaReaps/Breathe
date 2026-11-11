import type { Pence } from "./types";
import type { CurrencyCode } from "./currency";

/*
 * Turning what people type ("12.50", "£12.50", "12,50") into whole pence,
 * and whole pence back into readable money ("£12.50").
 * Done with text, never with decimals, so there are no rounding errors.
 */

export type MoneyProblem =
  | "not-a-number"
  | "too-many-decimals"
  | "negative-not-allowed"
  | "too-large";

export type MoneyParse =
  | { ok: true; pence: Pence }
  | { ok: false; reason: MoneyProblem };

/** £1,000,000,000. Far beyond anything real, and safely inside what the maths can hold. */
const MAX_PENCE = 100_000_000_000;

function fail(reason: MoneyProblem): MoneyParse {
  return { ok: false, reason };
}

export function parseMoney(text: string, options: { allowNegative?: boolean } = {}): MoneyParse {
  // Spaces are only ignored around the number, never inside it:
  // "12 50" must not quietly become £1,250.
  // Any currency sign is ignored, before or after the number ("€12", "12 kr", "R$ 5").
  let t = text.replace(/[£€$₹₦₱]/g, "").trim();
  t = t.replace(/^(?:R|Kč|kr|zł|CHF|Fr\.?|GBP|EUR|USD|CAD|AUD|NZD|CHF|SEK|NOK|DKK|PLN|CZK|INR|ZAR|SGD|HKD|MXN|BRL|PHP|NGN)\s*/i, "").replace(/\s*(?:R|Kč|kr|zł|CHF|Fr\.?|GBP|EUR|USD|CAD|AUD|NZD|CHF|SEK|NOK|DKK|PLN|CZK|INR|ZAR|SGD|HKD|MXN|BRL|PHP|NGN)$/i, "").trim();

  let negative = false;
  if (t.startsWith("-") || t.startsWith("−")) {
    negative = true;
    t = t.slice(1).trim();
  }
  if (t === "") return fail("not-a-number");

  // 1,234.56 (commas as thousands) or 12,50 (a comma used as the decimal point).
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(t)) {
    t = t.replace(/,/g, "");
  } else if (/^\d+,\d{1,2}$/.test(t)) {
    t = t.replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+,\d{1,2}$/.test(t)) {
    // 1.234,56: points between thousands and a comma before the cents, as in much of Europe.
    t = t.replace(/\./g, "").replace(",", ".");
  }

  if (!/^(\d+\.?\d*|\.\d+)$/.test(t)) return fail("not-a-number");

  const [whole = "", fraction = ""] = t.split(".");
  if (fraction.length > 2) return fail("too-many-decimals");
  if (whole.length > 11) return fail("too-large");

  const pence = Number(whole || "0") * 100 + Number((fraction + "00").slice(0, 2));
  if (!Number.isSafeInteger(pence) || pence > MAX_PENCE) return fail("too-large");

  if (negative && pence !== 0) {
    if (!options.allowNegative) return fail("negative-not-allowed");
    return { ok: true, pence: -pence };
  }
  return { ok: true, pence };
}

/*
 * How amounts are written: the chosen currency, in the phone's own style.
 * Pound in the UK style until the app says otherwise, so nothing changes for anyone already using it.
 */
let style: { currency: CurrencyCode; locale: string } = { currency: "GBP", locale: "en-GB" };
let writer: Intl.NumberFormat | null = null;

function makeWriter(currency: CurrencyCode, locale: string): Intl.NumberFormat {
  const options: Intl.NumberFormatOptions = { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 };
  try {
    return new Intl.NumberFormat(locale, { ...options, currencyDisplay: "narrowSymbol" });
  } catch {
    return new Intl.NumberFormat(locale, options);
  }
}

/** Called by the app when it opens, and whenever the currency changes. */
export function setMoneyStyle(currency: CurrencyCode, locale: string): void {
  if (style.currency === currency && style.locale === locale && writer !== null) return;
  style = { currency, locale };
  try {
    writer = makeWriter(currency, locale);
  } catch {
    writer = makeWriter(currency, "en-GB");
  }
}

function currentWriter(): Intl.NumberFormat {
  if (writer === null) writer = makeWriter(style.currency, style.locale);
  return writer;
}

/** The sign for the chosen currency, like "£", "€" or "kr". */
export function moneySymbol(): string {
  return currentWriter().formatToParts(1).find((part) => part.type === "currency")?.value ?? style.currency;
}

/** 123456 becomes "£1,234.56" (or "1.234,56 €" on a German phone using euros). Negative amounts get a proper minus sign. */
export function formatMoney(pence: Pence): string {
  const negative = pence < 0;
  const absolute = Math.abs(pence);
  // Whole pence divided by 100 is exact enough to show to 2 decimal places at any real amount.
  return `${negative ? "−" : ""}${currentWriter().format(absolute / 100)}`;
}
