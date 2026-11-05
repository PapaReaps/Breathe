import { useCallback, useEffect, useState } from "react";
import { isNativeApp } from "./platform";
import { checkForUpdate, dueForCheck, noteChecked } from "./updates";
import type { UpdateResult } from "./updates";

export interface UpdatesApi {
  /** Only the Android app checks; the web version updates by itself. */
  available: boolean;
  checking: boolean;
  /** The last answer, or null if nothing has been checked yet. */
  result: UpdateResult | null;
  checkNow: () => Promise<void>;
}

/** Checks for a newer Android version: once a day on opening if switched on, or when asked. */
export function useUpdates(enabled: boolean): UpdatesApi {
  const available = isNativeApp();
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<UpdateResult | null>(null);

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

  return { available, checking, result, checkNow };
}
