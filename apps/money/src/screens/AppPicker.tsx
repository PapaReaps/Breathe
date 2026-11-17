import { useEffect, useRef, useState } from "react";
import { words } from "../content/words";
import type { BreathePart } from "../storage/settings";

/** What the name button and the picker share. The open state lives above both home screens, so it survives a switch. */
export interface PickerControl {
  open: boolean;
  setOpen: (open: boolean) => void;
  medicationAdded: boolean;
  onPick: (part: BreathePart) => void;
}

/** The name at the top left. Tapping it opens the picker (v1.4.0: a box in the middle of the screen). */
export function AppPicker({ name, label, picker }: { part: BreathePart; name: string; label: string; picker: PickerControl }) {
  return (
    <div className="app-picker">
      <button
        type="button"
        className="app-switch"
        aria-label={`${name}. ${label}`}
        aria-haspopup="dialog"
        aria-expanded={picker.open}
        onClick={() => picker.setOpen(true)}
      >
        <img className="app-logo" src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width="22" height="22" />
        <span className="app-name">{name}</span>
        <span className="app-caret" aria-hidden="true">
          ▾
        </span>
      </button>
    </div>
  );
}

/**
 * v1.4.0: the picker. The screen fades out behind it, and a small box comes up in the middle with the
 * other parts of Breathe (the one you're in is left out). Picking one, tapping outside, Escape or the
 * phone's Back fades it all away again. People who ask their phone for less motion get it without fading.
 */
export function AppPickerOverlay({ part, picker }: { part: BreathePart; picker: PickerControl }) {
  const { open, setOpen, medicationAdded, onPick } = picker;
  const m = words.menu;
  const first = useRef<HTMLButtonElement>(null);
  // The list is fixed while it's open (and fading away), so it doesn't change under the person's finger.
  const [shownFor, setShownFor] = useState<BreathePart>(part);

  useEffect(() => {
    if (!open) return;
    setShownFor(part);
    requestAnimationFrame(() => first.current?.focus());
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    // The phone's Back closes the picker first (see phoneBack.ts).
    const back = (event: Event) => {
      event.preventDefault();
      setOpen(false);
    };
    document.addEventListener("keydown", escape);
    window.addEventListener("breathe:back", back);
    return () => {
      document.removeEventListener("keydown", escape);
      window.removeEventListener("breathe:back", back);
    };
    // Only when it opens: the part changes while it fades away after a pick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const parts: Array<{ id: BreathePart; name: string; sub: string }> = [
    { id: "money", name: m.pickerNames.money, sub: "" },
    { id: "medication", name: m.pickerNames.medication, sub: medicationAdded ? "" : m.appsAdd },
  ];
  const rows = parts.filter((row) => row.id !== shownFor);

  return (
    <div className={open ? "picker open" : "picker"} inert={!open}>
      <div className="picker-dim" onClick={() => setOpen(false)} />
      <div className="picker-box" role="dialog" aria-modal="true" aria-label={m.pickerTitle}>
        <ul>
          {rows.map((row, i) => (
            <li key={row.id}>
              <button type="button" className="picker-row" ref={i === 0 ? first : undefined} onClick={() => onPick(row.id)}>
                <span>{row.name}</span>
                {row.sub ? <span className="picker-sub">{row.sub}</span> : null}
              </button>
            </li>
          ))}
          {m.pickerComing.map((later) => (
            <li key={later}>
              <div className="picker-row later">
                <span>{later}</span>
                <span className="picker-sub">{m.pickerLater}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
