import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { words } from "../content/words";
import type { LockApi } from "../storage/useAppLock";

const text = words.lock;

interface LockScreenProps {
  lock: LockApi;
  /** Clears the numbers and removes the lock. Resolves to false if it couldn't be done. */
  onForgot: () => Promise<boolean>;
}

/** The privacy screen. Nothing about the numbers is shown, or even put on the page, until the PIN matches. */
export function LockScreen({ lock, onForgot }: LockScreenProps) {
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState<"none" | "checking" | "wrong">("none");
  const [forgot, setForgot] = useState(false);
  const [forgotProblem, setForgotProblem] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  const waiting = lock.waitUntil !== null && now < lock.waitUntil;
  const secondsLeft = lock.waitUntil === null ? 0 : Math.max(0, Math.ceil((lock.waitUntil - now) / 1000));

  // Count down a pause after several wrong tries.
  useEffect(() => {
    if (lock.waitUntil === null) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [lock.waitUntil]);

  useEffect(() => {
    if (!waiting && !forgot) inputRef.current?.focus();
  }, [waiting, forgot]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (waiting || pin === "") return;
    setMessage("checking");
    const result = await lock.unlock(pin);
    setPin("");
    setMessage(result === "wrong" ? "wrong" : "none");
  }

  return (
    <div className="home lock-screen">
      <header className="topbar">
        <span className="app-name">{words.home.appName}</span>
      </header>
      <main className="home-main">
        {forgot ? (
          <section aria-labelledby="forgot-title" className="lock-box">
            <h1 className="home-title" id="forgot-title">
              {text.forgotTitle}
            </h1>
            <p>{text.forgotIntro}</p>
            <p>{text.forgotBackup}</p>
            <div className="buttons">
              <button
                type="button"
                onClick={async () => {
                  setForgotProblem(false);
                  if (!(await onForgot())) setForgotProblem(true);
                }}
              >
                {text.forgotYes}
              </button>
              <button type="button" className="secondary" onClick={() => setForgot(false)}>
                {text.forgotNo}
              </button>
            </div>
            <div aria-live="polite">{forgotProblem ? <p className="gentle">{text.forgotProblem}</p> : null}</div>
          </section>
        ) : (
          <form onSubmit={onSubmit} className="lock-box" aria-labelledby="lock-title">
            <h1 className="home-title" id="lock-title">
              {text.title}
            </h1>
            <p>{text.intro}</p>
            <div className="field">
              <label htmlFor="lock-pin">{text.pinLabel}</label>
              <input
                id="lock-pin"
                ref={inputRef}
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={12}
                value={pin}
                disabled={waiting}
                aria-describedby="lock-message"
                aria-invalid={message === "wrong" ? true : undefined}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div id="lock-message" aria-live="polite">
              {message === "checking" ? <p className="small">{text.checking}</p> : null}
              {message === "wrong" && !waiting ? <p className="gentle">{text.wrong}</p> : null}
              {waiting ? <p className="gentle">{text.pause(secondsLeft)}</p> : null}
            </div>
            <div className="buttons">
              <button type="submit" disabled={waiting || pin === "" || message === "checking"}>
                {text.open}
              </button>
              <button type="button" className="link" onClick={() => setForgot(true)}>
                {text.forgotButton}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
