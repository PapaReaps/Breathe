import { FOLLOW_LINKS, isFollowLink } from "../content/support";
import { openOutside } from "../openOutside";
import { moneySymbol } from "../logic/money";
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
import type { BreathePart } from "../storage/settings";
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
  /** v1.1.0: which part of Breathe is open, and switching between them. */
  part: BreathePart;
  medicationAdded: boolean;
  onSwitch: (part: BreathePart) => void;
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
  "opt-currency": words.menu.optionGroups.currency,
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

/**
 * Where each page's Back button goes: the folder it lives in, or null for the top of a folder
 * (the Menu, Settings and Breathe apps), which only closes.
 * v1.2.0: Settings (the gear) is one folder for all of Breathe; Money options sits in Money's menu.
 */
function parentOf(panel: PanelId): PanelId | null {
  if (panel === "menu" || panel === "apps" || panel === "settings") return null;
  if (panel === "share" || panel === "tip" || panel === "report") return "help";
  if (panel === "data" || panel === "help" || panel === "about") return "settings";
  if (panel === "setup" || panel === "holidays" || panel === "opt-currency" || panel === "opt-home" || panel === "opt-reminder") return "more";
  if (panel.startsWith("opt-")) return "settings";
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
export function MenuSheet({ panel, onPanel, form, today, built, outcome, api, data, settings, part, medicationAdded, onSwitch }: MenuSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const panelNow = useRef(panel);
  panelNow.current = panel;
  const steppingBack = useRef(false);

  /** One page back: the folder this page lives in, or closed from the top. */
  const goBack = () => {
    if (panel === null) return;
    onPanel(parentOf(panel));
  };

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
      onCancel={(event) => {
        event.preventDefault();
        steppingBack.current = true;
        goBack();
      }}
      onClose={() => {
        if (steppingBack.current) {
          steppingBack.current = false;
          const dialog = dialogRef.current;
          if (panelNow.current !== null && dialog && !dialog.open) dialog.showModal();
          return;
        }
        onPanel(null);
      }}
      onClick={(event) => {
        // A click on the dimmed area outside the panel closes it.
        if (event.target === event.currentTarget) onPanel(null);
      }}
    >
      {panel !== null ? (
        <div className="sheet-inner">
          <div className="sheet-header">
            {(() => {
              const back = parentOf(panel);
              return back === null ? (
                <span />
              ) : (
                <button type="button" className="secondary" onClick={goBack}>
                  {`← ${BACK_LABEL[back] ?? words.menu.back}`}
                </button>
              );
            })()}
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
            {panel === "apps" ? <AppsList part={part} medicationAdded={medicationAdded} onSwitch={onSwitch} /> : null}
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
              <SetupView form={form} today={today} built={built} api={api} settings={settings} onClose={() => onPanel(null)} />
            ) : null}
            {panel === "coming-up" ? <ComingUpView built={built} outcome={outcome} settings={settings} /> : null}
            {panel === "more" ? <MoneyOptionsList onPanel={onPanel} holidays={describeForm(form, today).holidays} settings={settings} /> : null}
            {panel === "settings" ? <SettingsList settings={settings} onPanel={onPanel} /> : null}
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

/** What each option row shows on the right: the choice made now. */
function optionNow(settings: SettingsApi): Record<OptionGroup, string> {
  const s = settings.settings;
  const t = words.settings;
  const m = words.menu;
  const shown = [s.showExplanation, s.showPayday, s.showSavings].filter(Boolean).length;
  const sound = s.clickSound === "off" ? null : t.sounds[s.clickSound];
  const buzz = s.vibration === "off" ? null : t.vibrations[s.vibration];
  return {
    currency: `${moneySymbol()} ${words.currency.names[s.currency ?? "GBP"]}`,
    look: `${t.optionsShort[s.appearance]} · ${t.accents[s.part === "medication" ? s.medicationAccent : s.accent]}`,
    text: t.textSizes[s.textSize],
    home: shown === 3 ? m.homeAll : shown === 0 ? m.homeNone : m.homeSome,
    reminder: t.reminderShort[s.balanceReminder],
    sounds: sound === null && buzz === null ? m.off : [sound, buzz].filter(Boolean).join(" · "),
    privacy: settings.lock.isOn ? m.on : m.off,
    updates: settings.updates.installed ?? "",
  };
}

/** One row that opens a page. The words on the right, if any, say what's chosen now. */
function Row({ title, sub, onClick }: { title: string; sub?: string; onClick: () => void }) {
  return (
    <li>
      <button type="button" className="menu-item" onClick={onClick}>
        <span className="menu-title">{title}</span>
        {sub === undefined || sub === "" ? null : <span className="menu-sub">{sub}</span>}
      </button>
    </li>
  );
}

/** Money options (in Breathe Money's menu): the choices that are only about money. */
function MoneyOptionsList({ onPanel, holidays, settings }: { onPanel: (panel: PanelId) => void; holidays: string; settings: SettingsApi }) {
  const now = optionNow(settings);
  const m = words.menu;
  const option = (g: OptionGroup) => <Row key={g} title={m.optionGroups[g]} sub={now[g]} onClick={() => onPanel(`opt-${g}` as PanelId)} />;
  return (
    <>
      <ul className="menu-list settings-list">{(["currency", "home", "reminder"] as const).map(option)}</ul>
      <ul className="menu-list settings-list">
        <Row title={words.setup.menuItem} onClick={() => onPanel("setup")} />
        <Row title={m.names.holidays} sub={holidays} onClick={() => onPanel("holidays")} />
      </ul>
    </>
  );
}

/** Settings (the gear in the top bar): everything about Breathe itself, the same in every part. */
function SettingsList({ settings, onPanel }: { settings: SettingsApi; onPanel: (panel: PanelId) => void }) {
  const now = optionNow(settings);
  const m = words.menu;
  const option = (g: OptionGroup) => <Row key={g} title={m.optionGroups[g]} sub={now[g]} onClick={() => onPanel(`opt-${g}` as PanelId)} />;
  return (
    <>
      <ul className="menu-list settings-list">{(["look", "text", "sounds"] as const).map(option)}</ul>
      <ul className="menu-list settings-list">
        {option("privacy")}
        {settings.updates.available ? option("updates") : null}
        <Row title={m.names.data} onClick={() => onPanel("data")} />
      </ul>
      <ul className="menu-list settings-list">
        <Row title={m.helpTitle} onClick={() => onPanel("help")} />
        <Row title={m.aboutTitle} onClick={() => onPanel("about")} />
      </ul>
    </>
  );
}

/** Help and sharing: Share, Leave a tip and Report a problem, with quiet follow links underneath. */
function HelpList({ onPanel }: { onPanel: (panel: PanelId) => void }) {
  const items: Array<[PanelId, string]> = [
    ["share", words.menu.shareTitle],
    ["tip", words.menu.tipTitle],
    ["report", words.menu.reportTitle],
  ];
  const follow = words.menu.follow;
  return (
    <>
      <ul className="menu-list">
        {items.map(([id, title]) => (
          <Row key={id} title={title} onClick={() => onPanel(id)} />
        ))}
      </ul>
      {/* v1.0.1: quiet follow links underneath. Only the two checked addresses can open. */}
      <p className="follow-line">
        {follow.label}{" "}
        {FOLLOW_LINKS.map((link, i) => (
          <span key={link.name}>
            {i > 0 ? " · " : ""}
            <button
              type="button"
              className="link"
              aria-label={follow.open(link.name)}
              onClick={() => {
                if (isFollowLink(link.url)) void openOutside(link.url);
              }}
            >
              {link.name}
            </button>
          </span>
        ))}
      </p>
      <p className="follow-handle">{follow.handle}</p>
    </>
  );
}

/** About Breathe: one page for the whole app. */
function AboutView() {
  return (
    <>
      <p className="about-promise">{words.about.promise}</p>
      <p>{words.about.privacy}</p>
      <p>{words.about.advice}</p>
      <p>{words.about.medicalAdvice}</p>
    </>
  );
}

/** The Breathe family. Breathe Money is the home; the others will open from here when they exist. */
/**
 * "Your Breathe apps" (v1.1.0): switch between Money and Medication, or add Medication.
 * Apps still to come are listed quietly underneath.
 */
function AppsList({ part, medicationAdded, onSwitch }: { part: BreathePart; medicationAdded: boolean; onSwitch: (part: BreathePart) => void }) {
  const m = words.menu;
  const rows: Array<{ id: BreathePart; name: string; sub: string }> = [
    { id: "money", name: m.appsMoney, sub: part === "money" ? m.appsHere : m.appsOpenRow },
    { id: "medication", name: m.appsMedication, sub: part === "medication" ? m.appsHere : medicationAdded ? m.appsOpenRow : m.appsAdd },
  ];
  return (
    <>
      <p className="hint">{m.appsIntro}</p>
      <ul className="menu-list">
        {rows.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              className={row.id === part ? "menu-item app-row app-here" : "menu-item app-row"}
              aria-current={row.id === part ? "page" : undefined}
              onClick={() => onSwitch(row.id)}
            >
              <span className="menu-title">{row.name}</span>
              <span className="menu-sub">{row.sub}</span>
            </button>
          </li>
        ))}
        {m.appsComing.map((name) => (
          <li key={name}>
            <div className="menu-item app-row app-later">
              <span className="menu-title">{name}</span>
              <span className="menu-sub">{m.appsLater}</span>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
