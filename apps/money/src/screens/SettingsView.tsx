import { PotBadge } from "../components/PotBadge";
import { words } from "../content/words";
import { useState } from "react";
import type { FormEvent } from "react";
import { checkNewPin } from "../storage/appLock";
import type { PinProblem } from "../storage/appLock";
import { ACCENTS, APPEARANCES, BALANCE_REMINDERS, CONTRASTS, DEFAULT_SETTINGS, POT_COLOURS, TEXT_SIZES } from "../storage/settings";
import type { LockApi } from "../storage/useAppLock";
import type { SettingsApi } from "./screenTypes";

const text = words.settings;

/** Settings: light or dark, the app colour, the rainy-day pot colour, reminders and the home screen. */
export function SettingsView({ settings }: { settings: SettingsApi }) {
  const { settings: current, change } = settings;
  return (
    <>
      <fieldset className="choice-group">
        <legend>{text.appearanceTitle}</legend>
        <p className="hint">{text.appearanceIntro}</p>
        {APPEARANCES.map((choice) => (
          <label key={choice} className="choice">
            <input
              type="radio"
              name="appearance"
              value={choice}
              checked={current.appearance === choice}
              onChange={() => change({ appearance: choice })}
            />
            <span>
              {text.options[choice]}
              {choice === "system" ? <span className="hint choice-hint">{text.systemHint}</span> : null}
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset className="choice-group settings-group">
        <legend>{text.textSizeTitle}</legend>
        <p className="hint">{text.textSizeIntro}</p>
        {TEXT_SIZES.map((choice) => (
          <label key={choice} className="choice">
            <input
              type="radio"
              name="text-size"
              value={choice}
              checked={current.textSize === choice}
              onChange={() => change({ textSize: choice })}
            />
            <span>{text.textSizes[choice]}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="choice-group settings-group">
        <legend>{text.contrastTitle}</legend>
        <p className="hint">{text.contrastIntro}</p>
        {CONTRASTS.map((choice) => (
          <label key={choice} className="choice">
            <input
              type="radio"
              name="contrast"
              value={choice}
              checked={current.contrast === choice}
              onChange={() => change({ contrast: choice })}
            />
            <span>
              {text.contrasts[choice]}
              {choice === "system" ? <span className="hint choice-hint">{text.contrastSystemHint}</span> : null}
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset className="choice-group settings-group">
        <legend>{text.accentTitle}</legend>
        <p className="hint">{text.accentIntro}</p>
        <div className="swatches">
          {ACCENTS.map((option) => (
            <label key={option.id} className="swatch">
              <input
                type="radio"
                name="accent"
                value={option.id}
                checked={current.accent === option.id}
                onChange={() => change({ accent: option.id })}
              />
              <span className="swatch-dot" style={{ background: option.swatch }} aria-hidden="true" />
              {text.accents[option.id]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="choice-group settings-group">
        <legend>{text.potTitle}</legend>
        <p className="hint">{text.potIntro}</p>
        <div className="swatches">
          {POT_COLOURS.map((option) => (
            <label key={option.id} className="swatch">
              <input
                type="radio"
                name="pot-colour"
                value={option.id}
                checked={current.potColour === option.id}
                onChange={() => change({ potColour: option.id })}
              />
              <span className="swatch-dot" style={{ background: option.swatch }} aria-hidden="true" />
              {text.potColours[option.id]}
            </label>
          ))}
        </div>
        <p className="hint">{text.potPreview}</p>
        <PotBadge amount={text.potPreviewAmount} />
      </fieldset>

      <fieldset className="choice-group settings-group">
        <legend>{text.reminderTitle}</legend>
        <p className="hint">{text.reminderIntro}</p>
        {BALANCE_REMINDERS.map((choice) => (
          <label key={choice} className="choice">
            <input
              type="radio"
              name="balance-reminder"
              value={choice}
              checked={current.balanceReminder === choice}
              onChange={() => change({ balanceReminder: choice })}
            />
            <span>
              {text.reminderOptions[choice]}
              {choice === DEFAULT_SETTINGS.balanceReminder ? (
                <span className="hint choice-hint">{text.reminderDefaultHint}</span>
              ) : null}
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset className="choice-group settings-group">
        <legend>{text.homeTitle}</legend>
        <p className="hint">{text.homeIntro}</p>
        <label className="choice">
          <input
            type="checkbox"
            checked={current.showExplanation}
            onChange={(event) => change({ showExplanation: event.target.checked })}
          />
          <span>{text.showExplanation}</span>
        </label>
        <label className="choice">
          <input
            type="checkbox"
            checked={current.showPayday}
            onChange={(event) => change({ showPayday: event.target.checked })}
          />
          <span>{text.showPayday}</span>
        </label>
      </fieldset>

      <PrivacyScreenSettings lock={settings.lock} />
    </>
  );
}

/** Switching the optional PIN privacy screen on or off. */
function PrivacyScreenSettings({ lock }: { lock: LockApi }) {
  const [pin, setPin] = useState("");
  const [again, setAgain] = useState("");
  const [problem, setProblem] = useState<PinProblem | null>(null);
  const [note, setNote] = useState<"none" | "on" | "off" | "could-not">("none");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const found = checkNewPin(pin, again);
    setProblem(found);
    if (found !== null) return;
    setBusy(true);
    const ok = await lock.turnOn(pin);
    setBusy(false);
    setPin("");
    setAgain("");
    setNote(ok ? "on" : "could-not");
  }

  return (
    <section className="choice-group settings-group" aria-labelledby="privacy-screen-title">
      <h3 id="privacy-screen-title" className="settings-heading">
        {text.lockTitle}
      </h3>
      <p className="hint">{text.lockIntro}</p>
      <p className="gentle">{text.lockHonest}</p>
      <p>{lock.isOn ? text.lockOn : text.lockOff}</p>

      {lock.isOn ? (
        <div className="buttons">
          <button type="button" onClick={lock.lockNow}>
            {text.lockNow}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={async () => {
              if (await lock.turnOff()) setNote("off");
            }}
          >
            {text.lockTurnOff}
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <div className="field">
            <label htmlFor="new-pin">{text.pinLabel}</label>
            <p className="hint" id="new-pin-hint">
              {text.pinHint}
            </p>
            <input
              id="new-pin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={12}
              value={pin}
              aria-describedby={problem === null ? "new-pin-hint" : "new-pin-hint pin-problem"}
              aria-invalid={problem !== null && problem !== "different" ? true : undefined}
              onChange={(event) => setPin(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="new-pin-again">{text.pinAgainLabel}</label>
            <input
              id="new-pin-again"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={12}
              value={again}
              aria-describedby={problem === null ? undefined : "pin-problem"}
              aria-invalid={problem === "different" ? true : undefined}
              onChange={(event) => setAgain(event.target.value)}
            />
          </div>
          <div aria-live="polite">
            {problem !== null ? (
              <p className="gentle" id="pin-problem">
                {text.pinProblem[problem]}
              </p>
            ) : null}
          </div>
          <button type="submit" disabled={busy}>
            {text.lockTurnOn}
          </button>
        </form>
      )}

      <div aria-live="polite">
        {note === "on" ? <p className="small">{text.lockTurnedOn}</p> : null}
        {note === "off" ? <p className="small">{text.lockTurnedOff}</p> : null}
        {note === "could-not" ? <p className="gentle">{text.lockCouldNotSave}</p> : null}
      </div>
    </section>
  );
}
