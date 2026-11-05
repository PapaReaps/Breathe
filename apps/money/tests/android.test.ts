import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const appDir = fileURLToPath(new URL("../", import.meta.url));
const repoDir = fileURLToPath(new URL("../../../", import.meta.url));
const read = (path: string): string => readFileSync(appDir + path, "utf8");

describe("the Android app", () => {
  it("packs the same built web app inside it", () => {
    const config = read("capacitor.config.ts");
    expect(config).toContain('webDir: "dist"');
    expect(config).toContain('appName: "Breathe Money"');
  });

  it("never copies your numbers to Google Drive or a new phone", () => {
    const manifest = read("android/app/src/main/AndroidManifest.xml");
    expect(manifest).toContain('android:allowBackup="false"');
    expect(manifest).toContain('android:fullBackupContent="false"');
    const rules = read("android/app/src/main/res/xml/data_extraction_rules.xml");
    expect(rules).toContain("<cloud-backup>");
    expect(rules).toContain("<device-transfer>");
  });

  it("asks for no permissions beyond showing its own pages", () => {
    const manifest = read("android/app/src/main/AndroidManifest.xml");
    const permissions = [...manifest.matchAll(/uses-permission android:name="([^"]+)"/g)].map((m) => m[1]);
    expect(permissions).toEqual(["android.permission.INTERNET"]);
  });

  it("opens with the same calm colours as the web app, in light and dark", () => {
    expect(read("android/app/src/main/res/values/colors.xml")).toContain("#F6F5F1");
    expect(read("android/app/src/main/res/values-night/colors.xml")).toContain("#151B1E");
  });

  it("keeps the signing key out of the code", () => {
    const gradle = read("android/app/build.gradle");
    expect(gradle).toContain('System.getenv("BREATHE_KEYSTORE_FILE")');
    expect(/storePassword\s+["']/.test(gradle)).toBe(false);
  });
});

describe("the Android build recipe", () => {
  const text = readFileSync(repoDir + ".github/workflows/android.yml", "utf8");

  it("runs the tests before building anything", () => {
    expect(text.indexOf("npm test")).toBeGreaterThan(-1);
    expect(text.indexOf("npm test")).toBeLessThan(text.indexOf("gradlew"));
  });

  it("only uses the signing key for version tags, and removes it afterwards", () => {
    expect(text).toContain("secrets.ANDROID_KEYSTORE_BASE64");
    expect(text).toContain('rm -f "$BREATHE_KEYSTORE_FILE"');
    expect(text).toContain("if: steps.version.outputs.release == 'true'");
  });
});

describe("the opening breath", () => {
  const html = read("index.html");

  it("is there, about three seconds at most, and still for people who ask for less motion", () => {
    expect(html).toContain('id="splash"');
    expect(html).toContain("prefers-reduced-motion: reduce");
    const breath = Number(html.match(/var breath = calm \? 0 : (\d+);/)?.[1]);
    expect(breath).toBeGreaterThan(0);
    expect(breath).toBeLessThanOrEqual(3000);
  });

  it("can never get stuck", () => {
    expect(html).toMatch(/setTimeout\(remove, \d+\)/);
  });

  it("is hidden from screen readers", () => {
    expect(html).toContain('<div id="splash" aria-hidden="true">');
  });
});

it("no signing key file is anywhere in the project", () => {
  for (const name of ["breathe-release.p12", "release.keystore", "breathe.jks"]) {
    expect(existsSync(appDir + name)).toBe(false);
    expect(existsSync(appDir + "android/" + name)).toBe(false);
  }
});

describe("the opening font", () => {
  it("is inside the app with its licence, never fetched from another website", () => {
    expect(existsSync(appDir + "public/fonts/nunito.woff2")).toBe(true);
    expect(existsSync(appDir + "public/fonts/NUNITO-LICENSE.txt")).toBe(true);
    const html = read("index.html");
    expect(html).toContain('src: url("fonts/nunito.woff2")');
    expect(html.includes("fonts.googleapis.com")).toBe(false);
    expect(html.includes("fonts.gstatic.com")).toBe(false);
  });
});
