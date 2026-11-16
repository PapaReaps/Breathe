import { useEffect, useState } from "react";
import { todayLabel, words } from "./content/words";
import {
  dosesFor,
  groupByPart,
  newId,
  nextLine,
  putMedicine,
  removeMedicine,
  setTaken,
  shortTimeLabel,
  timeLabel,
} from "./logic/medicines";
import MedicineSheet from "./screens/MedicineSheet";
import MenuSheet from "./screens/MenuSheet";
import { hideSplash } from "./splash";
import { useMedications } from "./storage/useMedications";

type Panel = null | { kind: "menu" } | { kind: "medicine"; id: string | null };

/** The time, refreshed every half minute, so "Next" and the day move on by themselves. */
function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    const wake = () => setNow(new Date());
    document.addEventListener("visibilitychange", wake);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", wake);
    };
  }, []);
  return now;
}

export default function App() {
  const { data, loading, notSaved, readProblem, update } = useMedications();
  const [panel, setPanel] = useState<Panel>(null);
  const now = useNow();

  useEffect(() => {
    if (!loading) hideSplash();
  }, [loading]);

  const doses = dosesFor(data, now);
  const line = nextLine(doses, now);
  const welcome = !loading && data.medicines.length === 0;
  const editing = panel?.kind === "medicine" && panel.id !== null ? (data.medicines.find((m) => m.id === panel.id) ?? null) : null;

  return (
    <div className="home">
      <header className="topbar">
        <span className="app-title">
          <img className="app-logo" src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width="22" height="22" />
          {words.appName}
        </span>
        <button type="button" className="menu-button" onClick={() => setPanel({ kind: "menu" })} aria-haspopup="dialog" disabled={loading}>
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span>{words.menuButton}</span>
        </button>
      </header>

      <main className={welcome || loading ? "home-main" : "home-main today"} data-screen={welcome ? "welcome" : "home"}>
        {loading ? null : (
          <div className="breath-mark" aria-hidden="true">
            breathe
          </div>
        )}
        {loading ? (
          <p className="home-message">{words.loading}</p>
        ) : welcome ? (
          <>
            <h1 className="welcome-heading">
              {words.welcomeTitle} <span>{words.welcomeTitleTwo}</span>
            </h1>
            <p className="home-message">{words.welcomeMessage}</p>
            <button type="button" className="big-button" onClick={() => setPanel({ kind: "medicine", id: null })}>
              {words.welcomeButton}
            </button>
          </>
        ) : (
          <>
            <h1 className="today-date">{todayLabel(now)}</h1>
            <p className="today-next" aria-live="polite">
              {line.kind === "next"
                ? words.next(line.dose.medicine.name, shortTimeLabel(line.dose.time))
                : line.kind === "all-done"
                  ? words.allDone
                  : line.kind === "nothing-left-later"
                    ? words.nothingLater
                    : ""}
            </p>
            <div className="dose-groups">
              {groupByPart(doses).map((group) => (
                <section className="dose-group" key={group.part} aria-labelledby={`part-${group.part}`}>
                  <h2 id={`part-${group.part}`}>{words.parts[group.part]}</h2>
                  <ul className="dose-list">
                    {group.doses.map((dose) => {
                      const time = timeLabel(dose.time);
                      return (
                        <li key={dose.key} className={dose.taken ? "dose is-taken" : "dose"}>
                          <div>
                            <div className="dose-name">{dose.medicine.name}</div>
                            <div className="dose-sub">
                              {dose.taken ? words.doseLine(time, dose.medicine.amount) : words.doseLine(time, words.notTakenYet)}
                            </div>
                          </div>
                          <button
                            type="button"
                            className={dose.taken ? "taken" : undefined}
                            aria-pressed={dose.taken}
                            aria-label={dose.taken ? words.undoLabel(dose.medicine.name, time) : words.takenLabel(dose.medicine.name, time)}
                            onClick={() => update((d) => setTaken(d, now, dose.key, !dose.taken))}
                          >
                            {dose.taken ? words.takenDone : words.takenButton}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
            {notSaved ? <p className="small">{words.notSavedLine}</p> : null}
            {readProblem ? <p className="small">{words.readProblemLine}</p> : null}
            <p className="not-advice">{words.notAdvice}</p>
          </>
        )}
      </main>

      {panel?.kind === "menu" ? (
        <MenuSheet
          medicines={data.medicines}
          onAdd={() => setPanel({ kind: "medicine", id: null })}
          onEdit={(id) => setPanel({ kind: "medicine", id })}
          onClose={() => setPanel(null)}
        />
      ) : null}
      {panel?.kind === "medicine" ? (
        <MedicineSheet
          key={panel.id ?? "new"}
          medicine={editing}
          newId={() => newId(data)}
          onSave={(medicine) => {
            update((d) => putMedicine(d, medicine));
            setPanel(null);
          }}
          onRemove={(id) => {
            update((d) => removeMedicine(d, id));
            setPanel(null);
          }}
          onClose={() => setPanel(null)}
        />
      ) : null}
    </div>
  );
}
