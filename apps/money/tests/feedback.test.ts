import { describe, expect, it } from "vitest";
import { words } from "../src/content/words";
import { CLICK_SOUNDS, SOUND_RECIPES, VIBRATIONS, playSound, vibrate } from "../src/feedback";

describe("sounds and vibration when tapping", () => {
  it("has twelve sounds plus Off, each with a name and a recipe", () => {
    expect(CLICK_SOUNDS.length).toBe(13);
    expect(CLICK_SOUNDS[0]).toBe("off");
    for (const id of CLICK_SOUNDS) {
      expect(words.settings.sounds[id]).toBeTruthy();
      if (id !== "off") expect(typeof SOUND_RECIPES[id]).toBe("function");
    }
  });

  it("has Off and three strengths of vibration, each with a name", () => {
    expect([...VIBRATIONS]).toEqual(["off", "gentle", "medium", "firm"]);
    for (const id of VIBRATIONS) expect(words.settings.vibrations[id]).toBeTruthy();
  });

  it("never fails where there's no sound or vibration (like here, outside a browser)", () => {
    for (const id of CLICK_SOUNDS) expect(() => playSound(id)).not.toThrow();
    for (const id of VIBRATIONS) expect(() => vibrate(id)).not.toThrow();
  });
});
