import type { CapacitorConfig } from "@capacitor/cli";

/*
 * The Android app. It is the same app as the web version: the built files in dist/ are packed
 * inside it, so it opens and works with no internet. Reminders are set on the phone itself.
 */
const config: CapacitorConfig = {
  appId: "io.github.papareaps.breathe.medication",
  appName: "Breathe Medication",
  webDir: "dist",
  android: {
    allowMixedContent: false,
    captureInput: false,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    LocalNotifications: {
      // The Breathe rings, tinted sage (android/app/src/main/res/drawable/ic_stat_breathe.xml).
      smallIcon: "ic_stat_breathe",
      iconColor: "#45615A",
    },
  },
};

export default config;
