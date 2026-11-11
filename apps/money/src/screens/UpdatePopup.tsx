import { useEffect, useRef } from "react";
import { words } from "../content/words";
import { InstallUpdate } from "./InstallUpdate";

const home = words.home;

/**
 * "Update ready" (v0.34.0): a calm pop-up in the middle of the home screen when a newer
 * Android version is out. Update now downloads and installs it; Later hides it until the
 * next version (the small button under the number stays, so it's never lost).
 * It uses the browser's own <dialog>, which keeps focus inside and handles Back/Escape.
 */
export function UpdatePopup({ version, apk, page, onLater }: { version: string; apk: string; page: string; onLater: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog !== null && !dialog.open && typeof dialog.showModal === "function") dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      className="update-pop"
      aria-labelledby="update-pop-title"
      aria-describedby="update-pop-text"
      onCancel={(event) => {
        event.preventDefault();
        onLater();
      }}
    >
      <svg className="update-pop-icon" width="30" height="30" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
        <path d="M10 3v9m0 0-3.5-3.5M10 12l3.5-3.5M4 16h12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <h2 id="update-pop-title">{home.updatePopTitle}</h2>
      <p id="update-pop-text">{home.updatePopText(version)}</p>
      <InstallUpdate apk={apk} page={page} label={home.updatePopNow} showGithub={false} />
      <button type="button" className="link update-pop-later" onClick={onLater}>
        {home.updatePopLater}
      </button>
    </dialog>
  );
}
