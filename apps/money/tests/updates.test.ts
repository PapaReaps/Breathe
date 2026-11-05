import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { RELEASES_API, apkAddress, checkForUpdate, isNewer, parseVersion, readLatestRelease } from "../src/updates";

const appDir = fileURLToPath(new URL("../", import.meta.url));

describe("version numbers", () => {
  it("reads the forms we use, and nothing else", () => {
    expect(parseVersion("v0.11.0")).toEqual([0, 11, 0]);
    expect(parseVersion("0.12.3")).toEqual([0, 12, 3]);
    expect(parseVersion("v1.2")).toBeNull();
    expect(parseVersion("0.0.0-test.4")).toBeNull();
    expect(parseVersion("latest")).toBeNull();
    expect(parseVersion(12)).toBeNull();
  });

  it("compares them number by number, not as text", () => {
    expect(isNewer([0, 12, 0], [0, 11, 0])).toBe(true);
    expect(isNewer([0, 10, 0], [0, 9, 9])).toBe(true);
    expect(isNewer([0, 11, 0], [0, 11, 0])).toBe(false);
    expect(isNewer([0, 9, 0], [0, 11, 0])).toBe(false);
    expect(isNewer([1, 0, 0], [0, 99, 99])).toBe(true);
  });
});

describe("reading GitHub's answer", () => {
  it("says when a newer version is ready, with a link built by the app itself", () => {
    const result = readLatestRelease({ tag_name: "v0.12.0", html_url: "https://example.com/not-this" }, [0, 11, 0]);
    expect(result).toEqual({
      state: "newer",
      version: "0.12.0",
      page: "https://github.com/PapaReaps/Breathe/releases/tag/v0.12.0",
      apk: "https://github.com/PapaReaps/Breathe/releases/download/v0.12.0/breathe-money-v0.12.0.apk",
    });
  });

  it("the download address matches what the Android code allows, and the release recipe makes", () => {
    const java = readFileSync(appDir + "android/app/src/main/java/io/github/papareaps/breathe/money/ApkInstallerPlugin.java", "utf8");
    // The Java text writes each backslash twice; a regular expression wants it once.
    const pattern = /Pattern\.compile\(\s*"(.+)"\s*\)/.exec(java)![1]!.split("\\\\").join("\\");
    const allowed = new RegExp(pattern);
    expect(allowed.test(apkAddress("0.14.0"))).toBe(true);
    expect(allowed.test("https://example.com/breathe-money-v0.14.0.apk")).toBe(false);
    expect(allowed.test("https://github.com/someone-else/Breathe/releases/download/v0.14.0/breathe-money-v0.14.0.apk")).toBe(false);
    const recipe = readFileSync(appDir + "../../.github/workflows/android.yml", "utf8");
    expect(recipe).toContain('"../out/breathe-money-v${{ steps.version.outputs.name }}.apk"');
  });

  it("says so when you already have the newest", () => {
    expect(readLatestRelease({ tag_name: "v0.11.0" }, [0, 11, 0])).toEqual({ state: "up-to-date", version: "0.11.0" });
  });

  it("ignores drafts, test versions and anything odd", () => {
    expect(readLatestRelease({ tag_name: "v9.0.0", prerelease: true }, [0, 11, 0])).toEqual({ state: "unknown" });
    expect(readLatestRelease({ tag_name: "v9.0.0", draft: true }, [0, 11, 0])).toEqual({ state: "unknown" });
    expect(readLatestRelease({ tag_name: "<script>" }, [0, 11, 0])).toEqual({ state: "unknown" });
    expect(readLatestRelease(null, [0, 11, 0])).toEqual({ state: "unknown" });
    expect(readLatestRelease({ tag_name: "v0.12.0" }, null)).toEqual({ state: "unknown" });
  });
});

describe("asking GitHub", () => {
  it("sends one plain request: no cookies, no referrer, nothing about you", async () => {
    const calls: Array<[string, RequestInit | undefined]> = [];
    const fake = (async (url: string, init?: RequestInit) => {
      calls.push([url, init]);
      return new Response(JSON.stringify({ tag_name: "v0.12.0" }), { status: 200 });
    }) as unknown as typeof fetch;
    const result = await checkForUpdate(fake, [0, 11, 0]);
    expect(result.state).toBe("newer");
    expect(calls).toHaveLength(1);
    const [url, init] = calls[0]!;
    expect(url).toBe(RELEASES_API);
    expect(init?.method).toBe("GET");
    expect(init?.credentials).toBe("omit");
    expect(init?.referrerPolicy).toBe("no-referrer");
    expect(init?.body).toBeUndefined();
  });

  it("never throws: no internet just means it can't tell", async () => {
    const offline = (async () => {
      throw new TypeError("Failed to fetch");
    }) as unknown as typeof fetch;
    expect(await checkForUpdate(offline, [0, 11, 0])).toEqual({ state: "unknown" });
    const notFound = (async () => new Response("{}", { status: 404 })) as unknown as typeof fetch;
    expect(await checkForUpdate(notFound, [0, 11, 0])).toEqual({ state: "unknown" });
  });

  it("does nothing on the web version, which updates by itself", async () => {
    let asked = false;
    const fake = (async () => {
      asked = true;
      return new Response("{}");
    }) as unknown as typeof fetch;
    expect(await checkForUpdate(fake)).toEqual({ state: "unknown" });
    expect(asked).toBe(false);
  });
});
