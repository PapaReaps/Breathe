import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { words } from "../src/content/words";
import { ACCENTS, POT_COLOURS } from "../src/storage/settings";

const css = readFileSync(fileURLToPath(new URL("../src/styles.css", import.meta.url)), "utf8");

/** The colour values inside one CSS rule, found by its exact selector. */
function rule(selector: string): Record<string, string> {
  const start = css.indexOf(selector + " {");
  if (start < 0) throw new Error("No rule for " + selector);
  const body = css.slice(start + selector.length + 2, css.indexOf("}", start));
  return Object.fromEntries([...body.matchAll(/(--[\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]));
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
}

const PAGE = { light: { bg: "#f6f5f1", surface: "#ffffff" }, dark: { bg: "#151b1e", surface: "#1d2529" } };
const DEFAULT_ACCENT = { light: rule(":root"), dark: rule(':root[data-theme="dark"]') };

describe("every colour choice stays easy to read", () => {
  for (const { id } of ACCENTS) {
    it(`app colour "${id}" has a name, and clear text in light and dark`, () => {
      expect(words.settings.accents[id]).toBeTruthy();
      const light = id === "teal" ? DEFAULT_ACCENT.light : rule(`:root[data-accent="${id}"]`);
      const dark = id === "teal" ? DEFAULT_ACCENT.dark : rule(`:root[data-theme="dark"][data-accent="${id}"]`);
      for (const [mode, v] of [["light", light], ["dark", dark]] as const) {
        expect(contrast(v["--accent"]!, PAGE[mode].bg)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(v["--accent"]!, PAGE[mode].surface)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(v["--on-accent"]!, v["--accent"]!)).toBeGreaterThanOrEqual(4.5);
      }
    });
  }

  for (const { id } of POT_COLOURS) {
    it(`savings colour "${id}" has a name, and a clear badge in light and dark`, () => {
      expect(words.settings.potColours[id]).toBeTruthy();
      const light = id === "gold" ? rule(":root") : rule(`:root[data-pot="${id}"]`);
      const dark = id === "gold" ? rule(':root[data-theme="dark"]') : rule(`:root[data-theme="dark"][data-pot="${id}"]`);
      for (const v of [light, dark]) {
        expect(contrast(v["--joy"]!, v["--joy-bg"]!)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(v["--joy-label"]!, v["--joy-bg"]!)).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
});
