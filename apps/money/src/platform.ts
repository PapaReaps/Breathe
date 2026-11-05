import { Capacitor, SystemBars, SystemBarsStyle } from "@capacitor/core";

/** True inside the Android app (see docs/ANDROID-APP.md); false in a web browser. */
export function isNativeApp(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/**
 * In the Android app: make the phone's status bar and button icons readable on the app's
 * own light or dark colours, even when the person chose a different look in Settings from
 * the phone's. On the web this does nothing.
 */
export function matchSystemBars(appearance: "system" | "light" | "dark"): void {
  if (!isNativeApp()) return;
  const style =
    appearance === "dark" ? SystemBarsStyle.Dark : appearance === "light" ? SystemBarsStyle.Light : SystemBarsStyle.Default;
  SystemBars.setStyle({ style }).catch(() => {
    /* Older phones: the icons keep the phone's own colours. */
  });
}
