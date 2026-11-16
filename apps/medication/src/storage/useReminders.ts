import { useCallback, useEffect, useRef, useState } from "react";
import { dayKey, dosesFor, setTaken, type MedicationData } from "../logic/medicines";
import { DEFAULT_REMINDERS, planReminders, readReminderSettings, takenFromReminder, type ReminderSettings } from "../logic/reminders";
import { allowed, askToNotify, canRemind, clearReminders, onBackToApp, onTakenTapped, openOnTimeSetting, prepare, setReminders, type Allowed } from "../notify";
import { indexedDbStore, type DeviceStore } from "./deviceStore";

const KEY = "reminders";

export interface Reminders {
  /** This is the Android app, so reminders can pop up. */
  possible: boolean;
  settings: ReminderSettings;
  /** Notifications allowed by Android. */
  notes: Allowed;
  /** "Alarms and reminders" allowed, so they come on time. */
  onTime: Allowed;
  change: (patch: Partial<ReminderSettings>) => void;
  /** Says yes to reminders: asks Android, then switches them on. */
  turnOn: () => Promise<void>;
  openOnTimeSetting: () => Promise<void>;
}

/** Days and times (like "2026-11-16@08:00") where every dose is ticked. */
function finishedSlots(data: MedicationData, now: Date): Set<string> {
  const done = new Set<string>();
  for (let back = 0; back < 2; back += 1) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - back);
    const byTime = new Map<string, boolean>();
    for (const dose of dosesFor(data, day)) byTime.set(dose.time, (byTime.get(dose.time) ?? true) && dose.taken);
    for (const [time, all] of byTime) if (all) done.add(`${dayKey(day)}@${time}`);
  }
  return done;
}

/** Keeps the phone's reminders in step with the medicines and ticks. */
export function useReminders(
  data: MedicationData,
  loading: boolean,
  update: (change: (data: MedicationData) => MedicationData) => void,
  store: DeviceStore = indexedDbStore,
): Reminders {
  const possible = canRemind();
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_REMINDERS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [notes, setNotes] = useState<Allowed>("unknown");
  const [onTime, setOnTime] = useState<Allowed>("unknown");
  const [wake, setWake] = useState(0);
  const latestData = useRef(data);
  latestData.current = data;

  useEffect(() => {
    store.load(KEY).then(
      (raw) => {
        setSettings(readReminderSettings(raw));
        setSettingsLoaded(true);
      },
      () => setSettingsLoaded(true),
    );
  }, [store]);

  const recheck = useCallback(async () => {
    const now = await allowed();
    setNotes(now.notes);
    setOnTime(now.onTime);
  }, []);

  // On opening, and each time the app comes back to the front: re-check, and top up reminders.
  useEffect(() => {
    if (!possible) return;
    void prepare();
    void recheck();
    let stop = () => {};
    void onBackToApp(() => {
      void recheck();
      setWake((n) => n + 1);
    }).then((s) => (stop = s));
    return () => stop();
  }, [possible, recheck]);

  // Taken on a reminder: tick everything due at that time.
  useEffect(() => {
    if (!possible) return;
    let stop = () => {};
    void onTakenTapped((day, time) => {
      update((d) => {
        const found = takenFromReminder(d, day, time, new Date());
        if (!found) return d;
        return found.keys.reduce((acc, key) => setTaken(acc, found.day, key, true), d);
      });
    }).then((s) => (stop = s));
    return () => stop();
  }, [possible, update]);

  // Whenever the medicines, ticks or settings change: set the reminders again (shortly, so a
  // burst of changes only does it once).
  useEffect(() => {
    if (!possible || loading || !settingsLoaded) return;
    const timer = setTimeout(() => {
      const now = new Date();
      if (!settings.on || notes === "denied") {
        void clearReminders();
        return;
      }
      if (notes !== "granted") return;
      void setReminders(planReminders(latestData.current, settings, now), onTime === "granted", finishedSlots(latestData.current, now));
    }, 400);
    return () => clearTimeout(timer);
  }, [possible, loading, settingsLoaded, settings, notes, onTime, data, wake]);

  const change = useCallback(
    (patch: Partial<ReminderSettings>) => {
      setSettings((old) => {
        const next = { ...old, ...patch };
        void store.save(next, KEY).catch(() => undefined);
        return next;
      });
    },
    [store],
  );

  const turnOn = useCallback(async () => {
    const answer = notes === "granted" ? "granted" : await askToNotify();
    setNotes(answer);
    change({ asked: true, on: answer === "granted" });
    await recheck();
  }, [change, notes, recheck]);

  return { possible, settings, notes, onTime, change, turnOn, openOnTimeSetting };
}
