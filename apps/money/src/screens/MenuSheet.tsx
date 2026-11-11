import { useEffect, useRef } from "react";
import { headlineFor, words } from "../content/words";
import { describeForm } from "../logic/form";
import type { BuildResult, FormState } from "../logic/form";
import { ExplainView } from "./ExplainView";
import {
  AccountSection,
  BillsSection,
  EssentialsSection,
  HolidaysSection,
  IncomeSection,
  PlanUntilSection,
  PotSection,
} from "./FormSections";
import { DataView } from "./DataView";
import { ComingUpView } from "./ComingUpView";
import { SettingsView } from "./SettingsView";
import type { OptionGroup } from "./SettingsView";
import { SetupView } from "./SetupView";
import { DEFAULT_SETTINGS } from "../storage/settings";
import { ReportView, ShareView } from "./ShareView";
import { TipView } from "./TipView";
import type { DataApi, FormApi, Outcome, PanelId, SettingsApi } from "./screenTypes";

interface MenuSheetProps {
  panel: PanelId | null;
  onPanel: (panel: PanelId | null) => void;
  form: FormState;
  today: string;
  built: BuildResult;
  outcome: Outcome | null;
  api: FormApi;
  data: DataApi;
  settings: SettingsApi;
}

const ui = words.ui;

const TITLES: Record<PanelId, string> = {
  menu: words.menu.title,
  account: ui.accountTitle,
  payday: ui.paydayTitle,
  bills: ui.billsTitle,
  income: ui.incomeTitle,
  essentials: ui.essentialsTitle,
  pot: ui.potTitle,
  holidays: ui.holidaysSummary,
  data: words.data.title,
  setup: words.setup.title,
  more: words.menu.moreTitle,
  settings: words.menu.names.settings,
  help: words.menu.helpTitle,
  "opt-look": words.menu.optionGroups.look,
  "opt-text": words.menu.optionGroups.text,
  "opt-home": words.menu.optionGroups.home,
  "opt-reminder": words.menu.optionGroups.reminder,
  "opt-sounds": words.menu.optionGroups.sounds,
  "opt-privacy": words.menu.optionGroups.privacy,
  "opt-updates": words.menu.optionGroups.updates,
  explain: ui.breakdownTitle,
  "coming-up": words.comingUp.title,
  money: words.menu.names.money,
  apps: words.menu.appsTitle,
  share: words.menu.shareTitle,
  report: words.menu.reportTitle,
  tip: words.menu.tipTitle,
  about: words.menu.aboutTitle,
};

/** Where each page's Back button goes: the folder it lives in. */
function parentOf(panel: PanelId): PanelId {
  if (panel === "setup" || panel === "settings" || panel === "data" || panel === "help" || panel === "holidays") return "more";
  if (panel === "share" || panel === "tip" || panel === "report" || panel === "about") return "help";
  // v0.31.0: the option pages open straight from Settings (no separate App options page).
  if (panel.startsWith("opt-")) return "more";
  return "menu";
}
const BACK_LABEL: Partial<Record<PanelId, string>> = {
  menu: words.menu.back,
  more: words.menu.backToMore,
  help: words.menu.backToHelp,
  settings: words.menu.backToOptions,
};
const groupOf = (panel: PanelId): OptionGroup | null =>
  panel.startsWith("opt-") ? (panel.slice(4) as OptionGroup) : null;

const SECTION_PANELS: PanelId[] = ["account", "payday", "bills", "income", "money", "essentials", "pot", "holidays"];

/**
 * The menu. It is a full-screen panel on a phone and a card on a bigger screen.
 * It uses the browser's own <dialog>, which already handles the Escape key,
 * keeps keyboard focus inside, and hands focus back to the Menu button on close.
 */
export function MenuSheet({ panel, onPanel, form, today, built, outcome, api, data, settings }: MenuSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (panel !== null && !dialog.open) dialog.showModal();
    if (panel === null && dialog.open) dialog.close();
  }, [panel]);

  // Each time the page changes, start at the top and let screen readers hear the new heading.
  useEffect(() => {
    if (panel === null) return;
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
    headingRef.current?.focus();
  }, [panel]);

  const isSection = panel !== null && SECTION_PANELS.includes(panel);

  // When the number can't show yet, say exactly what's missing (the first thing to add).
  let liveLine: string =
    built.status === "needs-more" && built.messages[0] !== undefined ? built.messages[0] : words.menu.liveWaiting;
  if (outcome !== null && outcome.ok && outcome.result.safeToSpend !== null) {
    const amount = headlineFor(outcome.result).amount;
    if (amount !== null) liveLine = words.menu.liveLine(amount);
  }

  return (
    <dialog
      ref={dialogRef}
      className="sheet"
      aria-labelledby="sheet-title"
      onClose={() => onPanel(null)}
      onClick={(event) => {
        // A click on the dimmed area outside the panel closes it.
        if (event.target === event.currentTarget) onPanel(null);
      }}
    >
      {panel !== null ? (
        <div className="sheet-inner">
          <div className="sheet-header">
            {panel === "menu" ? (
              <span />
            ) : (
              <button
                type="button"
                className="secondary"
                onClick={() => onPanel(parentOf(panel))}
              >
                {`← ${BACK_LABEL[parentOf(panel)] ?? words.menu.back}`}
              </button>
            )}
            <button type="button" onClick={() => onPanel(null)}>
              {words.menu.done}
            </button>
          </div>

          <div className="sheet-body" ref={bodyRef}>
            <h2 id="sheet-title" tabIndex={-1} ref={headingRef}>
              {TITLES[panel]}
            </h2>
            {panel === "menu" ? <MenuList form={form} today={today} built={built} outcome={outcome} onPanel={onPanel} /> : null}
            {panel === "account" ? <AccountSection form={form} today={today} api={api} /> : null}
            {panel === "payday" || panel === "income" ? (
              <>
                <IncomeSection form={form} today={today} api={api} />
                <PlanUntilSection form={form} today={today} api={api} />
              </>
            ) : null}
            {panel === "bills" ? <BillsSection form={form} today={today} api={api} /> : null}
            {panel === "money" ? (
              <>
                <h3 className="money-heading">{ui.incomeTitle}</h3>
                <IncomeSection form={form} today={today} api={api} hideHint />
                <PlanUntilSection form={form} today={today} api={api} />
                <h3 className="money-heading">{ui.billsTitle}</h3>
                <BillsSection form={form} today={today} api={api} hideHint />
                <h3 className="money-heading">{ui.essentialsTitle}</h3>
                <EssentialsSection form={form} today={today} api={api} />
                <h3 className="money-heading">{ui.potTitle}</h3>
                <PotSection form={form} today={today} api={api} />
              </>
            ) : null}
            {panel === "apps" ? <AppsList /> : null}
            {panel === "essentials" ? <EssentialsSection form={form} today={today} api={api} /> : null}
            {panel === "pot" ? <PotSection form={form} today={today} api={api} /> : null}
            {panel === "holidays" ? <HolidaysSection form={form} today={today} api={api} /> : null}
            {panel === "explain" ? (
              <ExplainView
                built={built}
                outcome={outcome}
                hasAnswers={Object.keys(form.answers).length > 0}
                api={api}
              />
            ) : null}
            {panel === "setup" ? (
              <SetupView form={form} today={today} built={built} api={api} onClose={() => onPanel(null)} />
            ) : null}
            {panel === "coming-up" ? <ComingUpView built={built} outcome={outcome} settings={settings} /> : null}
            {panel === "more" ? <MoreList onPanel={onPanel} holidays={describeForm(form, today).holidays} settings={settings} /> : null}
            {panel === "settings" ? <OptionsList settings={settings} onPanel={onPanel} /> : null}
            {groupOf(panel) !== null ? <SettingsView settings={settings} group={groupOf(panel)!} /> : null}
            {panel === "help" ? <HelpList onPanel={onPanel} /> : null}
            {panel === "data" ? (
              <DataView data={data} hasNumbers={hasNumbers(form)} onResetSettings={() => settings.change(DEFAULT_SETTINGS)} />
            ) : null}
            {panel === "share" ? <ShareView /> : null}
            {panel === "tip" ? <TipView /> : null}
            {panel === "report" ? <ReportView /> : null}
            {panel === "about" ? <AboutView /> : null}
          </div>

          {isSection ? (
            <div className="sheet-footer" aria-live="polite">
              {liveLine}
            </div>
          ) : null}
        </div>
      ) : null}
    </dialog>
  );
}

/** Anything typed in at all. */
function hasNumbers(form: FormState): boolean {
  const typed = [form.balance, form.foodPerWeek, form.travelPerWeek, form.buffer];
  return typed.some((value) => value.trim() !== "") || form.bills.length > 0 || form.income.length > 0;
}

interface MenuListProps {
  form: FormState;
  today: string;
  built: BuildResult;
  outcome: Outcome | null;
  onPanel: (panel: PanelId) => void;
}

function MenuList({ form, today, built, onPanel }: MenuListProps) {
  const summary = describeForm(form, today);
  const items: Array<{ id: PanelId; title: string; sub: string }> = [
    // v0.33.0: Your account, then everything else about your money on one page.
    { id: "account", title: words.menu.names.account, sub: summary.account },
    { id: "money", title: words.menu.names.money, sub: words.menu.moneySub },
  ];

  return (
    <>
      {built.status === "needs-more" ? (
        <div className="gentle">
          <p>{words.menu.toGetYourNumber}</p>
          <ul className="plain-list">
            {built.messages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <ul className="menu-list">
        {items.map((item) => (
          <li key={item.id}>
            <button type="button" className="menu-item" onClick={() => onPanel(item.id)}>
              <span className={item.id === "pot" ? "menu-title pot-word" : "menu-title"}>{item.title}</span>
              {item.sub === "" ? null : (
                <span className={item.id === "pot" && item.sub !== words.notSetYet ? "menu-sub pot-amount" : "menu-sub"}>
                  {item.sub}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      <ul className="menu-list">
        <li>
          <button type="button" className="menu-item" onClick={() => onPanel("coming-up")}>
            <span className="menu-title">{words.comingUp.title}</span>
            <span className="menu-sub">{words.comingUp.menuSub}</span>
          </button>
        </li>
        <li>
          <button type="button" className="menu-item" onClick={() => onPanel("more")}>
            <span className="menu-title">{words.menu.moreTitle}</span>
          </button>
        </li>
      </ul>
    </>
  );
}

/** The Settings folder: the less-used pages, kept together so the menu stays short. */
function MoreList({ onPanel, holidays, settings }: { onPanel: (panel: PanelId) => void; holidays: string; settings: SettingsApi }) {
  const s = settings.settings;
  const t = words.settings;
  const m = words.menu;
  const shown = [s.showExplanation, s.showPayday, s.showSavings].filter(Boolean).length;
  const sound = s.clickSound === "off" ? null : t.sounds[s.clickSound];
  const buzz = s.vibration === "off" ? null : t.vibrations[s.vibration];
  const now: Record<OptionGroup, string> = {
    look: `${t.options[s.appearance]} · ${t.accents[s.accent]}`,
    text: t.textSizes[s.textSize],
    home: shown === 3 ? m.homeAll : shown === 0 ? m.homeNone : m.homeSome,
    reminder: t.reminderOptions[s.balanceReminder],
    sounds: sound === null && buzz === null ? m.off : [sound, buzz].filter(Boolean).join(" · "),
    privacy: settings.lock.isOn ? m.on : m.off,
    updates: settings.updates.installed ?? "",
  };
  const option = (g: OptionGroup) => (
    <li key={g}>
      <button type="button" className="menu-item" onClick={() => onPanel(`opt-${g}` as PanelId)}>
        <span className="menu-title">{m.optionGroups[g]}</span>
        <span className="menu-sub">{now[g]}</span>
      </button>
    </li>
  );
  const page = (id: PanelId, title: string, sub?: string) => (
    <li key={id}>
      <button type="button" className="menu-item" onClick={() => onPanel(id)}>
        <span className="menu-title">{title}</span>
        {sub === undefined ? null : <span className="menu-sub">{sub}</span>}
      </button>
    </li>
  );
  // v0.31.0: everything on one page, in three small groups (no separate App options page).
  return (
    <>
      <h3 className="settings-heading">{m.settingsGroups.feel}</h3>
      <ul className="menu-list">{(["look", "text", "home", "sounds"] as const).map(option)}</ul>
      <h3 className="settings-heading">{m.settingsGroups.reminders}</h3>
      <ul className="menu-list">
        {(["reminder", "privacy", "updates"] as const).filter((g) => g !== "updates" || settings.updates.available).map(option)}
      </ul>
      <h3 className="settings-heading">{m.settingsGroups.numbers}</h3>
      <ul className="menu-list">
        {page("setup", words.setup.menuItem)}
        {page("holidays", m.names.holidays, holidays)}
        {page("data", m.names.data)}
      </ul>
      <ul className="menu-list">{page("help", m.helpTitle)}</ul>
    </>
  );
}

/** Help and sharing: Share, Report a problem and About, kept together. */
function HelpList({ onPanel }: { onPanel: (panel: PanelId) => void }) {
  const items: Array<[PanelId, string]> = [
    ["share", words.menu.shareTitle],
    ["tip", words.menu.tipTitle],
    ["report", words.menu.reportTitle],
    ["about", words.menu.aboutTitle],
  ];
  return (
    <ul className="menu-list">
      {items.map(([id, title]) => (
        <li key={id}>
          <button type="button" className="menu-item" onClick={() => onPanel(id)}>
            <span className="menu-title">{title}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** App options: a short list of groups. Each shows the current choice, and opens its own small page. */
function OptionsList({ settings, onPanel }: { settings: SettingsApi; onPanel: (panel: PanelId) => void }) {
  const s = settings.settings;
  const t = words.settings;
  const m = words.menu;
  const shown = [s.showExplanation, s.showPayday, s.showSavings].filter(Boolean).length;
  const sound = s.clickSound === "off" ? null : t.sounds[s.clickSound];
  const buzz = s.vibration === "off" ? null : t.vibrations[s.vibration];
  const now: Record<OptionGroup, string> = {
    look: `${t.options[s.appearance]} · ${t.accents[s.accent]}`,
    text: t.textSizes[s.textSize],
    home: shown === 3 ? m.homeAll : shown === 0 ? m.homeNone : m.homeSome,
    reminder: t.reminderOptions[s.balanceReminder],
    sounds: sound === null && buzz === null ? m.off : [sound, buzz].filter(Boolean).join(" · "),
    privacy: settings.lock.isOn ? m.on : m.off,
    updates: settings.updates.installed ?? "",
  };
  // Three small groups, like the Menu: how it looks, what it does, and keeping it safe.
  const sets: OptionGroup[][] = [["look", "text", "home"], ["reminder", "sounds"], ["privacy", "updates"]];
  return (
    <>
      <p className="hint">{m.optionsIntro}</p>
      {sets.map((set) => (
        <ul key={set.join()} className="menu-list">
          {set
            .filter((g) => g !== "updates" || settings.updates.available)
            .map((g) => (
              <li key={g}>
                <button type="button" className="menu-item" onClick={() => onPanel(`opt-${g}` as PanelId)}>
                  <span className="menu-title">{m.optionGroups[g]}</span>
                  <span className="menu-sub">{now[g]}</span>
                </button>
              </li>
            ))}
        </ul>
      ))}
    </>
  );
}

function AboutView() {
  return (
    <>
      <p className="about-promise">{words.about.promise}</p>
      <p>{words.about.privacy}</p>
      <p>{words.about.advice}</p>
    </>
  );
}

/** The Breathe family. Breathe Money is the home; the others will open from here when they exist. */
function AppsList() {
  const m = words.menu;
  return (
    <>
      <p className="hint">{m.appsIntro}</p>
      <ul className="menu-list">
        {m.appsList.map((name, i) => (
          <li key={name}>
            <div className={i === 0 ? "menu-item app-row app-here" : "menu-item app-row"}>
              <span className="menu-title">{name}</span>
              <span className="menu-sub">{i === 0 ? m.appsHere : m.appsLater}</span>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
