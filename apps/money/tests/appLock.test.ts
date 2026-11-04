import { describe, expect, it } from "vitest";
import { checkNewPin, makeLockRecord, pauseAfterWrongTries, pinMatches, readLockRecord } from "../src/storage/appLock";
import { DEFAULT_SETTINGS, readSettings } from "../src/storage/settings";

const FAST = 10_000;

describe("the privacy screen PIN", () => {
  it("matches the right PIN and nothing else", async () => {
    const record = await makeLockRecord("2468", FAST);
    expect(await pinMatches(record, "2468")).toBe(true);
    expect(await pinMatches(record, "2469")).toBe(false);
    expect(await pinMatches(record, "24680")).toBe(false);
    expect(await pinMatches(record, "")).toBe(false);
  });

  it("never stores the PIN itself", async () => {
    const record = await makeLockRecord("135790", FAST);
    expect(JSON.stringify(record)).not.toContain("135790");
  });

  it("gives two people with the same PIN different records", async () => {
    const one = await makeLockRecord("1111", FAST);
    const two = await makeLockRecord("1111", FAST);
    expect(one.salt).not.toBe(two.salt);
    expect(one.check).not.toBe(two.check);
  });

  it("reads back what was saved, and refuses anything out of place", async () => {
    const record = await makeLockRecord("2468", FAST);
    expect(readLockRecord(JSON.parse(JSON.stringify(record)))).toEqual(record);
    expect(readLockRecord(null)).toBeNull();
    expect(readLockRecord({ ...record, format: 2 })).toBeNull();
    expect(readLockRecord({ ...record, iterations: 1 })).toBeNull();
    expect(readLockRecord({ ...record, salt: "AAAA" })).toBeNull();
    expect(readLockRecord({ ...record, check: 42 })).toBeNull();
  });

  it("asks for 4 to 12 numbers, typed the same twice", () => {
    expect(checkNewPin("123", "123")).toBe("too-short");
    expect(checkNewPin("1234567890123", "1234567890123")).toBe("too-long");
    expect(checkNewPin("12a4", "12a4")).toBe("numbers-only");
    expect(checkNewPin("1234", "1235")).toBe("different");
    expect(checkNewPin("1234", "1234")).toBeNull();
  });

  it("pauses calmly after several wrong tries, so guessing is slow", () => {
    expect(pauseAfterWrongTries(1)).toBe(0);
    expect(pauseAfterWrongTries(4)).toBe(0);
    expect(pauseAfterWrongTries(5)).toBe(30_000);
    expect(pauseAfterWrongTries(10)).toBe(300_000);
  });
});

describe("text size and contrast settings", () => {
  it("start at the standard size, following the device for contrast", () => {
    expect(DEFAULT_SETTINGS.textSize).toBe("standard");
    expect(DEFAULT_SETTINGS.contrast).toBe("system");
    expect(readSettings({}).textSize).toBe("standard");
  });

  it("keep a valid choice and ignore anything unknown", () => {
    expect(readSettings({ textSize: "largest", contrast: "more" })).toMatchObject({ textSize: "largest", contrast: "more" });
    expect(readSettings({ textSize: "huge", contrast: "max" })).toMatchObject({ textSize: "standard", contrast: "system" });
  });
});
