import { describe, expect, it } from "vitest";
import { groupBills } from "../src/screens/ExplainView";
import { words } from "../src/content/words";
import type { BreakdownLine } from "../src/logic/types";

const line = (kind: BreakdownLine["kind"], amount: number, id?: string): BreakdownLine =>
  ({ kind, amount, id, name: id }) as BreakdownLine;

describe("Where this number comes from", () => {
  it("folds two or more bills into one Bills line, where the first bill was", () => {
    const lines = [line("balance", 128460), line("bill", -45000, "rent"), line("bill", -2500, "phone"), line("essential", -18000, "food")];
    const items = groupBills(lines);
    expect(items.map((item) => item.kind)).toEqual(["line", "bills", "line"]);
    const group = items[1];
    expect(group?.kind === "bills" ? group.lines.length : 0).toBe(2);
  });

  it("leaves a single bill as it is", () => {
    const items = groupBills([line("balance", 1000), line("bill", -500, "rent")]);
    expect(items.map((item) => item.kind)).toEqual(["line", "line"]);
  });

  it("says how many bills are inside", () => {
    expect(words.ui.billsGroup(4)).toBe("Bills (4)");
  });
});
