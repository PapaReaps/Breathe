import { words } from "../content/words";
import { comingUp, monthGrid, monthsBetween } from "../logic/comingUp";
import type { ComingUp, ComingUpDay } from "../logic/comingUp";
import { daysBetween, formatDayLong, formatDayShort, weekdayName } from "../logic/dates";
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
      {view === "month" ? <MonthView data={data} name={built.moneyName} amount={built.moneyAmount} /> : <ListView data={data} name={built.moneyName} />}
      <p className="coming-total">{data.billCount === 0 ? text.noBills : text.billTotal(data.billCount, formatMoney(data.billTotal))}</p>
    </>
  );
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
              <span>{item.name}</span>
              <b className="coming-amount">
                {formatMoney(item.amount)}
                <span className={item.kind === "income" ? "coming-way coming-in" : "coming-way coming-out"}>
                  {item.kind === "income" ? text.inWord : text.outWord}
                </span>
              </b>
            </div>
          ),
        )}
      </div>
    </li>
  );
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

/**
 * The month (v0.30.0): small dots under each day (teal for money in, rose for money out,
 * two teal for your main money), today in a filled circle, and every amount in a list below.
 */
function MonthView({ data, name, amount }: { data: ComingUp; name: string; amount: number | null }) {
  const byDate = new Map(data.days.map((d) => [d.date, d]));
  const mainName = name === "" ? text.mainMoneyShort : name;
  const dotsFor = (day: ComingUpDay | undefined): Array<"in" | "out"> =>
    (day?.items ?? []).flatMap((item): Array<"in" | "out"> =>
      item.kind === "bill" ? ["out"] : item.kind === "income" ? ["in"] : ["in", "in"],
    );
  const rows = data.days.flatMap((day) =>
    day.items.map((item) => ({ date: day.date, item, key: item.kind === "money-day" ? `money-${day.date}` : item.id })),
  );

  return (
    <>
      {monthsBetween(data.today, data.moneyDay).map(({ year, month }) => (
        <section key={`${year}-${month}`} className="month" aria-label={`${MONTHS[month - 1]} ${year}`}>
          <h3 className="month-name">
            <span>{MONTHS[month - 1]}</span>
          </h3>
          <div className="month-grid" aria-hidden="true">
            {DAY_LETTERS.map((letter, i) => (
              <span key={i} className="month-dow">
                {letter}
              </span>
            ))}
            {monthGrid(year, month).map((date, i) => {
              if (date === null) return <span key={`b${i}`} />;
              const quiet = date < data.today || date > data.moneyDay;
              const dots = dotsFor(byDate.get(date));
              return (
                <span key={date} className={quiet ? "month-day month-quiet" : "month-day"}>
                  <span className={date === data.today ? "month-num month-today" : "month-num"}>{Number(date.slice(8, 10))}</span>
                  {dots.length > 0 ? (
                    <span className="month-dots">
                      {dots.map((way, k) => (
                        <i key={k} className={way === "in" ? "month-dot dot-in" : "month-dot dot-out"} />
                      ))}
                    </span>
                  ) : null}
                </span>
              );
            })}
          </div>
        </section>
      ))}
      <div className="month-key" aria-hidden="true">
        <span><i className="month-dot dot-in" />{text.keyIn}</span>
        <span><i className="month-dot dot-out" />{text.keyOut}</span>
        <span><i className="month-dot dot-in" /><i className="month-dot dot-in" />{text.keyMain}</span>
        <span><i className="key-today" />{text.today}</span>
      </div>
      <ul className="plain-list month-list">
        {rows.map(({ date, item, key }) => {
          const label = item.kind === "money-day" ? mainName : item.name;
          const way = item.kind === "bill" ? "out" : "in";
          const value = item.kind === "money-day" ? amount : item.amount;
          return (
            <li key={key} className="coming-item">
              <span>
                {formatDayShort(date)} · {label}
              </span>
              <b className={way === "in" ? "coming-in" : "coming-out"}>
                {value === null ? "" : `${formatMoney(value)} `}
                {way === "in" ? text.inWord : text.outWord}
              </b>
            </li>
          );
        })}
      </ul>
    </>
  );
}
