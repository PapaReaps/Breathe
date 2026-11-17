import { useState } from "react";
import { words } from "../content/words";
import { dayDetail, dayMark, firstMonth, monthGrid, type DayMark } from "../logic/history";
import { dayKey, timeLabel, type MedicationData } from "../logic/medicines";

const h = words.history;

/**
 * History (Stage 4): a month of quiet dots. Full dot: all ticked. Soft dot: some. Ring: none
 * logged. No streaks, no scores, never red. Tap a day to see what was due.
 */
export default function HistoryView({ data, today }: { data: MedicationData; today: Date }) {
  const [shown, setShown] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [picked, setPicked] = useState<string | null>(dayKey(today));
  const first = firstMonth(data, today);
  const canGoBack = shown.year * 12 + shown.month > first.year * 12 + first.month;
  const canGoOn = shown.year * 12 + shown.month < today.getFullYear() * 12 + today.getMonth();
  const move = (by: number) => {
    const d = new Date(shown.year, shown.month + by, 1);
    setShown({ year: d.getFullYear(), month: d.getMonth() });
    setPicked(null);
  };
  const monthName = (offset: number) =>
    new Date(shown.year, shown.month + offset, 1).toLocaleDateString("en-GB", { month: "long" });
  const pickedDate = picked ? new Date(Number(picked.slice(0, 4)), Number(picked.slice(5, 7)) - 1, Number(picked.slice(8, 10))) : null;
  const detail = pickedDate ? dayDetail(data, pickedDate) : [];

  return (
    <div className="history">
      <div className="history-nav">
        <button type="button" className="secondary" onClick={() => move(-1)} disabled={!canGoBack} aria-label={h.previous(monthName(-1))}>
          ‹ {monthName(-1)}
        </button>
        <h3 aria-live="polite">{new Date(shown.year, shown.month, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</h3>
        <button type="button" className="secondary" onClick={() => move(1)} disabled={!canGoOn} aria-label={h.next(monthName(1))}>
          {monthName(1)} ›
        </button>
      </div>

      <div className="history-grid" role="grid" aria-label={h.gridLabel}>
        {h.weekdays.map((d, i) => (
          <span key={i} className="history-weekday" aria-hidden="true">
            {d}
          </span>
        ))}
        {monthGrid(shown.year, shown.month).map((date, i) => {
          if (!date) return <span key={`b${i}`} />;
          const mark: DayMark = dayMark(data, date, today);
          const key = dayKey(date);
          const label = `${date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}: ${h.marks[mark]}`;
          return (
            <button
              type="button"
              key={key}
              className={`history-day mark-${mark}${key === picked ? " is-picked" : ""}${key === dayKey(today) ? " is-today" : ""}`}
              aria-label={label}
              aria-pressed={key === picked}
              disabled={mark === "future"}
              onClick={() => setPicked(key)}
            >
              <span>{date.getDate()}</span>
              <i aria-hidden="true" />
            </button>
          );
        })}
      </div>

      <ul className="history-legend" aria-label={h.legendLabel}>
        <li>
          <i className="mark-all" aria-hidden="true" /> {h.marks.all}
        </li>
        <li>
          <i className="mark-some" aria-hidden="true" /> {h.marks.some}
        </li>
        <li>
          <i className="mark-none" aria-hidden="true" /> {h.marks.none}
        </li>
      </ul>

      {pickedDate ? (
        <section className="history-detail" aria-live="polite">
          <h3>{pickedDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</h3>
          {detail.length === 0 ? (
            <p className="hint">{h.nothingDue}</p>
          ) : (
            <ul>
              {detail.map((dose) => (
                <li key={dose.key}>
                  <span>
                    {dose.medicine.name} · {timeLabel(dose.time)}
                  </span>
                  <span className={dose.taken ? "detail-taken" : "detail-not"}>{dose.taken ? h.taken : h.notLogged}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <p className="hint">{h.footnote}</p>
    </div>
  );
}
