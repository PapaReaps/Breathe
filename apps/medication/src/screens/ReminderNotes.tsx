import { words } from "../content/words";
import type { Reminders } from "../storage/useReminders";

const r = words.reminders;

/**
 * The calm notes about reminders: the one-time "Would you like reminders?", and, only if needed,
 * that Android has them switched off, or that they may come a little late. Android app only.
 */
export function ReminderNotes({ reminders, hasMedicines }: { reminders: Reminders; hasMedicines: boolean }) {
  if (!reminders.possible || !hasMedicines) return null;
  const { settings, notes, onTime } = reminders;

  if (!settings.asked) {
    return (
      <section className="reminder-note" aria-labelledby="reminder-ask">
        <h2 id="reminder-ask">{r.askTitle}</h2>
        <p>{r.askText}</p>
        <div className="sheet-buttons">
          <button type="button" onClick={() => void reminders.turnOn()}>
            {r.askYes}
          </button>
          <button type="button" className="secondary" onClick={() => reminders.change({ asked: true, on: false })}>
            {r.askNo}
          </button>
        </div>
      </section>
    );
  }
  if (settings.on && notes === "denied") {
    return (
      <section className="reminder-note" aria-labelledby="reminder-denied">
        <h2 id="reminder-denied">{r.deniedTitle}</h2>
        <p>{r.deniedText}</p>
      </section>
    );
  }
  if (settings.on && notes === "granted" && onTime === "denied") {
    return (
      <section className="reminder-note" aria-labelledby="reminder-late">
        <h2 id="reminder-late">{r.lateTitle}</h2>
        <p>{r.lateText}</p>
        <button type="button" className="secondary" onClick={() => void reminders.openOnTimeSetting()}>
          {r.lateButton}
        </button>
      </section>
    );
  }
  return null;
}

/** The Reminders page in the menu: on or off, the nudge, and help if they don't come. */
export function ReminderSettings({ reminders }: { reminders: Reminders }) {
  if (!reminders.possible) return <p>{r.webText}</p>;
  const { settings } = reminders;
  return (
    <>
      <div className="switch-row">
        <input
          id="rem-on"
          type="checkbox"
          role="switch"
          checked={settings.on}
          onChange={(event) => {
            if (event.target.checked) void reminders.turnOn();
            else reminders.change({ on: false, asked: true });
          }}
        />
        <div>
          <label htmlFor="rem-on">{r.switchOn}</label>
          <p className="hint">{r.switchOnHint}</p>
        </div>
      </div>
      <div className="switch-row">
        <input
          id="rem-nudge"
          type="checkbox"
          role="switch"
          checked={settings.nudge}
          disabled={!settings.on}
          onChange={(event) => reminders.change({ nudge: event.target.checked })}
        />
        <div>
          <label htmlFor="rem-nudge">{r.nudge}</label>
          <p className="hint">{r.nudgeHint}</p>
        </div>
      </div>
      <ReminderNotes reminders={{ ...reminders, settings: { ...settings, asked: true } }} hasMedicines />
      <p className="hint">{r.batteryTip}</p>
    </>
  );
}
