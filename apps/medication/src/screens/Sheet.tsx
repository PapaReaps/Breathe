import { useEffect, useRef, type ReactNode } from "react";
import { words } from "../content/words";

/** A full-screen panel (a <dialog>), the same as Breathe Money's menu. Back or Escape closes it. */
export default function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    heading.current?.focus();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby="sheet-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="sheet-inner">
        <div className="sheet-header">
          <span className="app-title">{words.appName}</span>
          <button type="button" className="close-button" onClick={onClose}>
            {words.menu.close}
          </button>
        </div>
        <div className="sheet-body">
          <h2 id="sheet-title" ref={heading} tabIndex={-1}>
            {title}
          </h2>
          {children}
        </div>
      </div>
    </dialog>
  );
}
