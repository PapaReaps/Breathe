import { describe, expect, it } from "vitest";
import { formatMoney, parseMoney } from "../src/logic/money";

describe("reading typed amounts", () => {
  it("understands the usual ways people type money", () => {
    const cases: Array<[string, number]> = [
      ["12.50", 1250],
      ["12.5", 1250],
      ["12", 1200],
      ["£12.50", 1250],
      [" £ 12.50 ", 1250],
      ["12,50", 1250],
      ["1,234.56", 123456],
      ["1,234", 123400],
      [".5", 50],
      ["12.", 1200],
      ["0.07", 7],
      ["0", 0],
    ];
    for (const [typed, pence] of cases) {
      expect(parseMoney(typed)).toEqual({ ok: true, pence });
    }
  });

  it("allows a minus sign only where it is asked for", () => {
    expect(parseMoney("-20", { allowNegative: true })).toEqual({ ok: true, pence: -2000 });
    expect(parseMoney("-£20.50", { allowNegative: true })).toEqual({ ok: true, pence: -2050 });
    expect(parseMoney("-20")).toEqual({ ok: false, reason: "negative-not-allowed" });
    expect(parseMoney("-0")).toEqual({ ok: true, pence: 0 });
  });

  it("explains kindly when it cannot read something", () => {
    expect(parseMoney("12.505")).toEqual({ ok: false, reason: "too-many-decimals" });
    for (const bad of ["abc", "", "£", "1e5", "12.5.0", "12 50", "--5"]) {
      expect(parseMoney(bad)).toEqual({ ok: false, reason: "not-a-number" });
    }
    expect(parseMoney("999999999999")).toEqual({ ok: false, reason: "too-large" });
    expect(parseMoney("2000000000")).toEqual({ ok: false, reason: "too-large" });
  });

  it("never makes rounding mistakes (0.1 + 0.2 style)", () => {
    const a = parseMoney("0.10");
    const b = parseMoney("0.20");
    if (!a.ok || !b.ok) throw new Error("should be readable");
    expect(a.pence + b.pence).toBe(30);
    expect(parseMoney("19.99")).toEqual({ ok: true, pence: 1999 });
    expect(parseMoney("1.15")).toEqual({ ok: true, pence: 115 });
  });
});

describe("showing money", () => {
  it("writes pence as pounds with two decimals and commas", () => {
    expect(formatMoney(1250)).toBe("£12.50");
    expect(formatMoney(5)).toBe("£0.05");
    expect(formatMoney(0)).toBe("£0.00");
    expect(formatMoney(123456)).toBe("£1,234.56");
    expect(formatMoney(100000000)).toBe("£1,000,000.00");
    expect(formatMoney(-3000)).toBe("−£30.00");
  });

  it("reads back what it wrote", () => {
    for (const pence of [0, 1, 99, 100, 101, 12345, 99999999, -4521]) {
      const back = parseMoney(formatMoney(pence).replace("−", "-"), { allowNegative: true });
      expect(back).toEqual({ ok: true, pence });
    }
  });
});
