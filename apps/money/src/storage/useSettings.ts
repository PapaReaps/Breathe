import { useCallback, useEffect, useState } from "react";
import { indexedDbStore } from "./deviceStore";
import type { DeviceStore } from "./deviceStore";
import { DEFAULT_SETTINGS, SETTINGS_KEY, applySettings, readSettings, toSavedSettings } from "./settings";
import type { Settings } from "./settings";
import { matchSystemBars } from "../platform";
import { setTapFeedback } from "../feedback";

/** How the app looks (light or dark, and the colours). Applied straight away and remembered on this device. */
export function useSettings(store: DeviceStore = indexedDbStore) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  /** True once the saved settings have been read (or there were none to read). */
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    store
      .load(SETTINGS_KEY)
      .then((raw) => {
        if (cancelled) return;
        const saved = readSettings(raw);
        setSettings(saved);
        applySettings(saved);
        matchSystemBars(saved.appearance);
        setTapFeedback(saved.clickSound, saved.vibration);
        setLoaded(true);
      })
      .catch(() => {
        /* No storage: keep the defaults. */
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [store]);

  const change = useCallback(
    (patch: Partial<Settings>) => {
      setSettings((current) => {
        const next = { ...current, ...patch };
        applySettings(next);
        matchSystemBars(next.appearance);
        setTapFeedback(next.clickSound, next.vibration);
        store.save(toSavedSettings(next), SETTINGS_KEY).catch(() => {
          /* It still applies for now; it just won't be remembered. */
        });
        return next;
      });
    },
    [store],
  );

  return { settings, change, loaded };
}
