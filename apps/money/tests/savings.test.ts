import { describe, expect, it } from "vitest";
import { changeSavings, moveBalance, plainMoney, savingsNow } from "../src/logic/savings";

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

describe("savings and the balance move together", () => {
  it("adding puts the same amount on the balance, taking out takes it off", () => {
    expect(moveBalance("1284.60", 2000, "add")).toBe("1304.60");
    expect(moveBalance("1284.60", 1000, "take")).toBe("1274.60");
  });

  it("take out £10 then put £5 back: both end £5 lower, so the number is unchanged", () => {
    let savings = "150";
    let balance = "300";
    const out = changeSavings(savings, "10", "take");
    if (out.ok) savings = out.text;
    balance = moveBalance(balance, 1000, "take") ?? balance;
    const back = changeSavings(savings, "5", "add");
    if (back.ok) savings = back.text;
    balance = moveBalance(balance, 500, "add") ?? balance;
    expect(savings).toBe("145.00");
    expect(balance).toBe("295.00");
  });

  it("can go overdrawn, and leaves a missing or unreadable balance alone", () => {
    expect(moveBalance("5", 1000, "take")).toBe("-5.00");
    expect(moveBalance("", 1000, "take")).toBeNull();
    expect(moveBalance("lots", 1000, "add")).toBeNull();
    expect(plainMoney(-1200)).toBe("-12.00");
  });
});
