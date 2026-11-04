import { describe, expect, it } from "vitest";
import { greeting } from "../src/content/greeting";

const FOUNDING_PROMISE =
  "Breathe will never be about making money. It will always be about helping people.";

// Words we do not want in Breathe. Add more as we learn.
const WORDS_WE_AVOID = [
  "overdue",
  "failed",
  "failure",
  "lazy",
  "irresponsible",
  "guilty",
  "shame",
  "streak",
  "you must",
];

describe("Breathe Money wording", () => {
  it("shows the founding promise exactly as written", () => {
    expect(greeting.promise).toBe(FOUNDING_PROMISE);
  });

  it("does not use shame, guilt or pressure words", () => {
    for (const text of Object.values(greeting)) {
      for (const word of WORDS_WE_AVOID) {
        expect(text.toLowerCase()).not.toContain(word);
      }
    }
  });
});
