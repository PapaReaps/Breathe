import { useEffect, useRef } from "react";
import { words } from "../content/words";

const home = words.home;

/**
 * "Breathe Money is ready" (v1.0.0): shown once to people who were already using the app,
 * the first time they open version 1.0. New people get the welcome instead.
 * It uses the browser's own <dialog>, which keeps focus inside and handles Back/Escape.
 */
export function ReadyPopup({ onDone }: { onDone: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog !== null && !dialog.open && typeof dialog.showModal === "function") dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      className="update-pop ready-pop"
      aria-labelledby="ready-pop-title"
      aria-describedby="ready-pop-text"
      onCancel={(event) => {
        event.preventDefault();
        onDone();
      }}
    >
      <p className="ready-pop-dots" aria-hidden="true">
        · · ·
      </p>
      <h2 id="ready-pop-title">{home.readyTitle}</h2>
      <p id="ready-pop-text">{home.readyText}</p>
      <div className="buttons">
        <button type="button" onClick={onDone}>
          {home.readyButton}
        </button>
      </div>
    </dialog>
  );
}
