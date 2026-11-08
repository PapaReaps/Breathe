import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { words } from "../content/words";
import { idsByDate } from "../logic/rows";
import type { RowSummary } from "../logic/rows";

interface RowListProps<T extends { id: string }> {
  rows: T[];
  /** What one row is called, for people using a screen reader: "bill", "item". */
  itemName: string;
  summarise: (row: T) => RowSummary;
  dateOf: (row: T) => string;
  /** True for a row with nothing in it. Such a row is dropped when it is closed. */
  isBlank: (row: T) => boolean;
  /** The boxes shown while one row is open for changing. */
  renderFields: (row: T) => ReactNode;
  /** Adds an empty row and returns its id, so it can be opened straight away. */
  onAdd: () => string;
  onRemove: (id: string) => void;
  addLabel: string;
  emptyLine: string;
  totalLine: string | null;
}

/**
 * A tidy list: each row is one line, and only one row is open for changing at a time.
 * Rows stay in date order. The order is worked out when a row is opened or closed,
 * so a row never jumps away while you are typing in it.
 */
export function RowList<T extends { id: string }>({
  rows,
  itemName,
  summarise,
  dateOf,
  isBlank,
  renderFields,
  onAdd,
  onRemove,
  addLabel,
  emptyLine,
  totalLine,
}: RowListProps<T>) {
  const [openId, setOpenId] = useState<string | null>(null);
  const editorRef = useRef<HTMLLIElement>(null);
  const latest = useRef({ rows, dateOf });
  latest.current = { rows, dateOf };
  const opened = useRef(false);

  // Re-sorted only when a row is opened or closed, or one is added or removed (not while typing).
  const order = useMemo(
    () => idsByDate(latest.current.rows.map((row) => ({ id: row.id, date: latest.current.dateOf(row) }))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openId, rows.length],
  );

  // When a row opens, put the cursor in its first box.
  useEffect(() => {
    if (openId === null) return;
    if (!opened.current) {
      opened.current = true;
    }
    editorRef.current?.querySelector("input")?.focus();
  }, [openId]);

  /** Closes the open row. If nothing was typed in it, it is removed rather than left as an empty line. */
  function closeOpenRow(): void {
    const current = rows.find((row) => row.id === openId);
    if (current !== undefined && isBlank(current)) onRemove(current.id);
    setOpenId(null);
  }

  function openRow(id: string): void {
    const current = rows.find((row) => row.id === openId);
    if (current !== undefined && current.id !== id && isBlank(current)) onRemove(current.id);
    setOpenId(id);
  }

  function addRow(): void {
    const current = rows.find((row) => row.id === openId);
    // An empty row is already waiting: carry on in that one rather than adding another.
    if (current !== undefined && isBlank(current)) {
      editorRef.current?.querySelector("input")?.focus();
      return;
    }
    setOpenId(onAdd());
  }

  const byId = new Map(rows.map((row) => [row.id, row]));
  const ordered = order.map((id) => byId.get(id)).filter((row): row is T => row !== undefined);
  // A row added a moment ago may not be in `order` until the next render: show it anyway.
  for (const row of rows) if (!ordered.includes(row)) ordered.push(row);

  return (
    <>
      {totalLine !== null ? (
        <p className="list-total" aria-live="polite">
          {totalLine}
        </p>
      ) : (
        <p className="hint">{emptyLine}</p>
      )}

      {ordered.length > 0 ? (
        <ul className="menu-list">
          {ordered.map((row, index) => {
            const summary = summarise(row);
            const open = row.id === openId;
            if (!open) {
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    className="menu-item"
                    aria-expanded={false}
                    onClick={() => openRow(row.id)}
                  >
                    <span className="menu-title">{summary.title}</span>
                    <span className={summary.unfinished ? "menu-sub needs-a-look" : "menu-sub row-amount"}>
                      {summary.short ?? summary.detail}
                      {summary.way !== undefined ? (
                        <span className={summary.way === "in" ? "row-way coming-in" : "row-way coming-out"}>
                          {" "}
                          {summary.way === "in" ? words.comingUp.inWord : words.comingUp.outWord}
                        </span>
                      ) : null}
                    </span>
                    <span className="visually-hidden">{`, change ${itemName} ${index + 1}`}</span>
                  </button>
                </li>
              );
            }
            return (
              <li key={row.id} className="row-editor" ref={editorRef} role="group" aria-label={`${summary.title}`}>
                {renderFields(row)}
                <div className="buttons">
                  <button type="button" onClick={closeOpenRow}>
                    {words.rows.done}
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      onRemove(row.id);
                      setOpenId(null);
                    }}
                  >
                    {words.rows.remove}
                    <span className="visually-hidden">{` ${itemName}`}</span>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      <div className="list-add">
        <button
          type="button"
          className={rows.length === 0 ? undefined : "secondary"}
          onClick={addRow}
        >
          {addLabel}
        </button>
      </div>
    </>
  );
}
