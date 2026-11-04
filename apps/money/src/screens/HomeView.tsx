import { describeWarning, headlineFor, paydayLine, words } from "../content/words";
import type { BuildResult } from "../logic/form";
import type { NeedsAnswer, Outcome, PanelId } from "./screenTypes";

interface HomeViewProps {
  built: BuildResult;
  outcome: Outcome | null;
  fresh: boolean;
  onOpen: (panel: PanelId) => void;
}

const home = words.home;

/** The main screen. One question answered, and nothing else. */
export function HomeView({ built, outcome, fresh, onOpen }: HomeViewProps) {
  return (
    <div className="home">
      <header className="topbar">
        <span className="app-name">{home.appName}</span>
        <button type="button" className="menu-button" onClick={() => onOpen("menu")} aria-haspopup="dialog">
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span>{home.menuButton}</span>
        </button>
      </header>

      <main className="home-main" aria-live="polite">
        <HomeContent built={built} outcome={outcome} fresh={fresh} onOpen={onOpen} />
      </main>
    </div>
  );
}

function HomeContent({ built, outcome, fresh, onOpen }: HomeViewProps) {
  if (built.status === "needs-more") {
    if (fresh) {
      return (
        <>
          <h1 className="home-title">{home.welcomeTitle}</h1>
          <p className="home-message">{home.welcomeMessage}</p>
          <button type="button" className="big-button" onClick={() => onOpen("account")}>
            {home.welcomeButton}
          </button>
          <p className="small">{home.privacyLine}</p>
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
  const outOfDateText = outOfDate ? describeWarning(outOfDate) : null;

  return (
    <>
      <h1 className="home-title">{head.title}</h1>
      {head.amount !== null ? <p className="big-number">{head.amount}</p> : null}
      <p className="home-message">{head.message}</p>
      {result.safeToSpend !== null ? (
        <p className="small">{paydayLine(result.paydayDate, result.daysUntilPayday)}</p>
      ) : null}

      {outOfDateText ? <p className="small">{outOfDateText}</p> : null}
      {waitingQuestions.length > 0 ? (
        <button type="button" className="link" onClick={() => onOpen("explain")}>
          {home.questionWaiting}
        </button>
      ) : null}
    </>
  );
}
