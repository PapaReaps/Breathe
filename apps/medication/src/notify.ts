/*
 * The phone side of reminders (Android app only). Uses Capacitor's own Local Notifications
 * add-on: everything is set on the phone itself. There is no server and nothing is sent anywhere.
 *
 * On the web these all quietly do nothing: a website can't wake the phone at a set time.
 */

import { Capacitor } from "@capacitor/core";
import type { PlannedReminder } from "./logic/reminders";

export type Allowed = "granted" | "denied" | "ask" | "unknown";

export function canRemind(): boolean {
  return Capacitor.isNativePlatform();
}

const CHANNEL = "reminders";
const ACTIONS = "dose";
const SMALL_ICON = "ic_stat_breathe";
const ICON_COLOUR = "#45615A";

async function plugin() {
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  return LocalNotifications;
}

function read(state: string | undefined): Allowed {
  if (state === "granted") return "granted";
  if (state === "denied") return "denied";
  if (state === "prompt" || state === "prompt-with-rationale") return "ask";
  return "unknown";
}

let ready: Promise<void> | null = null;

/** The reminders channel (private on the lock screen) and the Taken / Later buttons. Once per opening. */
export function prepare(): Promise<void> {
  if (!canRemind()) return Promise.resolve();
  if (ready === null) {
    ready = (async () => {
      const notes = await plugin();
      await notes.createChannel({
        id: CHANNEL,
        name: "Medicine reminders",
        description: "A gentle note at each time you take your medicines.",
        importance: 4,
        visibility: 0,
        vibration: true,
      });
      await notes.registerActionTypes({
        types: [
          {
            id: ACTIONS,
            actions: [
              { id: "taken", title: "Taken", foreground: true },
              { id: "later", title: "Later", foreground: false },
            ],
          },
        ],
      });
    })().catch(() => {
      ready = null;
    });
  }
  return ready;
}

/** May the app show notifications, and set them on time? */
export async function allowed(): Promise<{ notes: Allowed; onTime: Allowed }> {
  if (!canRemind()) return { notes: "unknown", onTime: "unknown" };
  try {
    const notes = await plugin();
    const display = read((await notes.checkPermissions()).display);
    let onTime: Allowed = "unknown";
    try {
      onTime = read((await notes.checkExactNotificationSetting()).exact_alarm);
    } catch {
      onTime = "unknown";
    }
    return { notes: display, onTime };
  } catch {
    return { notes: "unknown", onTime: "unknown" };
  }
}

/** Android's own "Allow notifications?" question. */
export async function askToNotify(): Promise<Allowed> {
  if (!canRemind()) return "unknown";
  try {
    const notes = await plugin();
    return read((await notes.requestPermissions()).display);
  } catch {
    return "unknown";
  }
}

/** Opens Android's "Alarms and reminders" setting for this app, so reminders come on time. */
export async function openOnTimeSetting(): Promise<void> {
  if (!canRemind()) return;
  try {
    const notes = await plugin();
    await notes.changeExactNotificationSetting();
  } catch {
    // Nothing to do: the calm note stays on screen.
  }
}

/**
 * Replaces every waiting reminder with the new plan. Reminders for doses already ticked are
 * also cleared from the notification shade. `onTime` false sets them as "about then" alarms,
 * so Android never jumps to its settings screen by itself.
 */
export async function setReminders(plan: PlannedReminder[], onTime: boolean, doneSlots: Set<string>): Promise<boolean> {
  if (!canRemind()) return false;
  try {
    await prepare();
    const notes = await plugin();
    const pending = await notes.getPending();
    if (pending.notifications.length > 0) {
      await notes.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
    }
    if (plan.length > 0) {
      await notes.schedule({
        notifications: plan.map((r) => ({
          id: r.id,
          title: r.title,
          body: r.body,
          channelId: CHANNEL,
          actionTypeId: r.kind === "keep-going" ? undefined : ACTIONS,
          smallIcon: SMALL_ICON,
          iconColor: ICON_COLOUR,
          autoCancel: true,
          extra: { day: r.day, time: r.time, kind: r.kind },
          schedule: { at: r.at, allowWhileIdle: true },
          isExactNotification: onTime,
        })),
      });
    }
    // Clear reminders already showing for doses that have now been ticked.
    const shown = await notes.getDeliveredNotifications();
    const finished = shown.notifications.filter((n) => {
      const extra = (n.extra ?? {}) as { day?: unknown; time?: unknown };
      return typeof extra.day === "string" && typeof extra.time === "string" && doneSlots.has(`${extra.day}@${extra.time}`);
    });
    if (finished.length > 0) await notes.removeDeliveredNotifications({ notifications: finished });
    return true;
  } catch {
    return false;
  }
}

/** Stops every reminder (when they're switched off). */
export async function clearReminders(): Promise<void> {
  if (!canRemind()) return;
  try {
    const notes = await plugin();
    const pending = await notes.getPending();
    if (pending.notifications.length > 0) await notes.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
  } catch {
    // Nothing more to do.
  }
}

/** Calls back when Taken is tapped on a reminder (Android opens the app to do it). */
export async function onTakenTapped(callback: (day: string, time: string) => void): Promise<() => void> {
  if (!canRemind()) return () => {};
  try {
    const notes = await plugin();
    const handle = await notes.addListener("localNotificationActionPerformed", (action) => {
      if (action.actionId !== "taken") return;
      const extra = (action.notification.extra ?? {}) as { day?: unknown; time?: unknown };
      if (typeof extra.day === "string" && typeof extra.time === "string") callback(extra.day, extra.time);
    });
    return () => void handle.remove();
  } catch {
    return () => {};
  }
}

/** Calls back each time the app comes back to the front (to top up reminders and re-check settings). */
export async function onBackToApp(callback: () => void): Promise<() => void> {
  if (!canRemind()) return () => {};
  try {
    const { App } = await import("@capacitor/app");
    const handle = await App.addListener("appStateChange", (state) => {
      if (state.isActive) callback();
    });
    return () => void handle.remove();
  } catch {
    return () => {};
  }
}
