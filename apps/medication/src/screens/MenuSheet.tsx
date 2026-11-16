import { useState } from "react";
import { words } from "../content/words";
import { timeLabel, type Medicine } from "../logic/medicines";
import Sheet from "./Sheet";
import { ReminderSettings } from "./ReminderNotes";
import type { Reminders } from "../storage/useReminders";

const menu = words.menu;

interface Props {
  medicines: Medicine[];
  reminders: Reminders;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onClose: () => void;
}

/** The menu: your medicines (tap one to change it), add another, and about. */
export default function MenuSheet({ medicines, reminders, onAdd, onEdit, onClose }: Props) {
  const [about, setAbout] = useState(false);
  const [remindersPage, setRemindersPage] = useState(false);
  const rem = words.reminders;

  if (remindersPage) {
    return (
      <Sheet title={rem.panelTitle} onClose={onClose} key="reminders">
        <ReminderSettings reminders={reminders} />
        <button type="button" className="link" onClick={() => setRemindersPage(false)}>
          {menu.back}
        </button>
      </Sheet>
    );
  }

  if (about) {
    return (
      <Sheet title={menu.about} onClose={onClose} key="about">
        {menu.aboutText.map((line) => (
          <p key={line}>{line}</p>
        ))}
        <button type="button" className="link" onClick={() => setAbout(false)}>
          {menu.back}
        </button>
      </Sheet>
    );
  }

  return (
    <Sheet title={menu.title} onClose={onClose} key="menu">
      <h3 style={{ margin: "0 0 0.5rem" }}>{menu.yourMedicines}</h3>
      {medicines.length === 0 ? <p className="hint">{menu.none}</p> : null}
      <ul className="menu-list">
        {medicines.map((m) => (
          <li key={m.id}>
            <button type="button" className="menu-item" onClick={() => onEdit(m.id)}>
              <span className="menu-title">{m.name}</span>
              <span className="menu-sub">{menu.timesSummary(m.times.map(timeLabel))}</span>
            </button>
          </li>
        ))}
        <li>
          <button type="button" className="menu-item" onClick={onAdd}>
            <span className="menu-title">{menu.add}</span>
            <span className="menu-sub" aria-hidden="true">
              +
            </span>
          </button>
        </li>
      </ul>
      <ul className="menu-list">
        <li>
          <button type="button" className="menu-item" onClick={() => setRemindersPage(true)}>
            <span className="menu-title">{rem.menuRow}</span>
            <span className="menu-sub">{!reminders.possible ? rem.menuWeb : reminders.settings.on ? rem.menuOn : rem.menuOff}</span>
          </button>
        </li>
        <li>
          <button type="button" className="menu-item" onClick={() => setAbout(true)}>
            <span className="menu-title">{menu.about}</span>
          </button>
        </li>
      </ul>
    </Sheet>
  );
}
