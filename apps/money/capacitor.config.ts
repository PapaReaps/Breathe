import type { CapacitorConfig } from "@capacitor/cli";

/*
 * The Android app (see docs/ANDROID-APP.md). It is the same app as the web version:
 * the built files in dist/ are packed inside it, so it opens and works with no internet.
 */
const config: CapacitorConfig = {
  appId: "io.github.papareaps.breathe.money",
  appName: "Breathe Money",
  webDir: "dist",
  android: {
    // No pull-to-refresh, no address bar, no text zoom surprises: it should feel like an app.
    allowMixedContent: false,
    captureInput: false,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    // Breathe Medication's reminders (v1.1.0): the Breathe rings as the small icon, in sage.
    LocalNotifications: {
      smallIcon: "ic_stat_breathe",
      iconColor: "#45615A",
    },
  },
};

export default config;
