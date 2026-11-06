import { describe, expect, it } from "vitest";
import { describeForm, emptyForm } from "../src/logic/form";
import { fromSaved, toSaved } from "../src/storage/savedData";
import { paydayLine, words } from "../src/content/words";

describe("a name for the main money", () => {
  it("numbers saved before names existed still open, with no name", () => {
    const old = toSaved({ ...emptyForm(), balance: "420", paydayDate: "2026-11-27" }) as unknown as { format: number; form: Record<string, unknown> };
    delete old.form.paydayName;
    const read = fromSaved(old);
    expect(read).not.toBeNull();
    expect(read?.paydayName).toBe("");
    expect(read?.balance).toBe("420");
  });

  it("is saved and read back", () => {
    const read = fromSaved(toSaved({ ...emptyForm(), paydayName: "Universal Credit" }));
    expect(read?.paydayName).toBe("Universal Credit");
  });

  it("shows in the Menu summary, before the date", () => {
    const form = { ...emptyForm(), paydayName: "Universal Credit", paydayDate: "2026-11-27" };
    expect(describeForm(form, "2026-11-04").payday.startsWith("Universal Credit · ")).toBe(true);
    expect(describeForm({ ...form, paydayName: "  " }, "2026-11-04").payday.startsWith("Friday")).toBe(true);
  });

  it("is used under the number and in Coming up, or 'Money' / 'Your money' when there is none", () => {
    expect(paydayLine("2026-11-27", 23, "Universal Credit")).toBe("Universal Credit comes in Fri 27 Nov · 23 days");
    expect(paydayLine("2026-11-27", 23)).toBe("Money comes in Fri 27 Nov · 23 days");
    expect(words.comingUp.moneyDayNamed("Wages")).toBe("Wages comes in");
    expect(words.comingUp.moneyDayNamed("")).toBe("Your money comes in");
  });
});
