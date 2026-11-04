import { useCallback, useEffect, useRef, useState } from "react";
import { emptyForm } from "../logic/form";
import type { FormState } from "../logic/form";
import { indexedDbStore } from "./deviceStore";
import type { DeviceStore } from "./deviceStore";
import { fromSaved, toSaved } from "./savedData";

/** idle: nothing to save yet. saving: on its way. saved: safely on this device. not-saved: the device said no. */
export type SaveState = "idle" | "saving" | "saved" | "not-saved";

const SAVE_DELAY_MS = 100;

/**
 * Holds the form and keeps it on this device.
 *
 * - Opening: reads what was saved. If it can't be read it starts fresh and says so,
 *   and does NOT overwrite the old copy until the person actually changes something.
 * - Changing: waits a tenth of a second after the last keystroke, then saves.
 *   (Short on purpose: a write that has already started has a far better chance of
 *   finishing if the tab is closed, than one still waiting to begin.)
 * - Leaving: saves straight away when the page is hidden or closed.
 */
export function useSavedForm(store: DeviceStore = indexedDbStore) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [readProblem, setReadProblem] = useState(false);

  const formRef = useRef(form);
  formRef.current = form;
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sequence = useRef(0);
  const askedForPersistence = useRef(false);

  // Open: read what was saved earlier.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await store.load();
        if (cancelled) return;
        if (raw !== null) {
          const saved = fromSaved(raw);
          if (saved === null) setReadProblem(true);
          else setForm(saved);
        }
        setPersisted(await store.isPersisted());
      } catch {
        if (!cancelled) setSaveState("not-saved");
      }
      if (!cancelled) setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [store]);

  const saveNow = useCallback(async () => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (!dirty.current) return;
    dirty.current = false;
    sequence.current += 1;
    const mine = sequence.current;
    setSaveState("saving");
    try {
      await store.save(toSaved(formRef.current));
      if (mine !== sequence.current) return; // a newer save has taken over
      setSaveState("saved");
      if (!askedForPersistence.current) {
        askedForPersistence.current = true;
        setPersisted(await store.requestPersistence());
      }
    } catch {
      if (mine !== sequence.current) return;
      dirty.current = true; // try again next time something changes or the page is hidden
      setSaveState("not-saved");
    }
  }, [store]);

  // Change: save shortly after the last edit.
  useEffect(() => {
    if (!loaded || !dirty.current) return;
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void saveNow();
    }, SAVE_DELAY_MS);
    return () => {
      if (timer.current !== null) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };
  }, [form, loaded, saveNow]);

  // Leave: don't wait when the page is being hidden or closed.
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === "hidden") void saveNow();
    };
    const flushAlways = () => {
      void saveNow();
    };
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", flushAlways);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", flushAlways);
    };
  }, [saveNow]);

  /** Every edit goes through here so we know there is something to save. */
  const update = useCallback((change: (current: FormState) => FormState) => {
    dirty.current = true;
    setForm(change);
  }, []);

  /** Swap in a whole new set of numbers (a restored backup) and save it at once. */
  const replaceAll = useCallback(
    (next: FormState) => {
      dirty.current = true;
      formRef.current = next;
      setForm(next);
      void saveNow();
    },
    [saveNow],
  );

  /** Forget everything, here and on the device. Resolves to true once the device copy is gone. */
  const clearAll = useCallback(async (): Promise<boolean> => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    dirty.current = false;
    sequence.current += 1;
    const mine = sequence.current;
    formRef.current = emptyForm();
    setForm(formRef.current);
    setReadProblem(false);
    try {
      await store.clear();
      if (mine === sequence.current) setSaveState("idle");
      return true;
    } catch {
      if (mine === sequence.current) setSaveState("not-saved");
      return false;
    }
  }, [store]);

  return { form, loaded, saveState, persisted, readProblem, update, replaceAll, clearAll };
}
