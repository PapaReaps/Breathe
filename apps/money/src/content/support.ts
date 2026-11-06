/**
 * The tip links for the whole Breathe family. Every Breathe app can use these same three,
 * so a supporter always lands on the same Stripe page.
 *
 * They are Stripe Payment Links: Stripe hosts the page and handles the card or wallet.
 * Breathe only opens the address; it never sees card details, and sends nothing about
 * the person or their numbers.
 */
export const TIP_LINKS = [
  { amount: "£3", url: "https://buy.stripe.com/bJe8wRefe6om4abfrC3cc00" },
  { amount: "£5", url: "https://buy.stripe.com/7sYbJ35IIfYW8qr4MY3cc01" },
  { amount: "£10", url: "https://buy.stripe.com/28E5kF6MM142bCD6V63cc02" },
] as const;

/** Only Stripe's own payment pages are ever opened from the tip screen. */
export function isTipLink(url: string): boolean {
  return /^https:\/\/buy\.stripe\.com\/[A-Za-z0-9]{10,40}$/.test(url);
}
