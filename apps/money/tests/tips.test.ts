import { describe, expect, it } from "vitest";
import { TIP_LINKS, isTipLink } from "../src/content/support";

describe("Leave a tip", () => {
  it("offers £3, £5 and £10, each on Stripe's own payment pages", () => {
    expect(TIP_LINKS.map((tip) => tip.amount)).toEqual(["£3", "£5", "£10"]);
    for (const tip of TIP_LINKS) expect(isTipLink(tip.url)).toBe(true);
    expect(new Set(TIP_LINKS.map((tip) => tip.url)).size).toBe(3);
  });

  it("never opens anything that isn't a Stripe payment link", () => {
    expect(isTipLink("http://buy.stripe.com/bJe8wRefe6om4abfrC3cc00")).toBe(false);
    expect(isTipLink("https://buy.stripe.com.example.com/abc1234567")).toBe(false);
    expect(isTipLink("https://example.com/bJe8wRefe6om4abfrC3cc00")).toBe(false);
    expect(isTipLink("https://buy.stripe.com/abc/../../evil")).toBe(false);
  });
});
