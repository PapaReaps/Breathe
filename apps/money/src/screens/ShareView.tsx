import { useState } from "react";
import { words } from "../content/words";
import { isNativeApp } from "../platform";
import { QrCode } from "./QrCode";

/** Where Breathe Money lives. These are only links the person chooses to copy or open: nothing is fetched. */
export const WEB_ADDRESS = "https://papareaps.github.io/Breathe/";
/** Always the newest Android app: each release also uploads a copy named breathe-money.apk. Tapping it downloads straight away. */
export const APK_DOWNLOAD = "https://github.com/PapaReaps/Breathe/releases/latest/download/breathe-money.apk";
/** GitHub's page for choosing a report form: "Something isn't working" or "An idea". */
export const REPORT_PAGE = "https://github.com/PapaReaps/Breathe/issues/new/choose";

const text = words.share;

type Kind = "android" | "web";
const LINKS: Record<Kind, string> = { android: APK_DOWNLOAD, web: WEB_ADDRESS };

/** "Share Breathe Money": a QR code a friend can point their camera at, plus the same link to copy or share. */
export function ShareView() {
  const [kind, setKind] = useState<Kind>("android");
  return (
    <>
      <p>{text.intro}</p>
      <div className="view-switch" role="radiogroup" aria-label={text.switchLabel}>
        {(["android", "web"] as const).map((choice) => (
          <label key={choice} className={kind === choice ? "picked" : ""}>
            <input type="radio" name="share-kind" checked={kind === choice} onChange={() => setKind(choice)} />
            {text.kinds[choice]}
          </label>
        ))}
      </div>
      <ShareLink key={kind} title={text.titles[kind]} hint={text.hints[kind]} url={LINKS[kind]} />
    </>
  );
}

function ShareLink({ title, hint, url }: { title: string; hint: string; url: string }) {
  const [note, setNote] = useState<"none" | "copied" | "not-copied">("none");
  const canShare = isNativeApp() || typeof navigator.share === "function";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setNote("copied");
    } catch {
      setNote(copyTheOldWay(url) ? "copied" : "not-copied");
    }
  };

  const share = async () => {
    try {
      if (isNativeApp()) {
        const { Share } = await import("@capacitor/share");
        await Share.share({ title: "Breathe Money", url, dialogTitle: title });
      } else {
        await navigator.share({ title: "Breathe Money", url });
      }
    } catch {
      /* Closing the share sheet is fine: nothing to say. */
    }
  };

  return (
    <section className="share-link">
      <QrCode text={url} label={text.qrLabel(title)} />
      <h3>{title}</h3>
      <p className="small">{hint}</p>
      <p className="share-address">{url}</p>
      <div className="buttons">
        <button type="button" onClick={() => void copy()}>
          {text.copy}
        </button>
        {canShare ? (
          <button type="button" className="secondary" onClick={() => void share()}>
            {text.share}
          </button>
        ) : null}
      </div>
      <p className="small" aria-live="polite">
        {note === "copied" ? text.copied : note === "not-copied" ? text.notCopied : ""}
      </p>
    </section>
  );
}

/** Some browsers and phones block the newer copy: this older way works almost everywhere. */
function copyTheOldWay(value: string): boolean {
  const box = document.createElement("textarea");
  box.value = value;
  box.setAttribute("readonly", "");
  box.style.position = "fixed";
  box.style.opacity = "0";
  // Inside the open menu panel: everything outside it can't be selected while it is open.
  (document.querySelector("dialog[open]") ?? document.body).appendChild(box);
  box.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  box.remove();
  return ok;
}

/** "Report a problem": opens GitHub's report forms, which ask a few gentle questions. */
export function ReportView() {
  const r = words.report;
  const link = REPORT_PAGE;
  return (
    <>
      <p>{r.intro}</p>
      <p>{r.how}</p>
      <p className="small">{r.privacy}</p>
      <p>
        <a className="button-link" href={link} target="_blank" rel="noopener noreferrer">
          {r.button}
        </a>
      </p>
    </>
  );
}
