import { useCallback, useEffect, useRef, useState } from "react";
import { LOCK_AFTER_HIDDEN_MS, LOCK_KEY, makeLockRecord, pauseAfterWrongTries, pinMatches, readLockRecord } from "./appLock";
import type { LockRecord } from "./appLock";
import { indexedDbStore } from "./deviceStore";
import type { DeviceStore } from "./deviceStore";

/** checking: reading the device. locked: the privacy screen is showing. open: the app is showing. */
export type LockStatus = "checking" | "locked" | "open";

export type UnlockResult = "open" | "wrong" | "wait";

export interface LockApi {
  status: LockStatus;
  /** Is the privacy screen switched on? */
  isOn: boolean;
  /** While a pause after wrong tries is running, the time it ends (as Date.now()). */
  waitUntil: number | null;
  unlock: (pin: string) => Promise<UnlockResult>;
  /** Resolves to false if the device couldn't keep the PIN check. */
  turnOn: (pin: string) => Promise<boolean>;
  turnOff: () => Promise<boolean>;
  lockNow: () => void;
}

/** The optional privacy screen. Off unless the person switches it on in Settings. */
export function useAppLock(store: DeviceStore = indexedDbStore): LockApi {
  const [status, setStatus] = useState<LockStatus>("checking");
  const [record, setRecord] = useState<LockRecord | null>(null);
  // A lock is saved but can't be read: keep the screen up (only "Forgotten your PIN?" opens it).
  const [unreadable, setUnreadable] = useState(false);
  const [waitUntil, setWaitUntil] = useState<number | null>(null);
  const wrongTries = useRef(0);
  const hiddenAt = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    store
      .load(LOCK_KEY)
      .then((raw) => {
        if (cancelled) return;
        if (raw === null) {
          setStatus("open");
          return;
        }
        const saved = readLockRecord(raw);
        setRecord(saved);
        setUnreadable(saved === null);
        setStatus("locked");
      })
      .catch(() => {
        // The device can't be read at all, so nothing can have been saved there: no lock.
        if (!cancelled) setStatus("open");
      });
    return () => {
      cancelled = true;
    };
  }, [store]);

  const isOn = record !== null || unreadable;

  // Coming back after a while away asks for the PIN again.
  useEffect(() => {
    if (!isOn) return;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt.current = Date.now();
      } else if (hiddenAt.current !== null) {
        if (Date.now() - hiddenAt.current >= LOCK_AFTER_HIDDEN_MS) setStatus("locked");
        hiddenAt.current = null;
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [isOn]);

  const unlock = useCallback(
    async (pin: string): Promise<UnlockResult> => {
      if (waitUntil !== null && Date.now() < waitUntil) return "wait";
      if (record !== null && (await pinMatches(record, pin))) {
        wrongTries.current = 0;
        setWaitUntil(null);
        setStatus("open");
        return "open";
      }
      wrongTries.current += 1;
      const pause = pauseAfterWrongTries(wrongTries.current);
      setWaitUntil(pause > 0 ? Date.now() + pause : null);
      return pause > 0 ? "wait" : "wrong";
    },
    [record, waitUntil],
  );

  const turnOn = useCallback(
    async (pin: string) => {
      try {
        const next = await makeLockRecord(pin);
        await store.save(next, LOCK_KEY);
        setRecord(next);
        setUnreadable(false);
        return true;
      } catch {
        return false;
      }
    },
    [store],
  );

  const turnOff = useCallback(async () => {
    try {
      await store.remove(LOCK_KEY);
      setRecord(null);
      setUnreadable(false);
      wrongTries.current = 0;
      setWaitUntil(null);
      setStatus("open");
      return true;
    } catch {
      return false;
    }
  }, [store]);

  const lockNow = useCallback(() => {
    if (isOn) setStatus("locked");
  }, [isOn]);

  return { status, isOn, waitUntil, unlock, turnOn, turnOff, lockNow };
}
