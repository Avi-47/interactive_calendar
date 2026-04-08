type NotesPanelProps = {
  monthNote: string;
  dayNote: string;
  rangeNote: string;
  dayLabel: string;
  rangeLabel: string;
  noteMode: "day" | "range";
  canEditDayNote: boolean;
  canEditRangeNote: boolean;
  canOpenTodo: boolean;
  onOpenTodo: () => void;
  onNoteModeChange: (value: "day" | "range") => void;
  onMonthNoteChange: (value: string) => void;
  onDayNoteChange: (value: string) => void;
  onRangeNoteChange: (value: string) => void;
};

export function NotesPanel({
  monthNote,
  dayNote,
  rangeNote,
  dayLabel,
  rangeLabel,
  noteMode,
  canEditDayNote,
  canEditRangeNote,
  canOpenTodo,
  onOpenTodo,
  onNoteModeChange,
  onMonthNoteChange,
  onDayNoteChange,
  onRangeNoteChange,
}: NotesPanelProps) {
  return (
    <aside className="notes-panel">
      <h3>Notes</h3>

      <label htmlFor="month-note">Month memo</label>
      <textarea
        id="month-note"
        value={monthNote}
        onChange={(event) => onMonthNoteChange(event.target.value)}
        placeholder="Capture priorities, deadlines, and reminders for this month."
      />

      <button
        type="button"
        className="todo-launch"
        onClick={onOpenTodo}
        disabled={!canOpenTodo}
        aria-label="Open day todo panel"
      >
        <span className="todo-launch__icon" aria-hidden="true">+</span>
        <span className="todo-launch__text">Add ToDo</span>
      </button>

      <label htmlFor="note-mode">Memo type</label>
      <select
        id="note-mode"
        value={noteMode}
        onChange={(event) => onNoteModeChange(event.target.value as "day" | "range")}
      >
        <option value="day">Selected day memo</option>
        <option value="range">Selected range memo</option>
      </select>

      {noteMode === "day" ? (
        <>
          <p className="range-title">{dayLabel}</p>
          <textarea
            id="day-note"
            value={dayNote}
            onChange={(event) => onDayNoteChange(event.target.value)}
            disabled={!canEditDayNote}
            placeholder="Attach a note to the selected day."
          />
        </>
      ) : (
        <>
          <p className="range-title">{rangeLabel}</p>
          <textarea
            id="range-note"
            value={rangeNote}
            onChange={(event) => onRangeNoteChange(event.target.value)}
            disabled={!canEditRangeNote}
            placeholder="Attach a note to the selected date range."
          />
        </>
      )}
    </aside>
  );
}
