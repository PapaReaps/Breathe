import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/*
 * Stage 10: installable, offline, and published for free.
 * These check the files that make that work, and that nothing in them reaches out to
 * other websites or touches your numbers.
 */

const appDir = fileURLToPath(new URL("../", import.meta.url));
const repoDir = fileURLToPath(new URL("../../../", import.meta.url));
const read = (path: string): string => readFileSync(appDir + path, "utf8");

/** Width and height written inside a PNG file. */
function pngSize(path: string): { width: number; height: number } {
  const bytes = readFileSync(appDir + path);
  const signature = bytes.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") throw new Error(`${path} is not a PNG`);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

describe("the app manifest (what lets it be added to a home screen)", () => {
  const manifest = JSON.parse(read("public/manifest.webmanifest"));

  it("has a name, opens full screen, and starts from wherever it is published", () => {
    expect(manifest.name).toBe("Breathe Money");
    expect(manifest.short_name.length).toBeLessThanOrEqual(12);
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("./");
    expect(manifest.scope).toBe("./");
    expect(manifest.lang).toBe("en-GB");
  });

  it("uses plain colours that match the app", () => {
    expect(/^#[0-9a-f]{6}$/i.test(manifest.theme_color)).toBe(true);
    expect(/^#[0-9a-f]{6}$/i.test(manifest.background_color)).toBe(true);
  });

  it("lists icons that exist and are exactly the size they say", () => {
    expect(manifest.icons.length).toBeGreaterThanOrEqual(3);
    for (const icon of manifest.icons) {
      expect(icon.src.startsWith("/")).toBe(false); // relative, so it works at any web address
      expect(existsSync(appDir + "public/" + icon.src)).toBe(true);
      const [w, h] = icon.sizes.split("x").map(Number);
      expect(pngSize("public/" + icon.src)).toEqual({ width: w, height: h });
    }
    const purposes = manifest.icons.map((i: { purpose?: string; sizes: string }) => `${i.sizes}:${i.purpose ?? "any"}`);
    expect(purposes).toContain("192x192:any");
    expect(purposes).toContain("512x512:any");
    expect(purposes).toContain("512x512:maskable");
  });

  it("has an icon for iPhones and a small one for the browser tab", () => {
    expect(pngSize("public/apple-touch-icon.png")).toEqual({ width: 180, height: 180 });
    expect(existsSync(appDir + "public/favicon.svg")).toBe(true);
  });
});

describe("the page", () => {
  const html = read("index.html");

  it("links the manifest, the icons and a theme colour, none pointing at other websites", () => {
    expect(html).toContain('rel="manifest"');
    expect(html).toContain('rel="icon"');
    expect(html).toContain('rel="apple-touch-icon"');
    expect(html).toContain('name="theme-color"');
    for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const address = match[1]!;
      expect(address.startsWith("http")).toBe(false);
    }
    expect(html).toContain('href="/manifest.webmanifest"');
  });

  it("is published with relative addresses, so it works at any web address", () => {
    expect(read("vite.config.ts")).toContain('base: "./"');
  });

  it("registers the helper from the app itself (and only when published)", () => {
    expect(existsSync(appDir + "src/registerServiceWorker.ts")).toBe(true);
    const app = read("src/App.tsx");
    expect(app).toContain("registerServiceWorker");
    expect(app).toContain("import.meta.env.PROD");
  });
});

describe("the offline helper (service worker)", () => {
  const worker = read("public/sw.js");

  it("never contacts any other website", () => {
    expect(/https?:\/\//.test(worker)).toBe(false);
    expect(worker).toContain("location.origin"); // it only handles files from its own address
  });

  it("never touches your numbers", () => {
    for (const word of ["indexedDB", "localStorage", "sessionStorage", "postMessage", "navigator.sendBeacon"]) {
      expect(worker.includes(word)).toBe(false);
    }
  });

  it("only keeps plain page loads, nothing else", () => {
    expect(worker).toContain('request.method !== "GET"');
  });

  it("takes over on the next open and removes old copies", () => {
    expect(worker).toContain("skipWaiting");
    expect(worker).toContain("clients.claim");
    expect(worker).toContain("cache.delete");
  });
});

describe("publishing for free on GitHub Pages", () => {
  const workflowPath = repoDir + ".github/workflows/deploy.yml";

  it("the publish recipe exists", () => {
    expect(existsSync(workflowPath)).toBe(true);
  });

  it("runs the tests first, then builds, then publishes only the built app", () => {
    const text = readFileSync(workflowPath, "utf8");
    expect(text).toContain("npm test");
    expect(text).toContain("npm run build");
    expect(text.indexOf("npm test")).toBeLessThan(text.indexOf("npm run build"));
    expect(text).toContain("actions/deploy-pages");
    expect(text).toContain("apps/money/dist");
    expect(text).toContain("pages: write");
  });

  it("needs no passwords or secrets", () => {
    const text = readFileSync(workflowPath, "utf8");
    expect(text.includes("secrets.")).toBe(false);
  });
});
