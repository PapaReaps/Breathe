import { useCallback, useEffect, useState } from "react";
import { isNativeApp } from "./platform";
import { checkForUpdate, dueForCheck, installedVersion, noteChecked, versionText } from "./updates";
import type { UpdateResult } from "./updates";

/*
 * The note on the home screen opens App options at the Updates section, where
 * "Download and install" is. This remembers that it should scroll there once.
 */
let showUpdatesNext = false;
export function openUpdatesNext(): void {
  showUpdatesNext = true;
}
export function takeShowUpdates(): boolean {
  const answer = showUpdatesNext;
  showUpdatesNext = false;
  return answer;
}

export interface UpdatesApi {
  /** Only the Android app checks; the web version updates by itself. */
  available: boolean;
  checking: boolean;
  /** The last answer, or null if nothing has been checked yet. */
  result: UpdateResult | null;
  checkNow: () => Promise<void>;
  /** The version on this phone, like "0.16.0". Null on the web, or until Android says. */
  installed: string | null;
}

/** Checks for a newer Android version: once a day on opening if switched on, or when asked. */
export function useUpdates(enabled: boolean): UpdatesApi {
  const available = isNativeApp();
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<UpdateResult | null>(null);
  const [installed, setInstalled] = useState<string | null>(null);

  // A new version that was downloaded and installed has done its job: tidy the file away.
  // (If the app is opened again before installing, Download and install simply fetches it again.)
  useEffect(() => {
    if (!available) return;
    void import("./apkInstaller").then(({ ApkInstaller }) => ApkInstaller.tidyUp()).catch(() => undefined);
  }, [available]);

  useEffect(() => {
    if (!available) return;
    let cancelled = false;
    installedVersion().then((version) => {
      if (!cancelled && version !== null) setInstalled(versionText(version));
    });
    return () => {
      cancelled = true;
    };
  }, [available]);

  const checkNow = useCallback(async () => {
    if (!available) return;
    setChecking(true);
    const answer = await checkForUpdate();
    if (answer.state !== "unknown") noteChecked();
    setResult(answer);
    setChecking(false);
  }, [available]);

  useEffect(() => {
    if (!available || !enabled || !dueForCheck()) return;
    let cancelled = false;
    checkForUpdate().then((answer) => {
      if (cancelled) return;
      if (answer.state !== "unknown") noteChecked();
      setResult(answer);
    });
    return () => {
      cancelled = true;
    };
  }, [available, enabled]);

  return { available, checking, result, checkNow, installed };
}
