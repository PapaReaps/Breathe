/**
 * Asks the browser to keep the app's own files for offline use (see public/sw.js).
 * If the browser can't or won't, nothing changes: the app simply works online as before.
 */
export function registerServiceWorker(address: string): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  const start = () => {
    navigator.serviceWorker.register(address).catch(() => {
      // Not available here (for example a private window). The app still works.
    });
  };
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
}
