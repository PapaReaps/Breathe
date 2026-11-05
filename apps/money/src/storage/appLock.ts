import { fromBase64, toBase64 } from "./bytes";

/*
 * The optional privacy screen (Stage 9): a PIN asked for when the app opens,
 * and again after it has been in the background for a while.
 *
 * Honest limits (see docs/STORAGE-AND-BACKUPS.md): this is a PRIVACY SCREEN, NOT ENCRYPTION.
 * It stops someone glancing at your numbers. It does not stop a determined person with the
 * device, because the numbers themselves are still stored unencrypted in the browser.
 *
 * The PIN itself is never stored. Only a one-way "fingerprint" of it is kept (PBKDF2-SHA-256
 * with a random salt), so the PIN can't simply be read back out of the browser's storage.
 */

export const LOCK_KEY = "lock";
const LOCK_FORMAT = 1;
export const PIN_ITERATIONS = 210_000;
const MIN_ITERATIONS = 10_000;
const MAX_ITERATIONS = 5_000_000;
const SALT_BYTES = 16;
const CHECK_BYTES = 32;
export const MIN_PIN = 4;
export const MAX_PIN = 12;
/** Coming back after this long away asks for the PIN again. */
export const LOCK_AFTER_HIDDEN_MS = 60_000;

export interface LockRecord {
  format: number;
  salt: string;
  iterations: number;
  check: string;
}

export type PinProblem = "too-short" | "too-long" | "numbers-only" | "different";

/** Null means the new PIN is fine. */
export function checkNewPin(pin: string, again: string): PinProblem | null {
  if (!/^\d*$/.test(pin)) return "numbers-only";
  if (pin.length < MIN_PIN) return "too-short";
  if (pin.length > MAX_PIN) return "too-long";
  if (pin !== again) return "different";
  return null;
}

async function fingerprint(pin: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<Uint8Array> {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, material, CHECK_BYTES * 8);
  return new Uint8Array(bits);
}

export async function makeLockRecord(pin: string, iterations: number = PIN_ITERATIONS): Promise<LockRecord> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const check = await fingerprint(pin, salt, iterations);
  return { format: LOCK_FORMAT, salt: toBase64(salt), iterations, check: toBase64(check) };
}

/** Rebuilds a lock from storage. Null means there is no usable lock there. */
export function readLockRecord(raw: unknown): LockRecord | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  if (record.format !== LOCK_FORMAT) return null;
  const iterations = record.iterations;
  if (typeof iterations !== "number" || !Number.isInteger(iterations) || iterations < MIN_ITERATIONS || iterations > MAX_ITERATIONS) {
    return null;
  }
  const salt = fromBase64(record.salt, 64);
  const check = fromBase64(record.check, 128);
  if (salt === null || salt.length !== SALT_BYTES || check === null || check.length !== CHECK_BYTES) return null;
  return { format: LOCK_FORMAT, salt: record.salt as string, iterations, check: record.check as string };
}

export async function pinMatches(record: LockRecord, pin: string): Promise<boolean> {
  const salt = fromBase64(record.salt, 64);
  const expected = fromBase64(record.check, 128);
  if (salt === null || expected === null) return false;
  const actual = await fingerprint(pin, salt, record.iterations);
  if (actual.length !== expected.length) return false;
  // Compare every byte, so how long the check takes doesn't hint at how close a guess was.
  let difference = 0;
  for (let index = 0; index < actual.length; index += 1) difference |= (actual[index] ?? 0) ^ (expected[index] ?? 0);
  return difference === 0;
}

/** A calm pause after several wrong tries in a row, so guessing is slow. In milliseconds. */
export function pauseAfterWrongTries(tries: number): number {
  if (tries < 5) return 0;
  if (tries < 10) return 30_000;
  return 5 * 60_000;
}

/*
 * Wrong tries are remembered on this device, so closing and reopening the app doesn't
 * start the count again or skip a pause. Only two numbers are kept: how many wrong tries
 * in a row, and when any pause ends. Nothing about the PIN itself.
 */
export const TRIES_KEY = "breathe-pin-tries";

export interface TriesRecord {
  tries: number;
  /** When the pause ends (as Date.now()), or null for no pause. */
  until: number | null;
}

/** Reads what was remembered. Anything odd counts as "no wrong tries". */
export function readTries(raw: string | null, now: number = Date.now()): TriesRecord {
  if (raw === null) return { tries: 0, until: null };
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return { tries: 0, until: null };
    const record = value as Record<string, unknown>;
    const tries = typeof record.tries === "number" && Number.isInteger(record.tries) && record.tries > 0 ? Math.min(record.tries, 1000) : 0;
    // A pause can't be longer than the longest one, so a changed clock can't lock someone out for ever.
    const longest = pauseAfterWrongTries(Number.MAX_SAFE_INTEGER);
    const until = typeof record.until === "number" && record.until > now && record.until <= now + longest ? record.until : null;
    return { tries, until };
  } catch {
    return { tries: 0, until: null };
  }
}

export function recallTries(storage: Pick<Storage, "getItem"> | null = safeLocalStorage(), now?: number): TriesRecord {
  try {
    return readTries(storage?.getItem(TRIES_KEY) ?? null, now);
  } catch {
    return { tries: 0, until: null };
  }
}

export function rememberTries(record: TriesRecord, storage: Pick<Storage, "setItem" | "removeItem"> | null = safeLocalStorage()): void {
  try {
    if (record.tries === 0 && record.until === null) storage?.removeItem(TRIES_KEY);
    else storage?.setItem(TRIES_KEY, JSON.stringify(record));
  } catch {
    // Can't be remembered here: the count still works until the app is closed.
  }
}

function safeLocalStorage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}
