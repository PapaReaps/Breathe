import { useState } from "react";
import { words } from "../content/words";
import { comingUp, monthGrid, monthsBetween } from "../logic/comingUp";
import type { ComingUp, ComingUpDay, ComingUpItem } from "../logic/comingUp";
import { daysBetween, formatDayLong, weekdayName } from "../logic/dates";
import type { BuildResult } from "../logic/form";
import { formatMoney } from "../logic/money";
import type { CalendarView } from "../storage/settings";
import type { Outcome, SettingsApi } from "./screenTypes";

const text = words.comingUp;

/** "Coming up": bills and money day, as a simple list first, or as a month if you'd rather. */
export function ComingUpView({ built, outcome, settings }: { built: BuildResult; outcome: Outcome | null; settings: SettingsApi }) {
  if (built.status !== "ready" || outcome === null || !outcome.ok || outcome.result.safeToSpend === null) {
    return <p className="gentle">{text.waiting}</p>;
  }
  const data = comingUp(built.input, outcome.result.paydayDate);
  const view = settings.settings.calendarView;
  const choose = (next: CalendarView) => settings.change({ calendarView: next });

  return (
    <>
      <p className="hint">{text.intro}</p>
      <div className="view-switch" role="radiogroup" aria-label={text.viewLabel}>
        {(["list", "month"] as const).map((choice) => (
          <label key={choice} className={view === choice ? "picked" : ""}>
            <input type="radio" name="calendar-view" checked={view === choice} onChange={() => choose(choice)} />
            {text.views[choice]}
          </label>
        ))}
      </div>
      {view === "month" ? <MonthView data={data} name={built.moneyName} /> : <ListView data={data} name={built.moneyName} />}
      <p className="coming-total">{data.billCount === 0 ? text.noBills : text.billTotal(data.billCount, formatMoney(data.billTotal))}</p>
    </>
  );
}

function itemLabel(item: ComingUpItem, name: string): string {
  if (item.kind === "money-day") return text.moneyDayNamed(name);
  return item.name;
}

function ListView({ data, name }: { data: ComingUp; name: string }) {
  const startsToday = data.days[0]?.date === data.today;
  return (
    <ul className="coming-list">
      {startsToday ? null : (
        <li className="coming-day">
          <DateBadge date={data.today} />
          <div className="coming-what">
            <span className="coming-today">{text.today}</span>
          </div>
        </li>
      )}
      {data.days.map((day) => (
        <DayRow key={day.date} day={day} data={data} name={name} />
      ))}
    </ul>
  );
}

function DateBadge({ date }: { date: string }) {
  return (
    <span className="coming-date" aria-hidden="true">
      <b>{Number(date.slice(8, 10))}</b>
      <span>{weekdayName(date).slice(0, 3)}</span>
    </span>
  );
}

function DayRow({ day, data, name }: { day: ComingUpDay; data: ComingUp; name: string }) {
  const isMoney = day.date === data.moneyDay;
  const away = daysBetween(data.today, day.date);
  return (
    <li className={isMoney ? "coming-day coming-money" : "coming-day"} aria-label={formatDayLong(day.date)}>
      <DateBadge date={day.date} />
      <div className="coming-what">
        {day.date === data.today ? <span className="coming-today">{text.today}</span> : null}
        {day.items.map((item) =>
          item.kind === "money-day" ? (
            <div key="money" className="coming-item">
              <b>{text.moneyDayNamed(name)}</b>
              <span className="coming-tag">{away === 0 ? text.today : away === 1 ? text.tomorrow : text.inDays(away)}</span>
            </div>
          ) : (
            <div key={item.id} className="coming-item">
              <span>
                {item.name}
                <span className="coming-tag">{item.kind === "bill" ? text.bill : text.moneyIn}</span>
              </span>
              <b className="coming-amount">{item.kind === "income" ? `+${formatMoney(item.amount)}` : formatMoney(item.amount)}</b>
            </div>
          ),
        )}
      </div>
    </li>
  );
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

function MonthView({ data, name }: { data: ComingUp; name: string }) {
  const byDate = new Map(data.days.map((d) => [d.date, d]));
  const firstEvent = data.days.find((d) => d.date >= data.today)?.date ?? data.moneyDay;
  const [selected, setSelected] = useState<string>(byDate.has(data.today) ? data.today : firstEvent);
  const chosen = byDate.get(selected);

  return (
    <>
      {monthsBetween(data.today, data.moneyDay).map(({ year, month }) => (
        <section key={`${year}-${month}`} className="month" aria-label={`${MONTHS[month - 1]} ${year}`}>
          <h3 className="month-name">{MONTHS[month - 1]}</h3>
          <div className="month-grid">
            {DAY_LETTERS.map((letter, i) => (
              <span key={i} className="month-dow" aria-hidden="true">
                {letter}
              </span>
            ))}
            {monthGrid(year, month).map((date, i) => {
              if (date === null) return <span key={`b${i}`} />;
              const day = byDate.get(date);
              const classes = ["month-day"];
              if (date < data.today || date > data.moneyDay) classes.push("month-quiet");
              if (date === data.today) classes.push("month-today");
              if (day?.items.some((x) => x.kind === "bill")) classes.push("month-bill");
              if (day?.items.some((x) => x.kind === "income")) classes.push("month-in");
              if (date === data.moneyDay) classes.push("month-money");
              if (date === selected) classes.push("month-selected");
              const number = Number(date.slice(8, 10));
              if (day === undefined) {
                return (
                  <span key={date} className={classes.join(" ")}>
                    {number}
                  </span>
                );
              }
              return (
                <button
                  key={date}
                  type="button"
                  className={classes.join(" ")}
                  aria-pressed={date === selected}
                  aria-label={`${formatDayLong(date)}: ${day.items.map((item) => itemLabel(item, name)).join(", ")}`}
                  onClick={() => setSelected(date)}
                >
                  {number}
                </button>
              );
            })}
          </div>
        </section>
      ))}
      <div className="month-key" aria-hidden="true">
        <span><i className="key-bill" />{text.bill}</span>
        <span><i className="key-money" />{text.moneyDayNamed(name)}</span>
        <span><i className="key-today" />{text.today}</span>
      </div>
      <div className="month-details" aria-live="polite">
        <b>{formatDayLong(selected)}</b>
        {chosen === undefined ? (
          <p>{text.nothing}</p>
        ) : (
          chosen.items.map((item) => (
            <p key={item.kind === "money-day" ? "money" : item.id}>
              {item.kind === "money-day" ? text.moneyDayNamed(name) : `${item.name} · ${item.kind === "income" ? "+" : ""}${formatMoney(item.amount)}`}
            </p>
          ))
        )}
      </div>
    </>
  );
}
