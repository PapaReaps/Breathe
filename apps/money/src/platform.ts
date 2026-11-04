import { Capacitor } from "@capacitor/core";

/** True inside the Android app (see docs/ANDROID-APP.md); false in a web browser. */
export function isNativeApp(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}
