import { describe, expect, it } from "vitest";
import { changeSavings, savingsNow } from "../src/logic/savings";

describe("adding to and taking from savings", () => {
  it("adds to what is kept aside", () => {
    expect(changeSavings("150", "20", "add")).toEqual({ ok: true, total: 17000, text: "170.00" });
    expect(changeSavings("", "12.50", "add")).toEqual({ ok: true, total: 1250, text: "12.50" });
  });

  it("takes out, and an empty pot is an empty box", () => {
    expect(changeSavings("170", "20", "take")).toEqual({ ok: true, total: 15000, text: "150.00" });
    expect(changeSavings("20", "20", "take")).toEqual({ ok: true, total: 0, text: "" });
  });

  it("never takes out more than is kept aside", () => {
    expect(changeSavings("150", "200", "take")).toEqual({ ok: false, reason: "more-than-saved" });
  });

  it("asks again for amounts it can't read, or nothing at all", () => {
    expect(changeSavings("150", "lots", "add")).toEqual({ ok: false, reason: "unreadable" });
    expect(changeSavings("150", "0", "add")).toEqual({ ok: false, reason: "zero" });
  });

  it("keeps big totals plain, without commas, so the box can read them back", () => {
    expect(changeSavings("1500", "100", "add")).toEqual({ ok: true, total: 160000, text: "1600.00" });
    expect(savingsNow("1600.00")).toBe(160000);
  });
});
