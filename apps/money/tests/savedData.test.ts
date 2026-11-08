import { describe, expect, it } from "vitest";
import { emptyForm, migrateMainMoney, newBillRow, newIncomeRow, nextId, withBalance } from "../src/logic/form";
import type { FormState } from "../src/logic/form";
import {
  backupFileName,
  fromSaved,
  makeBackupText,
  parseBackupText,
  readForm,
  toSaved,
} from "../src/storage/savedData";

// Everything here is fictional.
function sample(): FormState {
  const bill = { ...newBillRow(), name: "Mum", amount: "100", dueDate: "2026-11-10" };
  const income = { ...newIncomeRow(), name: "Refund", amount: "30", date: "2026-11-12", reliability: "uncertain" as const };
  return {
    ...emptyForm(),
    balance: "420",
    balanceDate: "2026-11-04",
    paydayDate: "2026-11-14",
    paydayRule: "working-day-before",
    bills: [bill],
    income: [income],
    foodPerWeek: "63",
    travelPerWeek: "17.50",
    buffer: "50",
    bankHolidays: "2026-12-25 2026-12-28",
    answers: { [bill.id]: true },
  };
}

describe("saving on the device", () => {
  it("what is saved comes back exactly", () => {
    const form = sample();
    expect(fromSaved(toSaved(form))).toEqual(migrateMainMoney(form));
  });

  it("an empty form saves and comes back too", () => {
    const form = emptyForm();
    expect(fromSaved(toSaved(form))).toEqual(migrateMainMoney(form));
  });

  it("a new form starts with no bills or money coming in", () => {
    expect(emptyForm().bills).toEqual([]);
    expect(emptyForm().income).toEqual([]);
  });

  it("rows with nothing in them are dropped when numbers are loaded", () => {
    const form = sample();
    const withBlanks = { ...form, bills: [...form.bills, newBillRow()], income: [newIncomeRow(), ...form.income] };
    expect(fromSaved(toSaved(withBlanks))).toEqual(migrateMainMoney(form));
  });

  it("only the known fields are saved", () => {
    const sneaky = { ...sample(), secret: "x" } as unknown as FormState;
    expect(Object.keys(toSaved(sneaky).form).sort()).toEqual(Object.keys(sample()).sort());
  });

  it("refuses anything it does not recognise instead of guessing", () => {
    const good = toSaved(sample());
    expect(fromSaved(null)).toBeNull();
    expect(fromSaved("hello")).toBeNull();
    expect(fromSaved({ format: 99, form: good.form })).toBeNull();
    expect(fromSaved({ form: good.form })).toBeNull();
    expect(fromSaved({ format: 1, form: { ...good.form, balance: 420 } })).toBeNull();
  });

  it("row ids stay unique, even across separate visits", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 5000; i++) ids.add(nextId("bill"));
    expect(ids.size).toBe(5000);
    expect(/^(bill|income)-[a-z0-9-]{1,48}$/.test(nextId("income"))).toBe(true);
  });
});

describe("repeating items are saved and read back", () => {
  function repeating(): FormState {
    const bill = { ...newBillRow(), name: "Gym", amount: "10", dueDate: "2026-11-06", repeat: "weekly" as const };
    const income = { ...newIncomeRow(), name: "Wages", amount: "50", date: "2026-11-06", repeat: "monthly" as const };
    return {
      ...emptyForm(),
      balance: "420",
      paydayDate: "2026-11-20",
      paydayRule: "on-the-day",
      paydayRepeat: "fortnightly",
      bills: [bill],
      income: [income],
      answers: { [`${bill.id}@2026-11-06`]: true, [`${income.id}@2026-11-06`]: false },
    };
  }

  it("how often comes back exactly, including answers about one date of a repeating item", () => {
    const form = repeating();
    expect(fromSaved(toSaved(form))).toEqual(migrateMainMoney(form));
    expect(parseBackupText(makeBackupText(form, "2026-11-04"))).toEqual({ ok: true, form: migrateMainMoney(form), savedOn: "2026-11-04" });
  });

  it("numbers saved before repeats existed still open, as one date only", () => {
    const form = sample();
    const oldForm = JSON.parse(JSON.stringify(toSaved(form).form));
    delete oldForm.paydayRepeat;
    for (const row of [...oldForm.bills, ...oldForm.income]) delete row.repeat;
    expect(fromSaved({ format: 1, form: oldForm })).toEqual(migrateMainMoney(form));
  });

  it("an old backup file (format 1) can be used", () => {
    const file = JSON.parse(makeBackupText(sample(), "2026-11-04"));
    file.format = 1;
    delete file.form.paydayRepeat;
    for (const row of [...file.form.bills, ...file.form.income]) delete row.repeat;
    const parsed = parseBackupText(JSON.stringify(file));
    expect(parsed.ok).toBe(true);
  });

  it("refuses a how-often it does not know, and answer names it does not recognise", () => {
    const good = JSON.parse(makeBackupText(repeating(), "2026-11-04"));
    const attempt = (change: (form: Record<string, any>) => void) => {
      const copy = JSON.parse(JSON.stringify(good));
      change(copy.form);
      return parseBackupText(JSON.stringify(copy));
    };
    const refused = { ok: false, reason: "unreadable" };
    expect(attempt((f) => { f.paydayRepeat = "daily"; })).toEqual(refused);
    expect(attempt((f) => { f.bills[0].repeat = "sometimes"; })).toEqual(refused);
    expect(attempt((f) => { f.income[0].repeat = 7; })).toEqual(refused);
    expect(attempt((f) => { f.answers = { "bill-1@tomorrow": true }; })).toEqual(refused);
    expect(attempt((f) => { f.answers = { "bill-1@2026-11-06@2026-11-07": true }; })).toEqual(refused);
    expect(attempt((f) => { f.answers = { "other-1@2026-11-06": true }; })).toEqual(refused);
  });
});

describe("the date a balance is from", () => {
  it("typing a balance dates it today, so an old one is never mistaken for fresh", () => {
    const form = { ...emptyForm(), balance: "100", balanceDate: "2026-10-01" };
    expect(withBalance(form, "120", "2026-11-04").balanceDate).toBe("2026-11-04");
    expect(withBalance(form, "120", "2026-11-04").balance).toBe("120");
  });

  it("clearing the balance leaves the date alone", () => {
    const form = { ...emptyForm(), balance: "100", balanceDate: "2026-10-01" };
    expect(withBalance(form, "  ", "2026-11-04").balanceDate).toBe("2026-10-01");
  });
});

describe("backup files", () => {
  it("a backup restores exactly what went in", () => {
    const form = sample();
    const parsed = parseBackupText(makeBackupText(form, "2026-11-04"));
    expect(parsed).toEqual({ ok: true, form: migrateMainMoney(form), savedOn: "2026-11-04" });
  });

  it("says inside the file that it is not encrypted", () => {
    const file = JSON.parse(makeBackupText(sample(), "2026-11-04"));
    expect(file.encrypted).toBe(false);
    expect(file.app).toBe("breathe-money");
  });

  it("is named with the date, and matches the pattern Git ignores", () => {
    const name = backupFileName("2026-11-04");
    expect(name).toBe("breathe-money-backup-2026-11-04.breathe-backup.json");
    expect(name.endsWith(".breathe-backup.json")).toBe(true);
  });

  it("explains kindly why it can't use a file", () => {
    const good = JSON.parse(makeBackupText(sample(), "2026-11-04"));
    const text = (value: unknown) => JSON.stringify(value);

    expect(parseBackupText("not json at all")).toEqual({ ok: false, reason: "not-json" });
    expect(parseBackupText("")).toEqual({ ok: false, reason: "not-json" });
    expect(parseBackupText(text([1, 2]))).toEqual({ ok: false, reason: "not-ours" });
    expect(parseBackupText(text({ app: "something-else", format: 1, form: good.form }))).toEqual({ ok: false, reason: "not-ours" });
    expect(parseBackupText(text({ app: "breathe-money", form: good.form }))).toEqual({ ok: false, reason: "not-ours" });
    expect(parseBackupText(text({ ...good, format: 5 }))).toEqual({ ok: false, reason: "newer" });
    expect(parseBackupText(text({ ...good, format: 0 }))).toEqual({ ok: false, reason: "not-ours" });
    expect(parseBackupText(text({ ...good, form: { ...good.form, balance: 5 } }))).toEqual({ ok: false, reason: "unreadable" });
    expect(parseBackupText("x".repeat(1_000_001))).toEqual({ ok: false, reason: "too-big" });
  });

  it("refuses files that have been tampered with in sneaky ways", () => {
    const good = JSON.parse(makeBackupText(sample(), "2026-11-04"));
    const attempt = (change: (form: Record<string, unknown>) => void) => {
      const copy = JSON.parse(JSON.stringify(good));
      change(copy.form);
      return parseBackupText(JSON.stringify(copy));
    };
    const refused = { ok: false, reason: "unreadable" };

    expect(attempt((f) => { f.paydayRule = "whenever"; })).toEqual(refused);
    expect(attempt((f) => { f.paydayDate = "tomorrow"; })).toEqual(refused);
    expect(attempt((f) => { f.balance = "9".repeat(41); })).toEqual(refused);
    expect(attempt((f) => { f.bills = "none"; })).toEqual(refused);
    expect(attempt((f) => { f.bills = new Array(101).fill(0).map((_, i) => ({ id: `bill-${i}`, name: "", amount: "", dueDate: "" })); })).toEqual(refused);
    expect(attempt((f) => { (f.bills as Array<Record<string, unknown>>)[0]!.id = "income-1"; })).toEqual(refused);
    expect(attempt((f) => { (f.bills as Array<Record<string, unknown>>)[0]!.id = "bill-<script>"; })).toEqual(refused);
    expect(attempt((f) => { f.bills = [...(f.bills as unknown[]), ...(f.bills as unknown[])]; })).toEqual(refused);
    expect(attempt((f) => { (f.income as Array<Record<string, unknown>>)[0]!.reliability = "definitely"; })).toEqual(refused);
    expect(attempt((f) => { f.answers = { "bill-1": "yes" }; })).toEqual(refused);
    expect(attempt((f) => { f.answers = JSON.parse('{"__proto__": true}'); })).toEqual(refused);
    expect(attempt((f) => { f.answers = null; })).toEqual(refused);
    expect(attempt((f) => { delete f.buffer; })).toEqual(refused);
  });

  it("ignores extra fields instead of carrying them in", () => {
    const good = JSON.parse(makeBackupText(sample(), "2026-11-04"));
    good.form.surprise = "hello";
    good.extra = { anything: true };
    const parsed = parseBackupText(JSON.stringify(good));
    if (!parsed.ok) throw new Error("should be readable");
    expect(Object.keys(parsed.form).includes("surprise")).toBe(false);
  });

  it("readForm only trusts a complete form", () => {
    const form = sample();
    expect(readForm(form)).toEqual(migrateMainMoney(form));
    expect(readForm({})).toBeNull();
    expect(readForm(undefined)).toBeNull();
  });
});
