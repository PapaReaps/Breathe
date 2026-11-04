import { useId, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { words } from "../content/words";
import { formatDayLong } from "../logic/dates";
import { describeForm } from "../logic/form";
import type { FormState } from "../logic/form";
import { canEncrypt, checkNewPassphrase, isEncryptedBackupText, openEncryptedBackupText } from "../storage/encryptedBackup";
import type { PassphraseProblem } from "../storage/encryptedBackup";
import { parseBackupText } from "../storage/savedData";
import type { BackupProblem } from "../storage/savedData";
import { isNativeApp } from "../platform";
import type { DataApi } from "./screenTypes";

const text = words.data;
const MAX_FILE_BYTES = 2_000_000;

type Restore =
  | { step: "none" }
  | { step: "problem"; reason: BackupProblem }
  | { step: "passphrase"; content: string }
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
    if (isEncryptedBackupText(content)) {
      setRestore({ step: "passphrase", content });
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
        <p>{text.backupIntro}</p>

        <ProtectedBackup data={data} />

        <h4 className="sub-title">{text.plainTitle}</h4>
        <p className="gentle">{text.backupNotice}</p>
        <button
          type="button"
          className="secondary"
          onClick={async () => {
            try {
              await data.downloadBackup();
              setBackupMade(true);
            } catch {
              setBackupMade(false);
            }
          }}
        >
          {text.backupButton}
        </button>
        {backupMade ? (
          <p className="small" aria-live="polite">
            {isNativeApp() ? text.backupDoneApp : text.backupDone}
          </p>
        ) : null}
      </section>

      <section aria-labelledby="restore-title">
        <h3 id="restore-title">{text.restoreTitle}</h3>
        <p>{text.restoreIntro}</p>
        <label className="file-choice">
          <span>{text.restoreChoose}</span>
          {/* Android's file picker can't match ".json", so the app shows every file; the check below still refuses anything else. */}
          <input type="file" accept={isNativeApp() ? undefined : ".json,application/json"} onChange={onFile} />
        </label>

        <div aria-live="polite">
          {restore.step === "problem" ? <p className="gentle">{text.restoreProblem[restore.reason]}</p> : null}
          {restore.step === "done" ? <p>{text.restoredDone}</p> : null}
        </div>

        {restore.step === "passphrase" ? <UnlockBackup content={restore.content} onDone={setRestore} /> : null}
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

/** Choosing a passphrase and saving a protected backup. The passphrase lives only in this box, and only until it closes. */
function ProtectedBackup({ data }: { data: DataApi }) {
  const id = useId();
  const [passphrase, setPassphrase] = useState("");
  const [again, setAgain] = useState("");
  const [show, setShow] = useState(false);
  const [problem, setProblem] = useState<PassphraseProblem | null>(null);
  const [state, setState] = useState<"idle" | "working" | "done" | "failed">("idle");

  if (!canEncrypt()) {
    return (
      <>
        <h4 className="sub-title">{text.protectedTitle}</h4>
        <p className="gentle">{text.protectedUnavailable}</p>
      </>
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const found = checkNewPassphrase(passphrase, again);
    setProblem(found);
    if (found !== null) return;
    setState("working");
    try {
      await data.downloadProtectedBackup(passphrase);
      setPassphrase("");
      setAgain("");
      setShow(false);
      setState("done");
    } catch {
      setState("failed");
    }
  }

  const describedBy = `${id}-hint${problem !== null ? ` ${id}-problem` : ""}`;

  return (
    <form onSubmit={onSubmit} aria-labelledby={`${id}-title`} noValidate>
      <h4 className="sub-title" id={`${id}-title`}>
        {text.protectedTitle}
      </h4>
      <p>{text.protectedIntro}</p>
      <p className="gentle">
        <strong>{text.protectedForget}</strong>
      </p>
      <div className="field">
        <label htmlFor={`${id}-pass`}>{text.passphraseLabel}</label>
        <p className="hint" id={`${id}-hint`}>
          {text.passphraseHint}
        </p>
        <input
          id={`${id}-pass`}
          type={show ? "text" : "password"}
          autoComplete="new-password"
          autoCapitalize="off"
          spellCheck={false}
          value={passphrase}
          aria-describedby={describedBy}
          aria-invalid={problem === "too-short" ? true : undefined}
          onChange={(event) => setPassphrase(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor={`${id}-again`}>{text.passphraseAgainLabel}</label>
        <input
          id={`${id}-again`}
          type={show ? "text" : "password"}
          autoComplete="new-password"
          autoCapitalize="off"
          spellCheck={false}
          value={again}
          aria-describedby={problem !== null ? `${id}-problem` : undefined}
          aria-invalid={problem === "different" ? true : undefined}
          onChange={(event) => setAgain(event.target.value)}
        />
      </div>
      <label className="choice">
        <input type="checkbox" checked={show} onChange={(event) => setShow(event.target.checked)} />
        <span>{text.showPassphrase}</span>
      </label>
      <div aria-live="polite">
        {problem !== null ? (
          <p className="gentle" id={`${id}-problem`}>
            {text.passphraseProblem[problem]}
          </p>
        ) : null}
        {state === "working" ? <p className="small">{text.protectedWorking}</p> : null}
        {state === "done" ? <p className="small">{isNativeApp() ? text.backupDoneApp : text.protectedDone}</p> : null}
        {state === "failed" ? <p className="gentle">{text.protectedUnavailable}</p> : null}
      </div>
      <button type="submit" disabled={state === "working"}>
        {text.protectedButton}
      </button>
    </form>
  );
}

interface UnlockBackupProps {
  content: string;
  onDone: (next: Restore) => void;
}

/** Asking for the passphrase of a protected backup. Only reads the file; nothing changes yet. */
function UnlockBackup({ content, onDone }: UnlockBackupProps) {
  const id = useId();
  const [passphrase, setPassphrase] = useState("");
  const [state, setState] = useState<"idle" | "working" | "wrong" | "no-crypto">("idle");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setState("working");
    const opened = await openEncryptedBackupText(content, passphrase);
    if (opened.ok) {
      setPassphrase("");
      onDone({ step: "preview", form: opened.form, savedOn: opened.savedOn });
      return;
    }
    if (opened.reason === "wrong-passphrase") setState("wrong");
    else if (opened.reason === "no-crypto") setState("no-crypto");
    else onDone({ step: "problem", reason: opened.reason });
  }

  return (
    <form className="gentle" onSubmit={onSubmit} aria-labelledby={`${id}-title`}>
      <h4 className="sub-title" id={`${id}-title`}>
        {text.unlockTitle}
      </h4>
      <p>{text.unlockIntro}</p>
      <div className="field">
        <label htmlFor={`${id}-pass`}>{text.unlockLabel}</label>
        <input
          id={`${id}-pass`}
          type="password"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          autoFocus
          value={passphrase}
          aria-describedby={state === "wrong" || state === "no-crypto" ? `${id}-problem` : undefined}
          aria-invalid={state === "wrong" ? true : undefined}
          onChange={(event) => setPassphrase(event.target.value)}
        />
      </div>
      <div aria-live="polite">
        {state === "working" ? <p className="small">{text.unlockWorking}</p> : null}
        {state === "wrong" ? <p id={`${id}-problem`}>{text.unlockWrong}</p> : null}
        {state === "no-crypto" ? <p id={`${id}-problem`}>{text.unlockNoCrypto}</p> : null}
      </div>
      <div className="buttons">
        <button type="submit" disabled={state === "working" || passphrase === ""}>
          {text.unlockButton}
        </button>
        <button type="button" className="secondary" onClick={() => onDone({ step: "none" })}>
          {text.unlockCancel}
        </button>
      </div>
    </form>
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
