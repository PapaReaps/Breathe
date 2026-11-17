import { useEffect, useRef, type ReactNode } from "react";
import { words } from "../content/words";

/** A full-screen panel (a <dialog>), the same as Breathe Money's menu. The phone's Back (or Escape) steps back a page. */
export default function Sheet({
  title,
  onClose,
  onBack,
  children,
}: {
  title: string;
  onClose: () => void;
  /** Inner pages go back to the menu, like Breathe Money's. The menu itself has no Back. */
  onBack?: () => void;
  children: ReactNode;
}) {
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
        (onBack ?? onClose)();
      }}
    >
      <div className="sheet-inner">
        <div className="sheet-header">
          {onBack ? (
            <button type="button" className="secondary" onClick={onBack}>
              {words.menu.back}
            </button>
          ) : (
            <span />
          )}
          <button type="button" onClick={onClose}>
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
