import { dateToKey, sameDay } from "@/lib/date";

export type TodoTask = {
  id: string;
  text: string;
  completed: boolean;
};

type TodoDrawerProps = {
  open: boolean;
  currentMonthLabel: string;
  dates: Date[];
  selectedDate: Date | null;
  tasks: TodoTask[];
  completionPercent: number;
  canEdit: boolean;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
  onCreateTask: () => void;
  onTaskTextChange: (taskId: string, value: string) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
};

export function TodoDrawer({
  open,
  currentMonthLabel,
  dates,
  selectedDate,
  tasks,
  completionPercent,
  canEdit,
  onClose,
  onSelectDate,
  onCreateTask,
  onTaskTextChange,
  onToggleTask,
  onDeleteTask,
}: TodoDrawerProps) {
  return (
    <aside className={open ? "todo-drawer is-open" : "todo-drawer"} aria-hidden={!open}>
      <div className="todo-drawer__header">
        <div>
          <p className="todo-drawer__eyebrow">ToDo board</p>
          <h3>{currentMonthLabel}</h3>
          <div className="todo-progress" role="progressbar" aria-valuenow={completionPercent} aria-valuemin={0} aria-valuemax={100}>
            <div className="todo-progress__track" aria-hidden="true">
              <div className="todo-progress__fill" style={{ width: `${completionPercent}%` }} />
            </div>
            <p className="todo-progress__label">{completionPercent}% complete</p>
          </div>
        </div>
        <button type="button" className="todo-drawer__close" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="todo-drawer__body">
        <div className="todo-drawer__dates" aria-label="Select a date for todos">
          {dates.map((date) => {
            const isSelected = sameDay(date, selectedDate);
            return (
              <button
                key={dateToKey(date)}
                type="button"
                className={isSelected ? "todo-date is-selected" : "todo-date"}
                onClick={() => onSelectDate(date)}
              >
                <span>{date.getDate()}</span>
                <small>{date.toLocaleDateString("en-US", { weekday: "short" })}</small>
              </button>
            );
          })}
        </div>

        <div className="todo-drawer__editor">
          <div className="todo-drawer__actions">
            <label>Tasks for selected day</label>
            <button type="button" onClick={onCreateTask} disabled={!canEdit}>
              + New task
            </button>
          </div>

          <ul className="todo-list" aria-label="Tasks for selected day">
            {tasks.length === 0 ? (
              <li className="todo-list__empty">No tasks yet. Add one to start tracking progress.</li>
            ) : (
              tasks.map((task) => (
                <li
                  key={task.id}
                  className={task.completed ? "todo-item is-complete" : "todo-item"}
                >
                  <button
                    type="button"
                    className={task.completed ? "todo-item__toggle is-on" : "todo-item__toggle"}
                    onClick={() => onToggleTask(task.id)}
                    aria-label={task.completed ? "Mark task incomplete" : "Mark task complete"}
                  >
                    {task.completed ? "✓" : ""}
                  </button>

                  <input
                    type="text"
                    value={task.text}
                    disabled={!canEdit}
                    onChange={(event) => onTaskTextChange(task.id, event.target.value)}
                    placeholder="Write a task"
                  />

                  <button
                    type="button"
                    className="todo-item__delete"
                    onClick={() => onDeleteTask(task.id)}
                    aria-label="Delete task"
                  >
                    Delete
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </aside>
  );
}
