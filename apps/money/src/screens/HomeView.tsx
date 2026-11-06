import { PotBadge } from "../components/PotBadge";
import { describeWarning, headlineFor, paydayLine, words } from "../content/words";
import { BUILT_IN_LAST_DAY } from "../data/bankHolidays";
import { formatDayLong } from "../logic/dates";
import type { BuildResult } from "../logic/form";
import type { NeedsAnswer, Outcome, PanelId } from "./screenTypes";
import { openUpdatesNext } from "../useUpdates";

interface HomeViewProps {
  built: BuildResult;
  outcome: Outcome | null;
  fresh: boolean;
  potAmount: string | null;
  showExplanation: boolean;
  showPayday: boolean;
  /** Show the main money's own name under the number (off unless chosen). */
  showMoneyName: boolean;
  loading: boolean;
  notSaved: boolean;
  readProblem: boolean;
  /** A newer Android version is out (only when the person chose to check). */
  updateNote: { version: string; page: string } | null;
  onOpen: (panel: PanelId) => void;
}

const home = words.home;

/** The main screen. One question answered, and nothing else. */
export function HomeView({
  built,
  outcome,
  fresh,
  potAmount,
  showExplanation,
  showPayday,
  showMoneyName,
  loading,
  notSaved,
  readProblem,
  updateNote,
  onOpen,
}: HomeViewProps) {
  return (
    <div className="home">
      <header className="topbar">
        <span className="app-name">{home.appName}</span>
        <button
          type="button"
          className="menu-button"
          onClick={() => onOpen("menu")}
          aria-haspopup="dialog"
          disabled={loading}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span>{home.menuButton}</span>
        </button>
      </header>

      <main
        className="home-main"
        aria-live="polite"
        data-screen={!loading && fresh && built.status === "needs-more" ? "welcome" : "home"}
      >
        {/* The opening breath floats up and lands here, then keeps breathing slowly (unless switched off). */}
        {loading ? null : (
          <div className="breath-mark" aria-hidden="true">
            breathe
          </div>
        )}
        {loading ? (
          <p className="home-message">{home.loading}</p>
        ) : (
          <>
            <HomeContent
              built={built}
              outcome={outcome}
              fresh={fresh}
              potAmount={potAmount}
              showExplanation={showExplanation}
              showPayday={showPayday}
              showMoneyName={showMoneyName}
              onOpen={onOpen}
            />
            {readProblem ? <p className="small">{home.readProblemLine}</p> : null}
            {updateNote ? (
              <p className="small">
                {home.updateReady(updateNote.version)}{" "}
                <button
                  type="button"
                  className="link"
                  onClick={() => {
                    openUpdatesNext();
                    onOpen("opt-updates");
                  }}
                >
                  {home.updateLink}
                </button>
              </p>
            ) : null}
            {notSaved ? (
              <p className="small">
                {home.notSavedLine}{" "}
                <button type="button" className="link" onClick={() => onOpen("data")}>
                  {home.notSavedLink}
                </button>
              </p>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}

type ContentProps = Pick<HomeViewProps, "built" | "outcome" | "fresh" | "potAmount" | "showExplanation" | "showPayday" | "showMoneyName" | "onOpen">;

function HomeContent({ built, outcome, fresh, potAmount, showExplanation, showPayday, showMoneyName, onOpen }: ContentProps) {
  if (built.status === "needs-more") {
    if (fresh) {
      return (
        <>
          <p className="breath-line">{home.breathLine}</p>
          <h1 className="home-title">{home.welcomeTitle}</h1>
          <p className="home-message">{home.welcomeMessage}</p>
          <button type="button" className="big-button" onClick={() => onOpen("setup")}>
            {home.welcomeButton}
          </button>
          <p className="small">{home.privacyLine}</p>
          <button type="button" className="link" onClick={() => onOpen("data")}>
            {home.howKept}
          </button>
        </>
      );
    }
    return (
      <>
        <h1 className="home-title">{words.waitingTitle}</h1>
        <p className="home-message">{built.messages[0]}</p>
        <button type="button" className="big-button" onClick={() => onOpen("menu")}>
          {home.openMenu}
        </button>
      </>
    );
  }

  if (outcome === null || !outcome.ok) {
    return (
      <>
        <h1 className="home-title">{words.waitingTitle}</h1>
        <p className="home-message">{words.cannotCalculate}</p>
        <button type="button" className="big-button" onClick={() => onOpen("menu")}>
          {home.openMenu}
        </button>
      </>
    );
  }

  const { result } = outcome;
  const head = headlineFor(result);
  const waitingQuestions = result.warnings.filter((w): w is NeedsAnswer => w.kind === "needs-answer");
  const outOfDate = result.warnings.find((w) => w.kind === "balance-out-of-date");
  // If a payday has gone by since the balance was entered, say that instead of the general
  // "your balance may be out of date" note. It is kind, and it is never hidden by a setting.
  const paidSince = built.status === "ready" ? built.paidSince : null;
  const listEnded = built.status === "ready" && built.holidayListEnded;
  const outOfDateText = outOfDate && paidSince === null ? describeWarning(outOfDate) : null;

  return (
    <>
      <h1 className="home-title">{head.title}</h1>
      {head.amount !== null ? <p className="big-number">{head.amount}</p> : null}
      {/* The sentence can be hidden, but only when things are comfortable: tight or unusual cases always explain themselves. */}
      {showExplanation || result.safeToSpend === null || result.safeToSpend <= 0 ? (
        <p className="home-message">{head.message}</p>
      ) : null}
      {showPayday && result.safeToSpend !== null ? (
        <p className="small">{paydayLine(result.paydayDate, result.daysUntilPayday, showMoneyName && built.status === "ready" ? built.moneyName : "")}</p>
      ) : null}
      {potAmount !== null ? <PotBadge amount={potAmount} /> : null}

      {paidSince !== null ? (
        <p className="small">
          {home.paidSince(formatDayLong(paidSince))}{" "}
          <button type="button" className="link" onClick={() => onOpen("account")}>
            {home.updateBalance}
          </button>
        </p>
      ) : null}
      {outOfDateText ? <p className="small">{outOfDateText}</p> : null}
      {listEnded ? (
        <p className="small">
          {words.holidayListEnded(`the end of ${BUILT_IN_LAST_DAY.slice(0, 4)}`)}{" "}
          <button type="button" className="link" onClick={() => onOpen("holidays")}>
            {words.menu.names.holidays}
          </button>
        </p>
      ) : null}
      {waitingQuestions.length > 0 ? (
        <button type="button" className="link" onClick={() => onOpen("explain")}>
          {home.questionWaiting}
        </button>
      ) : null}
    </>
  );
}
