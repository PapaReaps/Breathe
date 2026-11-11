/*
 * Currencies (v0.35.0). Changing the currency only changes the symbol and how amounts
 * are written. Nothing is converted and nothing is looked up online. Every currency here
 * uses 100 smaller units (like pence or cents), so the maths stays the same.
 */

export const CURRENCIES = [
  "GBP", "EUR", "USD", "CAD", "AUD", "NZD", "CHF", "SEK", "NOK", "DKK",
  "PLN", "CZK", "INR", "ZAR", "SGD", "HKD", "MXN", "BRL", "PHP", "NGN",
] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

/** The three shown first at setup. The rest are behind "More currencies". */
export const MAIN_CURRENCIES: readonly CurrencyCode[] = ["GBP", "EUR", "USD"];

export function isCurrency(value: unknown): value is CurrencyCode {
  return typeof value === "string" && (CURRENCIES as readonly string[]).includes(value);
}

const EURO_COUNTRIES = [
  "AT", "BE", "HR", "CY", "EE", "FI", "FR", "DE", "GR", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PT", "SK", "SI", "ES",
];
const BY_COUNTRY: Record<string, CurrencyCode> = {
  GB: "GBP", IM: "GBP", JE: "GBP", GG: "GBP", GI: "GBP",
  US: "USD", CA: "CAD", AU: "AUD", NZ: "NZD", CH: "CHF", LI: "CHF", SE: "SEK", NO: "NOK", DK: "DKK",
  PL: "PLN", CZ: "CZK", IN: "INR", ZA: "ZAR", SG: "SGD", HK: "HKD", MX: "MXN", BR: "BRL", PH: "PHP", NG: "NGN",
};
for (const country of EURO_COUNTRIES) BY_COUNTRY[country] = "EUR";

/** A best guess from the phone's language and region ("de-DE" → euro). Pound if unsure. */
export function guessCurrency(locales: readonly string[]): CurrencyCode {
  for (const locale of locales) {
    const region = /[-_]([A-Za-z]{2})(?:[-_]|$)/.exec(locale)?.[1]?.toUpperCase();
    if (region !== undefined && BY_COUNTRY[region] !== undefined) return BY_COUNTRY[region];
  }
  return "GBP";
}

/** The phone's own languages, or an empty list where there are none (tests). */
export function deviceLocales(): string[] {
  try {
    if (typeof navigator === "undefined") return [];
    const list = navigator.languages && navigator.languages.length > 0 ? navigator.languages : [navigator.language];
    return list.filter((l): l is string => typeof l === "string" && l !== "");
  } catch {
    return [];
  }
}

/** The locale used to write amounts, so a German phone shows 1.234,56 €. */
export function deviceLocale(): string {
  for (const locale of deviceLocales()) {
    try {
      if (Intl.NumberFormat.supportedLocalesOf([locale]).length > 0) return locale;
    } catch {
      /* try the next one */
    }
  }
  return "en-GB";
}
