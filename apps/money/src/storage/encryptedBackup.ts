import type { FormState } from "../logic/form";
import { fromBase64, toBase64 } from "./bytes";
import { BACKUP_APP, makeBackupText, parseBackupText } from "./savedData";
import type { BackupParse, BackupProblem } from "./savedData";

/*
 * Passphrase-protected backup files (Stage 8). See docs/STORAGE-AND-BACKUPS.md.
 *
 * - Only the browser's own Web Crypto is used. No extra encryption library.
 * - AES-256-GCM encrypts the file and detects any change to it.
 * - The key comes from the passphrase through PBKDF2-SHA-256, with a fresh random salt
 *   for every backup and a high iteration count (the OWASP figure for PBKDF2-SHA-256).
 * - A fresh random IV for every backup.
 * - The file records its format, the salt, the IV and the settings used, so a backup made
 *   today can still be opened by later versions. Those settings are also bound into the
 *   encryption ("additional data"), so changing any of them stops the file opening.
 * - The passphrase is never stored or sent anywhere. Forget it and nobody can open the file.
 *
 * What is inside, once opened, is exactly an ordinary backup file, and it goes through
 * the same careful checks (parseBackupText) before anything is trusted.
 */

export const ENCRYPTED_FORMAT = 1;
/** OWASP's recommendation for PBKDF2-HMAC-SHA-256 (reviewed November 2026). */
export const PBKDF2_ITERATIONS = 600_000;
/** Lower than this is refused when reading, so a doctored file can't quietly weaken itself. */
const MIN_ITERATIONS = 100_000;
/** Higher than this is refused, so a doctored file can't freeze the app. */
const MAX_ITERATIONS = 10_000_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const MAX_FILE_CHARS = 2_000_000;
export const MIN_PASSPHRASE_LENGTH = 10;

export type EncryptedProblem = BackupProblem | "wrong-passphrase" | "no-crypto";

export type EncryptedParse = BackupParse | { ok: false; reason: EncryptedProblem };

/** Encrypting needs the browser's Web Crypto, which only works on https:// or this computer's own address. */
export function canEncrypt(): boolean {
  return typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.subtle !== "undefined";
}

export function encryptedBackupFileName(today: string): string {
  return `breathe-money-backup-${today}-protected.breathe-backup.json`;
}

export type PassphraseProblem = "too-short" | "different";

/** Null means the passphrase is fine to use. */
export function checkNewPassphrase(passphrase: string, again: string): PassphraseProblem | null {
  if ([...passphrase].length < MIN_PASSPHRASE_LENGTH) return "too-short";
  if (passphrase !== again) return "different";
  return null;
}

// ---------------------------------------------------------------- small helpers

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The settings that are written in the file, bound into the encryption so they can't be swapped. */
function headerBytes(iterations: number, salt: string, iv: string): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(
    [BACKUP_APP, `encrypted-${ENCRYPTED_FORMAT}`, "PBKDF2", "SHA-256", String(iterations), salt, "AES-GCM", iv].join("|"),
  );
}

async function deriveKey(passphrase: string, salt: Uint8Array<ArrayBuffer>, iterations: number, usage: KeyUsage): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase.normalize("NFC")),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    [usage],
  );
}

// ---------------------------------------------------------------- making a protected backup

/** The text of a passphrase-protected backup file. Nothing readable about your numbers is left in it. */
export async function makeEncryptedBackupText(
  form: FormState,
  today: string,
  passphrase: string,
  iterations: number = PBKDF2_ITERATIONS,
): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const saltText = toBase64(salt);
  const ivText = toBase64(iv);
  const key = await deriveKey(passphrase, salt, iterations, "encrypt");
  const plain = new TextEncoder().encode(makeBackupText(form, today));
  const sealed = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: headerBytes(iterations, saltText, ivText) }, key, plain),
  );
  return JSON.stringify(
    {
      app: BACKUP_APP,
      encrypted: true,
      encryptedFormat: ENCRYPTED_FORMAT,
      note: "This Breathe Money backup is protected with a passphrase. Open it with Breathe Money: Menu, Your data and backups, Use a backup file.",
      kdf: { name: "PBKDF2", hash: "SHA-256", iterations, salt: saltText },
      cipher: { name: "AES-GCM", iv: ivText },
      data: toBase64(sealed),
    },
    null,
    2,
  );
}

// ---------------------------------------------------------------- opening one

/** Is this a passphrase-protected Breathe Money backup? (It doesn't check the passphrase.) */
export function isEncryptedBackupText(content: string): boolean {
  if (content.length > MAX_FILE_CHARS) return false;
  try {
    const raw: unknown = JSON.parse(content);
    return isRecord(raw) && raw.app === BACKUP_APP && raw.encrypted === true;
  } catch {
    return false;
  }
}

/**
 * Opens a protected backup. Nothing changes on the device here: this only reads the file.
 * A wrong passphrase and a changed file look the same from outside, and both are refused.
 */
export async function openEncryptedBackupText(content: string, passphrase: string): Promise<EncryptedParse> {
  if (content.length > MAX_FILE_CHARS) return { ok: false, reason: "too-big" };
  if (!canEncrypt()) return { ok: false, reason: "no-crypto" };

  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    return { ok: false, reason: "not-json" };
  }
  if (!isRecord(raw) || raw.app !== BACKUP_APP || raw.encrypted !== true) return { ok: false, reason: "not-ours" };
  if (typeof raw.encryptedFormat !== "number") return { ok: false, reason: "not-ours" };
  if (raw.encryptedFormat > ENCRYPTED_FORMAT) return { ok: false, reason: "newer" };
  if (raw.encryptedFormat !== ENCRYPTED_FORMAT) return { ok: false, reason: "not-ours" };

  const kdf = raw.kdf;
  const cipher = raw.cipher;
  if (!isRecord(kdf) || !isRecord(cipher)) return { ok: false, reason: "unreadable" };
  if (kdf.name !== "PBKDF2" || kdf.hash !== "SHA-256" || cipher.name !== "AES-GCM") return { ok: false, reason: "unreadable" };
  const iterations = kdf.iterations;
  if (typeof iterations !== "number" || !Number.isInteger(iterations) || iterations < MIN_ITERATIONS || iterations > MAX_ITERATIONS) {
    return { ok: false, reason: "unreadable" };
  }
  const salt = fromBase64(kdf.salt, 64);
  const iv = fromBase64(cipher.iv, 64);
  const sealed = fromBase64(raw.data, MAX_FILE_CHARS);
  if (salt === null || salt.length !== SALT_BYTES || iv === null || iv.length !== IV_BYTES || sealed === null) {
    return { ok: false, reason: "unreadable" };
  }

  let plain: ArrayBuffer;
  try {
    const key = await deriveKey(passphrase, salt, iterations, "decrypt");
    plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv, additionalData: headerBytes(iterations, kdf.salt as string, cipher.iv as string) },
      key,
      sealed,
    );
  } catch {
    return { ok: false, reason: "wrong-passphrase" };
  }

  let inner: string;
  try {
    inner = new TextDecoder("utf-8", { fatal: true }).decode(plain);
  } catch {
    return { ok: false, reason: "unreadable" };
  }
  return parseBackupText(inner);
}
