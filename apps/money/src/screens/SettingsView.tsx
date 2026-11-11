import { PotBadge } from "../components/PotBadge";
import { words } from "../content/words";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { checkNewPin } from "../storage/appLock";
import type { PinProblem } from "../storage/appLock";
import { ACCENTS, APPEARANCES, BALANCE_REMINDERS, CONTRASTS, DEFAULT_SETTINGS, OUTLINES, POT_COLOURS, TEXT_SIZES } from "../storage/settings";
import type { Appearance } from "../storage/settings";
import type { CSSProperties } from "react";
import type { LockApi } from "../storage/useAppLock";
import type { UpdatesApi } from "../useUpdates";
import { takeShowUpdates } from "../useUpdates";
import { InstallUpdate } from "./InstallUpdate";
import { CurrencyPicker } from "../components/CurrencyPicker";
import { CLICK_SOUNDS, VIBRATIONS, canVibrate, playSound, vibrate } from "../feedback";
import type { SettingsApi } from "./screenTypes";

const text = words.settings;

/** The groups in App options. Each opens its own small page, so no page is long. */
export const OPTION_GROUPS = ["currency", "look", "text", "home", "reminder", "sounds", "privacy", "updates"] as const;
export type OptionGroup = (typeof OPTION_GROUPS)[number];

/** One group of App options: light or dark and colours, text and contrast, and so on. */
export function SettingsView({ settings, group }: { settings: SettingsApi; group: OptionGroup }) {
  const { settings: current, change } = settings;
  const show = (part: OptionGroup | "look-colours") => (part === "look-colours" ? group === "look" : group === part);
  return (
    <>
      {show("currency") ? (
        <fieldset className="choice-group settings-group">
          <legend className="visually-hidden">{words.currency.title}</legend>
          <p className="hint">{words.currency.intro}</p>
          <CurrencyPicker name="currency" value={current.currency ?? "GBP"} onChange={(code) => change({ currency: code })} />
        </fieldset>
      ) : null}

      {show("look") ? (
        <>
      <fieldset className="choice-group">
        <legend>{text.appearanceTitle}</legend>
        <p className="hint">{text.appearanceIntro}</p>
        <select
          aria-label={text.appearanceTitle}
          value={current.appearance}
          onChange={(event) => change({ appearance: event.target.value as Appearance })}
        >
          {APPEARANCES.map((choice) => (
            <option key={choice} value={choice}>
              {text.options[choice]}
            </option>
          ))}
        </select>
        {current.appearance === "system" ? <p className="hint">{text.systemHint}</p> : null}
      </fieldset>
        </>
      ) : null}

      {show("text") ? (
        <>
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
        </>
      ) : null}

      {show("look-colours") ? (
        <>
      <fieldset className="choice-group settings-group">
        <legend>{text.accentTitle}</legend>
        <p className="hint">{text.accentIntro}</p>
        <div className="circle-picks" role="radiogroup" aria-label={text.accentTitle}>
          {ACCENTS.map((option) => (
            <label key={option.id} className="circle-pick">
              <input
                type="radio"
                name="accent"
                value={option.id}
                checked={current.accent === option.id}
                onChange={() => change({ accent: option.id })}
              />
              <span
                className={"circle-dot"}
                style={{ "--sw-light": option.swatch, "--sw-dark": option.dark } as CSSProperties}
                aria-hidden="true"
              />
              {text.accents[option.id]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="choice-group settings-group">
        <legend>{text.potTitle}</legend>
        <p className="hint">{text.potIntro}</p>
        <div className="circle-picks" role="radiogroup" aria-label={text.potTitle}>
          {POT_COLOURS.map((option) => (
            <label key={option.id} className="circle-pick">
              <input
                type="radio"
                name="pot-colour"
                value={option.id}
                checked={current.potColour === option.id}
                onChange={() => change({ potColour: option.id })}
              />
              <span
                className={"circle-dot"}
                style={{ "--sw-light": option.swatch, "--sw-dark": option.dark } as CSSProperties}
                aria-hidden="true"
              />
              {text.potColours[option.id]}
            </label>
          ))}
        </div>
        <p className="hint">{text.potPreview}</p>
        <PotBadge amount={text.potPreviewAmount} />
      </fieldset>

      <fieldset className="choice-group settings-group">
        <legend>{text.outlineTitle}</legend>
        <p className="hint">{text.outlineIntro}</p>
        <div className="circle-picks" role="radiogroup" aria-label={text.outlineTitle}>
          {OUTLINES.map((option) => (
            <label key={option.id} className="circle-pick">
              <input
                type="radio"
                name="outline"
                value={option.id}
                checked={current.outline === option.id}
                onChange={() => change({ outline: option.id })}
              />
              <span
                className={"circle-dot outline-dot"}
                style={{ "--sw-light": option.swatch, "--sw-dark": option.dark } as CSSProperties}
                aria-hidden="true"
              />
              {text.outlines[option.id]}
            </label>
          ))}
        </div>
      </fieldset>
        </>
      ) : null}

      {show("reminder") ? (
        <>
      <fieldset className="choice-group settings-group">
        <legend className="visually-hidden">{text.reminderTitle}</legend>
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
        </>
      ) : null}

      {show("home") ? (
        <>
      <fieldset className="choice-group settings-group">
        {/* The page title already says this, so it is only read out, not shown twice. */}
        <legend className="visually-hidden">{text.homeTitle}</legend>
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
        <label className="choice">
          <input
            type="checkbox"
            checked={current.showMoneyName}
            onChange={(event) => change({ showMoneyName: event.target.checked })}
          />
          <span>
            {text.showMoneyName}
            <span className="hint choice-hint">{text.showMoneyNameHint}</span>
          </span>
        </label>
        <label className="choice">
          <input
            type="checkbox"
            checked={current.showSavings}
            onChange={(event) => change({ showSavings: event.target.checked })}
          />
          <span>
            {text.showSavings}
            <span className="hint choice-hint">{text.showSavingsHint}</span>
          </span>
        </label>
        <label className="choice">
          <input
            type="checkbox"
            checked={current.breathMotion}
            onChange={(event) => change({ breathMotion: event.target.checked })}
          />
          <span>
            {text.breathMotion}
            <span className="hint choice-hint">{text.breathMotionHint}</span>
          </span>
        </label>
      </fieldset>
        </>
      ) : null}

      {show("sounds") ? (
        <>
      <fieldset className="choice-group settings-group">
        <legend>{text.soundTitle}</legend>
        <p className="hint">{text.soundIntro}</p>
        <div className="pick-row">
          <select
            aria-label={text.soundTitle}
            value={current.clickSound}
            onChange={(event) => change({ clickSound: event.target.value as (typeof CLICK_SOUNDS)[number] })}
          >
            {CLICK_SOUNDS.map((choice) => (
              <option key={choice} value={choice}>
                {text.sounds[choice]}
              </option>
            ))}
          </select>
          {current.clickSound !== "off" ? (
            <button type="button" className="secondary" data-feedback-preview="" onClick={() => playSound(current.clickSound)}>
              {"▶ "}
              {text.hearIt}
            </button>
          ) : null}
        </div>
      </fieldset>

      {canVibrate() ? (
        <fieldset className="choice-group settings-group">
          <legend>{text.vibrateTitle}</legend>
          <p className="hint">{text.vibrateIntro}</p>
          <div className="pick-row">
            <select
              aria-label={text.vibrateTitle}
              value={current.vibration}
              onChange={(event) => change({ vibration: event.target.value as (typeof VIBRATIONS)[number] })}
            >
              {VIBRATIONS.map((choice) => (
                <option key={choice} value={choice}>
                  {text.vibrations[choice]}
                </option>
              ))}
            </select>
            {current.vibration !== "off" ? (
              <button type="button" className="secondary" data-feedback-preview="" onClick={() => vibrate(current.vibration)}>
                {text.feelIt}
              </button>
            ) : null}
          </div>
        </fieldset>
      ) : null}
        </>
      ) : null}

      {show("privacy") ? (
        <>
      <PrivacyScreenSettings lock={settings.lock} />
        </>
      ) : null}

      {show("updates") ? (
        <>
      {settings.updates.available ? (
        <UpdatesSettings updates={settings.updates} on={current.checkForUpdates} onChange={(value) => change({ checkForUpdates: value })} />
      ) : null}
        </>
      ) : null}
    </>
  );
}

/** Android app only: the optional check for a newer version. Off unless switched on. */
function UpdatesSettings({ updates, on, onChange }: { updates: UpdatesApi; on: boolean; onChange: (value: boolean) => void }) {
  const result = updates.result;
  const sectionRef = useRef<HTMLElement>(null);
  // Opened from the note on the home screen: go straight to this section.
  useEffect(() => {
    if (takeShowUpdates()) {
      const timer = setTimeout(() => sectionRef.current?.scrollIntoView({ block: "start" }), 50);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);
  return (
    <section ref={sectionRef} className="choice-group settings-group" aria-labelledby="updates-title">
      <h3 id="updates-title" className="visually-hidden">
        {text.updatesTitle}
      </h3>
      <p className="hint">{text.updatesIntro}</p>
      {updates.installed !== null ? <p className="installed-version">{text.updatesYouHave(updates.installed)}</p> : null}
      <p className="gentle">{text.updatesHonest}</p>
      <label className="choice">
        <input type="checkbox" checked={on} onChange={(event) => onChange(event.target.checked)} />
        <span>{text.updatesToggle}</span>
      </label>
      <div className="buttons">
        <button type="button" className="secondary" disabled={updates.checking} onClick={() => void updates.checkNow()}>
          {text.updatesCheckNow}
        </button>
      </div>
      <div aria-live="polite">
        {updates.checking ? <p className="small">{text.updatesChecking}</p> : null}
        {!updates.checking && result?.state === "up-to-date" ? <p className="small">{text.updatesUpToDate(result.version)}</p> : null}
        {!updates.checking && result?.state === "unknown" ? <p className="small">{text.updatesUnknown}</p> : null}
        {!updates.checking && result?.state === "newer" ? (
          <div className="gentle">
            <p>{text.updatesNewer(result.version)}</p>
            <p className="small">{text.updatesHowTo}</p>
            <InstallUpdate apk={result.apk} page={result.page} />
          </div>
        ) : null}
      </div>
    </section>
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
      <h3 id="privacy-screen-title" className="visually-hidden">
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
