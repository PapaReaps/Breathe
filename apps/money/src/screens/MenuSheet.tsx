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
} from "./FormSections";
import { DataView } from "./DataView";
import { SetupView } from "./SetupView";
import type { DataApi, FormApi, Outcome, PanelId } from "./screenTypes";

interface MenuSheetProps {
  panel: PanelId | null;
  onPanel: (panel: PanelId | null) => void;
  form: FormState;
  today: string;
  built: BuildResult;
  outcome: Outcome | null;
  api: FormApi;
  data: DataApi;
}

const ui = words.ui;

const TITLES: Record<PanelId, string> = {
  menu: words.menu.title,
  account: ui.accountTitle,
  payday: ui.paydayTitle,
  bills: ui.billsTitle,
  income: ui.incomeTitle,
  essentials: ui.essentialsTitle,
  holidays: ui.holidaysSummary,
  data: words.data.title,
  setup: words.setup.title,
  explain: ui.breakdownTitle,
  about: words.menu.aboutTitle,
};

const SECTION_PANELS: PanelId[] = ["account", "payday", "bills", "income", "essentials", "holidays"];

/**
 * The menu. It is a full-screen panel on a phone and a card on a bigger screen.
 * It uses the browser's own <dialog>, which already handles the Escape key,
 * keeps keyboard focus inside, and hands focus back to the Menu button on close.
 */
export function MenuSheet({ panel, onPanel, form, today, built, outcome, api, data }: MenuSheetProps) {
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
              <button type="button" className="secondary" onClick={() => onPanel("menu")}>
                {`← ${words.menu.back}`}
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
            {panel === "menu" ? <MenuList form={form} built={built} outcome={outcome} data={data} onPanel={onPanel} /> : null}
            {panel === "account" ? <AccountSection form={form} today={today} api={api} /> : null}
            {panel === "payday" ? <PaydaySection form={form} today={today} api={api} /> : null}
            {panel === "bills" ? <BillsSection form={form} today={today} api={api} /> : null}
            {panel === "income" ? <IncomeSection form={form} today={today} api={api} /> : null}
            {panel === "essentials" ? <EssentialsSection form={form} today={today} api={api} /> : null}
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
            {panel === "data" ? <DataView data={data} /> : null}
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
  built: BuildResult;
  outcome: Outcome | null;
  data: DataApi;
  onPanel: (panel: PanelId) => void;
}

function MenuList({ form, built, outcome, data, onPanel }: MenuListProps) {
  const summary = describeForm(form);
  const items: Array<{ id: PanelId; title: string; sub: string }> = [
    { id: "account", title: words.menu.names.account, sub: summary.account },
    { id: "payday", title: words.menu.names.payday, sub: summary.payday },
    { id: "bills", title: words.menu.names.bills, sub: summary.bills },
    { id: "income", title: words.menu.names.income, sub: summary.income },
    { id: "essentials", title: words.menu.names.essentials, sub: summary.essentials },
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
              <span className="menu-title">{item.title}</span>
              <span className="menu-sub">{item.sub}</span>
            </button>
          </li>
        ))}
      </ul>

      <ul className="menu-list">
        {outcome !== null && outcome.ok ? (
          <li>
            <button type="button" className="menu-item" onClick={() => onPanel("explain")}>
              <span className="menu-title">{ui.breakdownTitle}</span>
            </button>
          </li>
        ) : null}
        <li>
          <button type="button" className="menu-item" onClick={() => onPanel("setup")}>
            <span className="menu-title">{words.setup.menuItem}</span>
          </button>
        </li>
        <li>
          <button type="button" className="menu-item" onClick={() => onPanel("data")}>
            <span className="menu-title">{words.menu.names.data}</span>
            <span className="menu-sub">
              {data.saveState === "not-saved" ? words.menu.dataSubNotSaved : words.menu.dataSub}
            </span>
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
