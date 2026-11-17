import { useState } from "react";
import { words } from "../content/words";
import { daysLeft, timeLabel, type MedicationData, type Medicine } from "../logic/medicines";
import HistoryView from "./HistoryView";
import Sheet from "./Sheet";
import { ReminderSettings } from "./ReminderNotes";
import type { Reminders } from "../storage/useReminders";

const menu = words.menu;

interface Props {
  medicines: Medicine[];
  data: MedicationData;
  reminders: Reminders;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onSettings: () => void;
  onData: () => void;
  onClose: () => void;
}

/** The menu: your medicines (tap one to change it), add another, and about. */
export default function MenuSheet({ medicines, data, reminders, onAdd, onEdit, onSettings, onData, onClose }: Props) {
  const [about, setAbout] = useState(false);
  const [remindersPage, setRemindersPage] = useState(false);
  const [historyPage, setHistoryPage] = useState(false);
  const rem = words.reminders;

  if (historyPage) {
    return (
      <Sheet title={words.history.title} onClose={onClose} onBack={() => setHistoryPage(false)} key="history">
        <HistoryView data={data} today={new Date()} />
      </Sheet>
    );
  }

  if (remindersPage) {
    return (
      <Sheet title={rem.panelTitle} onClose={onClose} onBack={() => setRemindersPage(false)} key="reminders">
        <ReminderSettings reminders={reminders} />
      </Sheet>
    );
  }

  if (about) {
    return (
      <Sheet title={menu.about} onClose={onClose} onBack={() => setAbout(false)} key="about">
        {menu.aboutText.map((line) => (
          <p key={line}>{line}</p>
        ))}
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
              <span className="menu-sub">
                {menu.timesSummary(m.times.map(timeLabel))}
                {m.stock ? <span className="menu-sub-line">{words.leftSummary(m.stock.left, daysLeft(m))}</span> : null}
              </span>
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
          <button type="button" className="menu-item" onClick={() => setHistoryPage(true)}>
            <span className="menu-title">{words.history.menuRow}</span>
            <span className="menu-sub">{words.history.menuSub}</span>
          </button>
        </li>
        <li>
          <button type="button" className="menu-item" onClick={() => setRemindersPage(true)}>
            <span className="menu-title">{rem.menuRow}</span>
            <span className="menu-sub">{!reminders.possible ? rem.menuWeb : reminders.settings.on ? rem.menuOn : rem.menuOff}</span>
          </button>
        </li>
        <li>
          <button type="button" className="menu-item" onClick={onSettings}>
            <span className="menu-title">{menu.settings}</span>
            <span className="menu-sub">{menu.settingsSub}</span>
          </button>
        </li>
        <li>
          <button type="button" className="menu-item" onClick={onData}>
            <span className="menu-title">{menu.data}</span>
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
