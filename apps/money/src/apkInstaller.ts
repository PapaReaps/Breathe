import { registerPlugin } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";

/** The Android code in ApkInstallerPlugin.java. Only used inside the Android app. */
interface ApkInstallerPlugin {
  download(options: { url: string }): Promise<void>;
  install(): Promise<{ needsPermission: boolean }>;
  openInstallSettings(): Promise<void>;
  tidyUp(): Promise<void>;
  addListener(event: "progress", listener: (data: { percent: number }) => void): Promise<PluginListenerHandle>;
}

export const ApkInstaller = registerPlugin<ApkInstallerPlugin>("ApkInstaller");
