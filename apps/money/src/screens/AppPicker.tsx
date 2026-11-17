import { useEffect, useRef } from "react";
import { words } from "../content/words";
import type { BreathePart } from "../storage/settings";

/** What both home screens need to show the picker. The open state lives above them, so it survives a switch. */
export interface PickerControl {
  open: boolean;
  setOpen: (open: boolean) => void;
  medicationAdded: boolean;
  onPick: (part: BreathePart) => void;
}

/**
 * The name at the top left (v1.3.0). Tap it and a small panel slides down underneath, slowly,
 * to pick Breathe Money or Breathe Medication. Tap outside, press Escape or the phone's Back to close it.
 * People who ask their phone for less motion get it without the slide (see styles.css).
 */
export function AppPicker({ part, name, label, picker }: { part: BreathePart; name: string; label: string; picker: PickerControl }) {
  const { open, setOpen, medicationAdded, onPick } = picker;
  const box = useRef<HTMLDivElement>(null);
  const m = words.menu;

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (box.current && !box.current.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    // The phone's Back closes the picker first (see phoneBack.ts).
    const back = (event: Event) => {
      event.preventDefault();
      setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    window.addEventListener("breathe:back", back);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
      window.removeEventListener("breathe:back", back);
    };
  }, [open, setOpen]);

  const rows: Array<{ id: BreathePart; name: string; sub: string }> = [
    { id: "money", name: m.appsMoney, sub: part === "money" ? m.appsHere : m.appsOpenRow },
    { id: "medication", name: m.appsMedication, sub: part === "medication" ? m.appsHere : medicationAdded ? m.appsOpenRow : m.appsAdd },
  ];

  return (
    <div className="app-picker" ref={box}>
      <button
        type="button"
        className="app-switch"
        aria-label={`${name}. ${label}`}
        aria-expanded={open}
        aria-controls="app-picker-list"
        onClick={() => setOpen(!open)}
      >
        <img className="app-logo" src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width="22" height="22" />
        <span className="app-name">{name}</span>
        <span className={open ? "app-caret app-caret-open" : "app-caret"} aria-hidden="true">
          ▾
        </span>
      </button>
      <div id="app-picker-list" className={open ? "app-picker-panel open" : "app-picker-panel"} inert={!open}>
        <ul>
          {rows.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                className={row.id === part ? "app-picker-row here" : "app-picker-row"}
                aria-current={row.id === part ? "page" : undefined}
                onClick={() => onPick(row.id)}
              >
                <span>{row.name}</span>
                <span className="app-picker-sub">{row.sub}</span>
              </button>
            </li>
          ))}
          {m.appsComing.map((later) => (
            <li key={later}>
              <div className="app-picker-row later">
                <span>{later}</span>
                <span className="app-picker-sub">{m.appsLater}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
