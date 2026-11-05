import { isNativeApp } from "./platform";

/*
 * The optional "check for updates" in the Android app (the web version updates by itself).
 *
 * Off unless the person switches it on in Settings, or taps "Check now".
 * It asks GitHub one question: "what is the newest Breathe Money release?"
 * Nothing about the person or their numbers is sent: no account, no cookies, no device details
 * beyond what any web request carries (GitHub can see a phone asked, from its internet address).
 *
 * The answer is treated as untrusted: only a version number in the expected form is accepted,
 * and the link the app opens is built here, never taken from the answer.
 */

export const RELEASES_API = "https://api.github.com/repos/PapaReaps/Breathe/releases/latest";
export const RELEASES_PAGE = "https://github.com/PapaReaps/Breathe/releases/tag/";
/** Checking on opening happens at most once a day. */
export const CHECK_EVERY_MS = 24 * 60 * 60 * 1000;
const LAST_CHECK_KEY = "breathe-last-update-check";

export type Version = [number, number, number];

/** "v0.11.0" or "0.11.0" → [0, 11, 0]. Anything else → null. */
export function parseVersion(text: unknown): Version | null {
  if (typeof text !== "string") return null;
  const match = /^v?(\d{1,4})\.(\d{1,4})\.(\d{1,4})$/.exec(text.trim());
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

export function isNewer(latest: Version, current: Version): boolean {
  for (let i = 0; i < 3; i += 1) {
    if (latest[i]! !== current[i]!) return latest[i]! > current[i]!;
  }
  return false;
}

export function versionText(version: Version): string {
  return version.join(".");
}

export type UpdateResult =
  | { state: "newer"; version: string; page: string }
  | { state: "up-to-date"; version: string }
  | { state: "unknown" };

/** Reads GitHub's answer. Only the tag name is used. */
export function readLatestRelease(raw: unknown, current: Version | null): UpdateResult {
  if (typeof raw !== "object" || raw === null) return { state: "unknown" };
  const record = raw as Record<string, unknown>;
  if (record.draft === true || record.prerelease === true) return { state: "unknown" };
  const latest = parseVersion(record.tag_name);
  if (latest === null || current === null) return { state: "unknown" };
  if (isNewer(latest, current)) {
    return { state: "newer", version: versionText(latest), page: RELEASES_PAGE + "v" + versionText(latest) };
  }
  return { state: "up-to-date", version: versionText(current) };
}

/** The version installed on this phone (from Android itself). Null on the web, or if Android won't say. */
export async function installedVersion(): Promise<Version | null> {
  if (!isNativeApp()) return null;
  try {
    const { App } = await import("@capacitor/app");
    const info = await App.getInfo();
    return parseVersion(info.version);
  } catch {
    return null;
  }
}

/** Asks GitHub for the newest release. Never throws: no internet just means "unknown". */
export async function checkForUpdate(fetcher: typeof fetch = fetch, current?: Version | null): Promise<UpdateResult> {
  const mine = current === undefined ? await installedVersion() : current;
  if (mine === null) return { state: "unknown" };
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    const response = await fetcher(RELEASES_API, {
      method: "GET",
      credentials: "omit",
      referrerPolicy: "no-referrer",
      cache: "no-store",
      headers: { Accept: "application/vnd.github+json" },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!response.ok) return { state: "unknown" };
    return readLatestRelease(await response.json(), mine);
  } catch {
    return { state: "unknown" };
  }
}

/** Has a day passed since the last automatic check? */
export function dueForCheck(now: number = Date.now()): boolean {
  try {
    const last = Number(localStorage.getItem(LAST_CHECK_KEY));
    return !Number.isFinite(last) || last <= 0 || now - last >= CHECK_EVERY_MS || last > now;
  } catch {
    return true;
  }
}

export function noteChecked(now: number = Date.now()): void {
  try {
    localStorage.setItem(LAST_CHECK_KEY, String(now));
  } catch {
    // Not available: it will simply check again next time.
  }
}
