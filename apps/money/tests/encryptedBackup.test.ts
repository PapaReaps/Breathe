import { describe, expect, it } from "vitest";
import { emptyForm, newBillRow } from "../src/logic/form";
import type { FormState } from "../src/logic/form";
import {
  PBKDF2_ITERATIONS,
  checkNewPassphrase,
  encryptedBackupFileName,
  isEncryptedBackupText,
  makeEncryptedBackupText,
  openEncryptedBackupText,
} from "../src/storage/encryptedBackup";
import { makeBackupText, parseBackupText } from "../src/storage/savedData";

// Everything here is fictional. Most tests use fewer rounds so they run quickly;
// one test uses the real number.
const FAST = 100_000;
const PASSPHRASE = "kettle on the windowsill";

function sample(): FormState {
  const bill = { ...newBillRow(), name: "Window cleaner", amount: "12.50", dueDate: "2026-11-20" };
  return { ...emptyForm(), balance: "321.09", balanceDate: "2026-11-04", paydayDate: "2026-11-27", bills: [bill] };
}

function tweak(content: string, change: (file: Record<string, any>) => void): string {
  const file = JSON.parse(content);
  change(file);
  return JSON.stringify(file);
}

describe("passphrase-protected backups", () => {
  it("opens with the right passphrase and gives back exactly the same numbers", async () => {
    const form = sample();
    const content = await makeEncryptedBackupText(form, "2026-11-04", PASSPHRASE, FAST);
    const opened = await openEncryptedBackupText(content, PASSPHRASE);
    expect(opened).toEqual({ ok: true, form, savedOn: "2026-11-04" });
  });

  it("uses the full recommended strength by default", async () => {
    expect(PBKDF2_ITERATIONS).toBeGreaterThanOrEqual(600_000);
    const content = await makeEncryptedBackupText(sample(), "2026-11-04", PASSPHRASE);
    expect(JSON.parse(content).kdf.iterations).toBe(PBKDF2_ITERATIONS);
    expect((await openEncryptedBackupText(content, PASSPHRASE)).ok).toBe(true);
  }, 30_000);

  it("leaves nothing readable about the numbers in the file", async () => {
    const content = await makeEncryptedBackupText(sample(), "2026-11-04", PASSPHRASE, FAST);
    for (const secret of ["321.09", "Window cleaner", "12.50", "2026-11-27", "balance", PASSPHRASE]) {
      expect(content).not.toContain(secret);
    }
    const file = JSON.parse(content);
    expect(file).toMatchObject({ app: "breathe-money", encrypted: true, encryptedFormat: 1 });
    expect(file.kdf).toMatchObject({ name: "PBKDF2", hash: "SHA-256" });
    expect(file.cipher).toMatchObject({ name: "AES-GCM" });
  });

  it("uses a fresh salt and IV every time", async () => {
    const one = JSON.parse(await makeEncryptedBackupText(sample(), "2026-11-04", PASSPHRASE, FAST));
    const two = JSON.parse(await makeEncryptedBackupText(sample(), "2026-11-04", PASSPHRASE, FAST));
    expect(one.kdf.salt).not.toBe(two.kdf.salt);
    expect(one.cipher.iv).not.toBe(two.cipher.iv);
    expect(one.data).not.toBe(two.data);
  });

  it("refuses a wrong passphrase, including one that differs only in capital letters", async () => {
    const content = await makeEncryptedBackupText(sample(), "2026-11-04", PASSPHRASE, FAST);
    expect(await openEncryptedBackupText(content, "kettle on the windowsil")).toEqual({ ok: false, reason: "wrong-passphrase" });
    expect(await openEncryptedBackupText(content, "Kettle on the windowsill")).toEqual({ ok: false, reason: "wrong-passphrase" });
    expect(await openEncryptedBackupText(content, "")).toEqual({ ok: false, reason: "wrong-passphrase" });
  });

  it("refuses a file that has been changed in any way", async () => {
    const content = await makeEncryptedBackupText(sample(), "2026-11-04", PASSPHRASE, FAST);
    const flipped = tweak(content, (file) => {
      const data: string = file.data;
      const swap = data[10] === "A" ? "B" : "A";
      file.data = `${data.slice(0, 10)}${swap}${data.slice(11)}`;
    });
    expect((await openEncryptedBackupText(flipped, PASSPHRASE)).ok).toBe(false);

    // Changing the written settings stops it opening too, because they're bound into the encryption.
    const otherIterations = tweak(content, (file) => {
      file.kdf.iterations = FAST + 1;
    });
    expect(await openEncryptedBackupText(otherIterations, PASSPHRASE)).toEqual({ ok: false, reason: "wrong-passphrase" });
  });

  it("refuses settings that are too weak or absurdly slow, before trying", async () => {
    const content = await makeEncryptedBackupText(sample(), "2026-11-04", PASSPHRASE, FAST);
    for (const iterations of [1, 99_999, 50_000_000, 1.5, "600000"]) {
      const doctored = tweak(content, (file) => {
        file.kdf.iterations = iterations;
      });
      expect(await openEncryptedBackupText(doctored, PASSPHRASE)).toEqual({ ok: false, reason: "unreadable" });
    }
    const badSalt = tweak(content, (file) => {
      file.kdf.salt = "AAAA";
    });
    expect(await openEncryptedBackupText(badSalt, PASSPHRASE)).toEqual({ ok: false, reason: "unreadable" });
    const otherCipher = tweak(content, (file) => {
      file.cipher.name = "AES-CBC";
    });
    expect(await openEncryptedBackupText(otherCipher, PASSPHRASE)).toEqual({ ok: false, reason: "unreadable" });
  });

  it("says so when a protected file is from a newer version", async () => {
    const content = await makeEncryptedBackupText(sample(), "2026-11-04", PASSPHRASE, FAST);
    const newer = tweak(content, (file) => {
      file.encryptedFormat = 2;
    });
    expect(await openEncryptedBackupText(newer, PASSPHRASE)).toEqual({ ok: false, reason: "newer" });
  });

  it("can tell a protected file from a plain one", async () => {
    const protectedFile = await makeEncryptedBackupText(sample(), "2026-11-04", PASSPHRASE, FAST);
    const plainFile = makeBackupText(sample(), "2026-11-04");
    expect(isEncryptedBackupText(protectedFile)).toBe(true);
    expect(isEncryptedBackupText(plainFile)).toBe(false);
    expect(isEncryptedBackupText("not json")).toBe(false);
    expect(isEncryptedBackupText(JSON.stringify({ app: "something-else", encrypted: true }))).toBe(false);
    // The plain reader never mistakes a protected file for readable numbers.
    expect(parseBackupText(protectedFile).ok).toBe(false);
  });

  it("handles passphrases with accents and emoji", async () => {
    const passphrase = "café crème 🌧️ au lait";
    const content = await makeEncryptedBackupText(sample(), "2026-11-04", passphrase, FAST);
    expect((await openEncryptedBackupText(content, passphrase)).ok).toBe(true);
  });

  it("names protected files so they're easy to tell apart", () => {
    expect(encryptedBackupFileName("2026-11-04")).toBe("breathe-money-backup-2026-11-04-protected.breathe-backup.json");
  });
});

describe("choosing a passphrase", () => {
  it("asks for at least 10 characters, typed the same twice", () => {
    expect(checkNewPassphrase("short", "short")).toBe("too-short");
    expect(checkNewPassphrase("long enough now", "long enough no")).toBe("different");
    expect(checkNewPassphrase("long enough now", "long enough now")).toBeNull();
  });
});
