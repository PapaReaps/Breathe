import { describeLine, describeWarning, questionFor, words } from "../content/words";
import { formatMoney } from "../logic/money";
import { formatDayShort } from "../logic/dates";
import type { BreakdownLine } from "../logic/types";
import type { BuildResult } from "../logic/form";
import type { FormApi, NeedsAnswer, Outcome } from "./screenTypes";

interface ExplainViewProps {
  built: BuildResult;
  outcome: Outcome | null;
  hasAnswers: boolean;
  api: FormApi;
  /** The main money's own name is shown only when the person chose to show it. */
  showMoneyName: boolean;
}

/** "Where this number comes from": the breakdown, any notes, and any quick questions. */
export function ExplainView({ built, outcome, hasAnswers, api, showMoneyName }: ExplainViewProps) {
  if (built.status === "needs-more" || outcome === null || !outcome.ok) {
    return <p>{words.menu.liveWaiting}</p>;
  }

  const { result } = outcome;
  const questions = result.warnings.filter((w): w is NeedsAnswer => w.kind === "needs-answer");
  const notes = result.warnings.map(describeWarning).filter((text): text is string => text !== null);

  return (
    <>
      {questions.length > 0 ? (
        <div className="question" role="group" aria-labelledby="question-title">
          <h3 id="question-title">{words.ui.questionTitle}</h3>
          {questions.map((question) => (
            <div key={question.id} className="question-item">
              <p>{questionFor(question)}</p>
              <div className="buttons">
                <button type="button" onClick={() => api.answer(question.id, true)}>
                  {words.ui.yes}
                </button>
                <button type="button" className="secondary" onClick={() => api.answer(question.id, false)}>
                  {words.ui.no}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {hasAnswers ? (
        <button type="button" className="link" onClick={api.clearAnswers}>
          {words.ui.clearAnswers}
        </button>
      ) : null}

      {notes.length > 0 ? (
        <ul className="plain-list notes">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}

      {result.lines.length > 0 ? (
        <ul className="plain-list breakdown" aria-label={words.ui.breakdownTitle}>
          {groupBills(result.lines).map((item, index) => {
            if (item.kind === "bills") {
              const total = item.lines.reduce((sum, line) => sum + line.amount, 0);
              return (
                <li key="bills" className="breakdown-group">
                  <details>
                    <summary>
                      <span>{words.ui.billsGroup(item.lines.length)}</span>
                      <span className="amount">{formatMoney(total)}</span>
                    </summary>
                    <ul className="plain-list breakdown">
                      {item.lines.map((line, inner) => (
                        <Line key={`bill-${line.id ?? inner}`} line={line} nameOnly />
                      ))}
                    </ul>
                  </details>
                </li>
              );
            }
            return <Line key={`${item.line.kind}-${item.line.id ?? index}`} line={item.line} />;
          })}
        </ul>
      ) : null}

      {/* The main money is the finish line, not part of the sum: say so, so it never seems missing. */}
      <p className="gentle main-money-line">
        <strong>
          {words.ui.moneyLine(showMoneyName ? built.moneyName : "", formatDayShort(result.paydayDate), result.daysUntilPayday)}
        </strong>
        <br />
        <span className="small">{words.ui.moneyLineNote}</span>
      </p>
    </>
  );
}

/** One line of the breakdown. Inside the Bills group, just the bill's name: the heading already says "Bills". */
function Line({ line, nameOnly = false }: { line: BreakdownLine; nameOnly?: boolean }) {
  const described = describeLine(line);
  return (
    <li>
      <span>{nameOnly && line.name ? line.name : described.label}</span>
      <span className="amount">{described.amountText}</span>
    </li>
  );
}

type Item = { kind: "line"; line: BreakdownLine } | { kind: "bills"; lines: BreakdownLine[] };

/** Two or more bills fold into one "Bills" line, in the place of the first one. Tap it to see each. */
export function groupBills(lines: readonly BreakdownLine[]): Item[] {
  const bills = lines.filter((line) => line.kind === "bill");
  if (bills.length < 2) return lines.map((line) => ({ kind: "line", line }));
  const items: Item[] = [];
  for (const line of lines) {
    if (line.kind !== "bill") items.push({ kind: "line", line });
    else if (line === bills[0]) items.push({ kind: "bills", lines: bills });
  }
  return items;
}
