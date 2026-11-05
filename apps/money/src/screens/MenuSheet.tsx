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
  PaydaySection,
  PotSection,
} from "./FormSections";
import { DataView } from "./DataView";
import { ComingUpView } from "./ComingUpView";
import { SettingsView } from "./SettingsView";
import { SetupView } from "./SetupView";
import { ReportView, ShareView } from "./ShareView";
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
  explain: ui.breakdownTitle,
  "coming-up": words.comingUp.title,
  share: words.menu.shareTitle,
  report: words.menu.reportTitle,
  about: words.menu.aboutTitle,
};

/** Pages that live inside the Settings folder: their Back button returns there. */
const IN_MORE: PanelId[] = ["setup", "settings", "data", "share", "report", "about"];

const SECTION_PANELS: PanelId[] = ["account", "payday", "bills", "income", "essentials", "pot", "holidays"];

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

  let liveLine: string = words.menu.liveWaiting;
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
                onClick={() => onPanel(IN_MORE.includes(panel) ? "more" : "menu")}
              >
                {`← ${IN_MORE.includes(panel) ? words.menu.backToMore : words.menu.back}`}
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
                <PaydaySection form={form} today={today} api={api} />
                <h3 className="sub-question">{ui.otherIncomeTitle}</h3>
                <IncomeSection form={form} today={today} api={api} />
              </>
            ) : null}
            {panel === "bills" ? <BillsSection form={form} today={today} api={api} /> : null}
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
            {panel === "more" ? <MoreList settings={settings} onPanel={onPanel} /> : null}
            {panel === "settings" ? <SettingsView settings={settings} /> : null}
            {panel === "data" ? <DataView data={data} /> : null}
            {panel === "share" ? <ShareView /> : null}
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

interface MenuListProps {
  form: FormState;
  today: string;
  built: BuildResult;
  outcome: Outcome | null;
  onPanel: (panel: PanelId) => void;
}

function MenuList({ form, today, built, outcome, onPanel }: MenuListProps) {
  const summary = describeForm(form, today);
  const items: Array<{ id: PanelId; title: string; sub: string }> = [
    { id: "income", title: words.menu.names.income, sub: summary.payday },
    { id: "account", title: words.menu.names.account, sub: summary.account },
    { id: "bills", title: words.menu.names.bills, sub: summary.bills },
    { id: "essentials", title: words.menu.names.essentials, sub: summary.essentials },
    { id: "pot", title: words.menu.names.pot, sub: summary.pot },
    { id: "holidays", title: words.menu.names.holidays, sub: summary.holidays },
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
              <span className={item.id === "pot" && item.sub !== words.notSetYet ? "menu-sub pot-amount" : "menu-sub"}>
                {item.sub}
              </span>
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
        {outcome !== null && outcome.ok ? (
          <li>
            <button type="button" className="menu-item" onClick={() => onPanel("explain")}>
              <span className="menu-title">{ui.breakdownTitle}</span>
            </button>
          </li>
        ) : null}
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
function MoreList({ settings, onPanel }: { settings: SettingsApi; onPanel: (panel: PanelId) => void }) {
  return (
    <>
      <ul className="menu-list">
        <li>
          <button type="button" className="menu-item" onClick={() => onPanel("setup")}>
            <span className="menu-title">{words.setup.menuItem}</span>
          </button>
        </li>
        <li>
          <button type="button" className="menu-item" onClick={() => onPanel("settings")}>
            <span className="menu-title">{words.menu.names.settings}</span>
            <span className="menu-sub">{words.settings.options[settings.settings.appearance]}</span>
          </button>
        </li>
        <li>
          <button type="button" className="menu-item" onClick={() => onPanel("data")}>
            <span className="menu-title">{words.menu.names.data}</span>
          </button>
        </li>
        <li>
          <button type="button" className="menu-item" onClick={() => onPanel("share")}>
            <span className="menu-title">{words.menu.shareTitle}</span>
          </button>
        </li>
        <li>
          <button type="button" className="menu-item" onClick={() => onPanel("report")}>
            <span className="menu-title">{words.menu.reportTitle}</span>
          </button>
        </li>
        <li>
          <button type="button" className="menu-item" onClick={() => onPanel("about")}>
            <span className="menu-title">{words.menu.aboutTitle}</span>
          </button>
        </li>
      </ul>
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
