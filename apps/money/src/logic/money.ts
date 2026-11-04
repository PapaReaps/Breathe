import type { Pence } from "./types";

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
  let t = text.replace(/£/g, "").trim();

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

/** 123456 becomes "£1,234.56". Negative amounts get a proper minus sign. */
export function formatMoney(pence: Pence): string {
  const negative = pence < 0;
  const absolute = Math.abs(pence);
  const pounds = Math.floor(absolute / 100);
  const rest = absolute % 100;
  const poundsText = String(pounds).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "−" : ""}£${poundsText}.${String(rest).padStart(2, "0")}`;
}
