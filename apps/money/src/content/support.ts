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

/**
 * Follow Breathe (v1.0.1): the family's X and Instagram pages. Only these two exact
 * addresses are ever opened from Help and sharing. Nothing about the person is sent.
 */
export const FOLLOW_LINKS = [
  { name: "X", url: "https://x.com/breatheapps" },
  { name: "Instagram", url: "https://www.instagram.com/breatheapps/" },
] as const;

export function isFollowLink(url: string): boolean {
  return FOLLOW_LINKS.some((link) => link.url === url);
}
