/*
 * Breathe Money: the offline helper (a "service worker").
 *
 * What it does: after your first visit it keeps a copy of the app's own files on this
 * device, so the app opens with no internet, and can be added to a home screen.
 *
 * What it never does: it never contacts any other website, never reads or stores your
 * numbers (those live in the browser's own storage, untouched), and sends nothing anywhere.
 *
 * How it stays up to date: whenever the app is opened online it checks for the newest page
 * (asking the website itself, not the browser's short-lived copy), and fetches it,
 * keeps any new files it names, and removes copies of files that are no longer used.
 * The app's own files have a fingerprint in their name, so a changed file is a new name.
 */

const CACHE = "breathe-money-app";
const SCOPE = self.registration.scope;

/** Files with a fingerprint in the name (like assets/index-AbC123xy.js) never change, so keep them. */
const FINGERPRINTED = /\/assets\/[^/]+-[A-Za-z0-9_-]{8,}\.[a-z0-9]+$/;

/** The files a page names: scripts, styles, icons and the manifest, from this app's own address only. */
function filesNamedBy(html) {
  const files = new Set([SCOPE]);
  for (const match of html.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/g)) {
    try {
      const url = new URL(match[1], SCOPE);
      url.hash = "";
      if (url.origin === location.origin && url.href.startsWith(SCOPE)) files.add(url.href);
    } catch {
      // not an address we understand: skip it
    }
  }
  return [...files];
}

/** Keeps the newest files named by the page, and deletes copies nothing uses any more. */
async function syncFrom(html) {
  const cache = await caches.open(CACHE);
  const wanted = filesNamedBy(html);
  // The manifest names the home screen icons, so keep those too.
  const manifestUrl = wanted.find((url) => new URL(url).pathname.endsWith(".webmanifest"));
  if (manifestUrl) {
    try {
      const manifest = await (await fetch(manifestUrl, { cache: "reload" })).json();
      for (const icon of manifest.icons || []) {
        const url = new URL(icon.src, manifestUrl);
        if (url.origin === location.origin && url.href.startsWith(SCOPE) && !wanted.includes(url.href)) wanted.push(url.href);
      }
    } catch {
      // no manifest to read right now: carry on without it
    }
  }
  await Promise.all(
    wanted
      .filter((url) => url !== SCOPE)
      .map(async (url) => {
        if (FINGERPRINTED.test(new URL(url).pathname) && (await cache.match(url))) return;
        const response = await fetch(url, { cache: "reload" });
        if (response.ok) await cache.put(url, response);
      }),
  );
  for (const request of await cache.keys()) {
    if (!wanted.includes(request.url)) await cache.delete(request);
  }
}

async function freshPage() {
  const response = await fetch(SCOPE, { cache: "reload" });
  if (!response.ok) throw new Error("page not available");
  const cache = await caches.open(CACHE);
  await cache.put(SCOPE, response.clone());
  await syncFrom(await response.text());
}

self.addEventListener("install", (event) => {
  event.waitUntil(freshPage().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) {
        if (name.startsWith("breathe-money-") && name !== CACHE) await caches.delete(name);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== location.origin || !url.href.startsWith(SCOPE)) return;

  // Opening the app: the newest page if we are online, the saved page if we are not.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          // Always ask the website whether the page has changed, rather than trusting the browser's
          // own 10-minute copy, so a new version shows the next time the app is opened.
          // (A navigation request can't be given options, so its address is used instead.)
          const response = await fetch(request.url, { cache: "no-cache", credentials: "same-origin" });
          if (response.ok) {
            const cache = await caches.open(CACHE);
            await cache.put(SCOPE, response.clone());
            event.waitUntil(response.clone().text().then(syncFrom).catch(() => {}));
          }
          return response;
        } catch {
          const saved = await caches.match(SCOPE);
          if (saved) return saved;
          throw new Error("offline and nothing saved yet");
        }
      })(),
    );
    return;
  }

  // Everything else: the saved copy first, and save it if we had to fetch it.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const saved = await cache.match(request);
      if (saved) return saved;
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    })(),
  );
});
