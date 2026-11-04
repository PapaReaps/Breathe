import { PotBadge } from "../components/PotBadge";
import { words } from "../content/words";
import { ACCENTS, APPEARANCES, BALANCE_REMINDERS, DEFAULT_SETTINGS, POT_COLOURS } from "../storage/settings";
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
    </>
  );
}
