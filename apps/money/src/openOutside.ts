import { isNativeApp } from "./platform";

/**
 * Opens a web page outside Breathe: over the app on Android (closing it comes straight back),
 * or in a new tab on the web. Only for addresses the caller has already checked.
 * Returns false if it couldn't open (no internet, for example).
 */
export async function openOutside(url: string): Promise<boolean> {
  try {
    if (isNativeApp()) {
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url, toolbarColor: "#1f5f5b" });
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    return true;
  } catch {
    return false;
  }
}
