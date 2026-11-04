import { describeLine, describeWarning, questionFor, words } from "../content/words";
import type { BuildResult } from "../logic/form";
import type { FormApi, NeedsAnswer, Outcome } from "./screenTypes";

interface ExplainViewProps {
  built: BuildResult;
  outcome: Outcome | null;
  hasAnswers: boolean;
  api: FormApi;
}

/** "Where this number comes from": the breakdown, any notes, and any quick questions. */
export function ExplainView({ built, outcome, hasAnswers, api }: ExplainViewProps) {
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
          {result.lines.map((line, index) => {
            const described = describeLine(line);
            return (
              <li key={`${line.kind}-${line.id ?? index}`}>
                <span>{described.label}</span>
                <span className="amount">{described.amountText}</span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </>
  );
}
