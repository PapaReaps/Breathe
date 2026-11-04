import { useState } from "react";
import type { ChangeEvent } from "react";
import { words } from "../content/words";
import { formatDayLong } from "../logic/dates";
import { describeForm } from "../logic/form";
import type { FormState } from "../logic/form";
import { parseBackupText } from "../storage/savedData";
import type { BackupProblem } from "../storage/savedData";
import type { DataApi } from "./screenTypes";

const text = words.data;
const MAX_FILE_BYTES = 1_000_000;

type Restore =
  | { step: "none" }
  | { step: "problem"; reason: BackupProblem }
  | { step: "preview"; form: FormState; savedOn: string | null }
  | { step: "done" };

interface DataViewProps {
  data: DataApi;
}

/** Where the numbers live, their limits, and the ways to back up, restore or clear them. */
export function DataView({ data }: DataViewProps) {
  const [backupMade, setBackupMade] = useState(false);
  const [restore, setRestore] = useState<Restore>({ step: "none" });
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [cleared, setCleared] = useState<null | boolean>(null);

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    input.value = ""; // so choosing the same file again still works
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setRestore({ step: "problem", reason: "too-big" });
      return;
    }
    let content: string;
    try {
      content = await file.text();
    } catch {
      setRestore({ step: "problem", reason: "unreadable" });
      return;
    }
    const parsed = parseBackupText(content);
    if (!parsed.ok) {
      setRestore({ step: "problem", reason: parsed.reason });
      return;
    }
    setRestore({ step: "preview", form: parsed.form, savedOn: parsed.savedOn });
  }

  const stateLine =
    data.saveState === "saved"
      ? text.stateSaved
      : data.saveState === "saving"
        ? text.stateSaving
        : data.saveState === "not-saved"
          ? text.stateNotSaved
          : text.stateIdle;

  const persistedLine =
    data.persisted === true ? text.persistedYes : data.persisted === false ? text.persistedNo : text.persistedUnknown;

  return (
    <>
      <p>{text.intro}</p>

      <div className="gentle">
        <h3>{text.limitsTitle}</h3>
        <ul className="plain-list">
          {text.limits.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <p aria-live="polite">{stateLine}</p>
      <p className="small">{persistedLine}</p>

      <section aria-labelledby="backup-title">
        <h3 id="backup-title">{text.backupTitle}</h3>
        <p className="gentle">{text.backupNotice}</p>
        <button
          type="button"
          onClick={() => {
            data.downloadBackup();
            setBackupMade(true);
          }}
        >
          {text.backupButton}
        </button>
        {backupMade ? (
          <p className="small" aria-live="polite">
            {text.backupDone}
          </p>
        ) : null}
      </section>

      <section aria-labelledby="restore-title">
        <h3 id="restore-title">{text.restoreTitle}</h3>
        <p>{text.restoreIntro}</p>
        <label className="file-choice">
          <span>{text.restoreChoose}</span>
          <input type="file" accept=".json,application/json" onChange={onFile} />
        </label>

        <div aria-live="polite">
          {restore.step === "problem" ? <p className="gentle">{text.restoreProblem[restore.reason]}</p> : null}
          {restore.step === "done" ? <p>{text.restoredDone}</p> : null}
        </div>

        {restore.step === "preview" ? <RestorePreview restore={restore} data={data} onDone={setRestore} /> : null}
      </section>

      <section aria-labelledby="clear-title">
        <h3 id="clear-title">{text.clearTitle}</h3>
        <p>{text.clearIntro}</p>
        {confirmingClear ? (
          <div className="gentle" role="group" aria-label={text.clearSure}>
            <p>{text.clearSure}</p>
            <div className="buttons">
              <button
                type="button"
                onClick={async () => {
                  setConfirmingClear(false);
                  setRestore({ step: "none" });
                  setCleared(await data.clearAll());
                }}
              >
                {text.clearYes}
              </button>
              <button type="button" className="secondary" onClick={() => setConfirmingClear(false)}>
                {text.clearNo}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setCleared(null);
              setConfirmingClear(true);
            }}
          >
            {text.clearButton}
          </button>
        )}
        {cleared !== null ? (
          <p className="small" aria-live="polite">
            {cleared ? text.clearedDone : text.clearedPartly}
          </p>
        ) : null}
      </section>
    </>
  );
}

interface RestorePreviewProps {
  restore: Extract<Restore, { step: "preview" }>;
  data: DataApi;
  onDone: (next: Restore) => void;
}

function RestorePreview({ restore, data, onDone }: RestorePreviewProps) {
  const summary = describeForm(restore.form);
  const savedOn = restore.savedOn === null ? null : formatDayLong(restore.savedOn);
  return (
    <div className="gentle" role="group" aria-label={text.restorePreview(savedOn)}>
      <p>{text.restorePreview(savedOn)}</p>
      <ul className="plain-list">
        <li>{words.menu.names.account}: {summary.account}</li>
        <li>{words.menu.names.payday}: {summary.payday}</li>
        <li>{words.menu.names.bills}: {summary.bills}</li>
        <li>{words.menu.names.income}: {summary.income}</li>
        <li>{words.menu.names.essentials}: {summary.essentials}</li>
        <li>{words.menu.names.pot}: {summary.pot}</li>
        <li>{words.menu.names.holidays}: {summary.holidays}</li>
      </ul>
      <div className="buttons">
        <button
          type="button"
          onClick={() => {
            data.replaceAll(restore.form);
            onDone({ step: "done" });
          }}
        >
          {text.restoreReplace}
        </button>
        <button type="button" className="secondary" onClick={() => onDone({ step: "none" })}>
          {text.restoreKeep}
        </button>
      </div>
    </div>
  );
}
