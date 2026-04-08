"use client";

import { useMemo, useState, useEffect } from "react";
import { CalendarGrid } from "@/components/CalendarGrid";
import { HeroImage } from "@/components/HeroImage";
import { NotesPanel } from "@/components/NotesPanel";
import { TodoDrawer, type TodoTask } from "@/components/TodoDrawer";
import { useCalendar, type SelectionMode } from "@/hooks/useCalendar";
import { useWeather } from "@/hooks/useWeather";
import {
  dateToKey,
  getMonthKey,
  getRangeKey,
  normalizeDate,
  parseDateKey,
} from "@/lib/date";

type NoteRecord = Record<string, string>;
type TodoRecord = Record<string, TodoTask[]>;

function readLocalRecord(key: string): NoteRecord {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    return parsed as NoteRecord;
  } catch {
    return {};
  }
}

function readLocalTodoRecord(key: string): TodoRecord {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).map(([dateKey, value]) => {
        if (Array.isArray(value)) {
          const tasks = value
            .filter((item) => item && typeof item === "object")
            .map((item, index) => {
              const record = item as Partial<TodoTask>;
              return {
                id:
                  typeof record.id === "string" && record.id.trim()
                    ? record.id
                    : `${dateKey}-${index}`,
                text:
                  typeof record.text === "string"
                    ? record.text
                    : "",
                completed: Boolean(record.completed),
              };
            });

          return [dateKey, tasks];
        }

        // Migrate legacy single-text todo into a one-item task list.
        if (typeof value === "string" && value.trim()) {
          return [
            dateKey,
            [{ id: `${dateKey}-legacy`, text: value.trim(), completed: false }],
          ];
        }

        return [dateKey, []];
      }),
    );
  } catch {
    return {};
  }
}

function completionPercent(tasks: TodoTask[]): number {
  if (tasks.length === 0) {
    return 0;
  }

  const completed = tasks.filter((task) => task.completed).length;
  return Math.round((completed / tasks.length) * 100);
}

function formatDateLabel(day: Date | null): string {
  if (!day) {
    return "Pick a date.";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(day);
}

export default function Home() {
  const [now, setNow] = useState(() => new Date());
  const currentHour = now.getHours();
  const currentHourValue = now.getHours() + now.getMinutes() / 60;
  const [lightOn, setLightOn] = useState(true);
  const [noteMode, setNoteMode] = useState<SelectionMode>("day");
  const [todoOpen, setTodoOpen] = useState(false);
  const [selectedTodoDate, setSelectedTodoDate] = useState<Date | null>(null);
  const {
    today,
    currentMonth,
    days,
    rangeStart,
    rangeEnd,
    activeDate,
    goToNextMonth,
    goToPreviousMonth,
    onDayClick,
  } = useCalendar(new Date(), noteMode);
  const [monthNotes, setMonthNotes] = useState<NoteRecord>({});
  const [dayNotes, setDayNotes] = useState<NoteRecord>({});
  const [rangeNotes, setRangeNotes] = useState<NoteRecord>({});
  const [todoNotes, setTodoNotes] = useState<TodoRecord>({});
  const [hasHydratedStorage, setHasHydratedStorage] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setMonthNotes(readLocalRecord("wallCalendarMonthNotes"));
    setDayNotes(readLocalRecord("wallCalendarDayNotes"));
    setRangeNotes(readLocalRecord("wallCalendarRangeNotes"));
    setTodoNotes(readLocalTodoRecord("wallCalendarTodoNotes"));
    setHasHydratedStorage(true);
  }, []);

  useEffect(() => {
    if (!hasHydratedStorage) {
      return;
    }
    localStorage.setItem("wallCalendarMonthNotes", JSON.stringify(monthNotes));
  }, [hasHydratedStorage, monthNotes]);

  useEffect(() => {
    if (!hasHydratedStorage) {
      return;
    }
    localStorage.setItem("wallCalendarDayNotes", JSON.stringify(dayNotes));
  }, [hasHydratedStorage, dayNotes]);

  useEffect(() => {
    if (!hasHydratedStorage) {
      return;
    }
    localStorage.setItem("wallCalendarRangeNotes", JSON.stringify(rangeNotes));
  }, [hasHydratedStorage, rangeNotes]);

  useEffect(() => {
    if (!hasHydratedStorage) {
      return;
    }
    localStorage.setItem("wallCalendarTodoNotes", JSON.stringify(todoNotes));
  }, [hasHydratedStorage, todoNotes]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  const weather = useWeather(activeDate ?? today);

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
      }).format(currentMonth),
    [currentMonth],
  );

  const monthKey = getMonthKey(currentMonth);
  const selectedDayKey = activeDate ? dateToKey(activeDate) : "";
  const selectedRangeKey = getRangeKey(rangeStart, rangeEnd);
  const monthNoteValue = monthNotes[monthKey] ?? "";
  const dayNoteValue = selectedDayKey ? dayNotes[selectedDayKey] ?? "" : "";
  const rangeNoteValue = selectedRangeKey ? rangeNotes[selectedRangeKey] ?? "" : "";
  const verticalDates = useMemo(
    () => days.filter((day): day is Date => Boolean(day)),
    [days],
  );
  const visibleTodoDate = useMemo(() => {
    if (!selectedTodoDate) {
      return verticalDates[0] ?? null;
    }

    const isVisible = verticalDates.some(
      (day) => dateToKey(day) === dateToKey(selectedTodoDate),
    );

    return isVisible ? selectedTodoDate : verticalDates[0] ?? null;
  }, [selectedTodoDate, verticalDates]);
  const visibleTodoDateKey = visibleTodoDate ? dateToKey(visibleTodoDate) : "";
  const visibleTodoTasks = visibleTodoDateKey ? todoNotes[visibleTodoDateKey] ?? [] : [];
  const visibleTodoCompletion = completionPercent(visibleTodoTasks);

  function updateMonthNote(value: string) {
    setMonthNotes((prev) => ({ ...prev, [monthKey]: value }));
  }

  function updateDayNote(value: string) {
    if (!selectedDayKey || noteMode !== "day") {
      return;
    }
    setDayNotes((prev) => ({ ...prev, [selectedDayKey]: value }));
  }

  function updateRangeNote(value: string) {
    if (!selectedRangeKey || noteMode !== "range") {
      return;
    }

    setRangeNotes((prev) => ({ ...prev, [selectedRangeKey]: value }));
  }

  function updateTodoText(taskId: string, value: string) {
    if (!visibleTodoDateKey || noteMode !== "day") {
      return;
    }

    setTodoNotes((prev) => {
      const dayTasks = prev[visibleTodoDateKey] ?? [];
      return {
        ...prev,
        [visibleTodoDateKey]: dayTasks.map((task) =>
          task.id === taskId ? { ...task, text: value } : task,
        ),
      };
    });
  }

  function createTodoTask() {
    if (!visibleTodoDateKey || noteMode !== "day") {
      return;
    }

    const taskId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${visibleTodoDateKey}-${Date.now()}`;

    setTodoNotes((prev) => {
      const dayTasks = prev[visibleTodoDateKey] ?? [];
      return {
        ...prev,
        [visibleTodoDateKey]: [
          ...dayTasks,
          { id: taskId, text: "", completed: false },
        ],
      };
    });
  }

  function toggleTodoTask(taskId: string) {
    if (!visibleTodoDateKey || noteMode !== "day") {
      return;
    }

    setTodoNotes((prev) => {
      const dayTasks = prev[visibleTodoDateKey] ?? [];
      return {
        ...prev,
        [visibleTodoDateKey]: dayTasks.map((task) =>
          task.id === taskId ? { ...task, completed: !task.completed } : task,
        ),
      };
    });
  }

  function deleteTodoTask(taskId: string) {
    if (!visibleTodoDateKey || noteMode !== "day") {
      return;
    }

    setTodoNotes((prev) => {
      const dayTasks = prev[visibleTodoDateKey] ?? [];
      return {
        ...prev,
        [visibleTodoDateKey]: dayTasks.filter((task) => task.id !== taskId),
      };
    });
  }

  function handleOpenTodo() {
    if (noteMode !== "day") {
      return;
    }

    setTodoOpen((prev) => !prev);
    if (!selectedTodoDate && verticalDates.length > 0) {
      setSelectedTodoDate(verticalDates[0]);
    }
  }

  function handleSelectTodoDate(date: Date) {
    if (noteMode !== "day") {
      return;
    }

    setSelectedTodoDate(date);
  }

  function handleCalendarDayClick(date: Date) {
    onDayClick(date);
    if (noteMode === "day") {
      setSelectedTodoDate(date);
    }
  }

  function handleNoteModeChange(value: SelectionMode) {
    setNoteMode(value);
    if (value !== "day") {
      setTodoOpen(false);
    }
  }

  function hasNoteForDay(day: Date): boolean {
    const dayKey = dateToKey(day);
    const hasDayNote = Boolean(dayNotes[dayKey]?.trim());
    const hasTodo = (todoNotes[dayKey] ?? []).some((task) => task.text.trim());

    if (hasDayNote || hasTodo) {
      return true;
    }

    return Object.entries(rangeNotes).some(([key, value]) => {
      if (!value.trim()) {
        return false;
      }

      const [startKey, endKey] = key.split("_");
      if (!startKey || !endKey) {
        return false;
      }

      const start = normalizeDate(parseDateKey(startKey));
      const end = normalizeDate(parseDateKey(endKey));
      const target = normalizeDate(day);

      return (
        target.getTime() >= start.getTime() && target.getTime() <= end.getTime()
      );
    });
  }

  function getDayCompletionPercent(day: Date): number {
    const dayKey = dateToKey(day);
    const tasks = todoNotes[dayKey] ?? [];
    return tasks.length === 0 ? -1 : completionPercent(tasks);
  }

  const rangeLabel =
    rangeStart && rangeEnd
      ? `${formatDateLabel(rangeStart)} - ${formatDateLabel(rangeEnd)}`
      : "Pick start and end date for a range note.";

  const naturalShadowX = currentHourValue === 12 ? 0 : currentHourValue < 12 ? -24 : 24;
  const lightBiasX = lightOn && currentHourValue !== 12 ? -6 : 0;
  const naturalShadowY = currentHourValue === 12 ? 8 : lightOn ? 14 : 18;
  const naturalShadowBlur = currentHourValue === 12 ? 10 : lightOn ? 20 : 28;
  const naturalShadowOpacity = currentHourValue === 12 ? (lightOn ? 0.08 : 0.06) : lightOn ? 0.34 : 0.26;

  const wallStyle = {
    "--wall-dynamic": weather.theme.wallColor,
    "--panel-dynamic": weather.theme.panelColor,
    "--ink-dynamic": weather.theme.textColor,
    "--accent-dynamic": weather.theme.accentColor,
    "--wall-brightness": lightOn ? "1.04" : "0.98",
    "--wall-warmth": weather.timeOfDay === "morning" ? "1.05" : weather.timeOfDay === "evening" ? "1.12" : "1",
    "--board-shadow-x": `${naturalShadowX + lightBiasX}px`,
    "--board-shadow-y": `${naturalShadowY}px`,
    "--board-shadow-blur": String(naturalShadowBlur),
    "--board-shadow-opacity": String(naturalShadowOpacity),
    "--board-shadow-scale": currentHourValue === 12 ? "0.98" : "1",
    "--wall-glow-opacity": lightOn ? (weather.timeOfDay === "night" ? "0.24" : "0.5") : weather.timeOfDay === "night" ? "0.16" : "0.22",
  } as React.CSSProperties;

  return (
    <main className="wall-shell" style={wallStyle} data-hour={currentHour} data-light={lightOn ? "on" : "off"} data-time={weather.timeOfDay} data-weather={weather.condition.toLowerCase()}>
      <button
        type="button"
        className={lightOn ? "wall-switch is-on" : "wall-switch is-off"}
        onClick={() => setLightOn((prev) => !prev)}
        aria-pressed={lightOn}
        aria-label="Toggle wall light"
      >
        <span className="wall-switch__label">Light</span>
        <span className="wall-switch__track" aria-hidden="true">
          <span className="wall-switch__thumb" />
        </span>
      </button>

      <section className="wall-calendar">
        <div className="calendar-ring" aria-hidden="true" />
        <div className="calendar-ring" aria-hidden="true" />

        <HeroImage
          monthLabel={monthLabel}
          mood={weather.mood}
          condition={weather.condition}
          temperatureC={weather.temperatureC}
          timeOfDay={weather.timeOfDay}
          image={weather.theme.image}
          error={weather.error}
          source={weather.source}
          animation={weather.theme.animation}
        />

        <CalendarGrid
          monthLabel={monthLabel}
          days={days}
          today={today}
          selectedDay={activeDate}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          onPreviousMonth={goToPreviousMonth}
          onNextMonth={goToNextMonth}
          onDayClick={handleCalendarDayClick}
          hasNoteForDay={hasNoteForDay}
          getDayCompletionPercent={getDayCompletionPercent}
        />

        <NotesPanel
          monthNote={monthNoteValue}
          dayNote={dayNoteValue}
          rangeNote={rangeNoteValue}
          dayLabel={formatDateLabel(activeDate)}
          rangeLabel={rangeLabel}
          noteMode={noteMode}
          canEditDayNote={Boolean(selectedDayKey) && noteMode === "day"}
          canEditRangeNote={Boolean(selectedRangeKey) && noteMode === "range"}
          canOpenTodo={noteMode === "day"}
          onOpenTodo={handleOpenTodo}
          onNoteModeChange={handleNoteModeChange}
          onMonthNoteChange={updateMonthNote}
          onDayNoteChange={updateDayNote}
          onRangeNoteChange={updateRangeNote}
        />

        <TodoDrawer
          open={todoOpen && noteMode === "day"}
          currentMonthLabel={monthLabel}
          dates={verticalDates}
          selectedDate={visibleTodoDate}
          tasks={visibleTodoTasks}
          completionPercent={visibleTodoCompletion}
          canEdit={noteMode === "day" && Boolean(visibleTodoDateKey)}
          onClose={() => setTodoOpen(false)}
          onSelectDate={handleSelectTodoDate}
          onCreateTask={createTodoTask}
          onTaskTextChange={updateTodoText}
          onToggleTask={toggleTodoTask}
          onDeleteTask={deleteTodoTask}
        />
      </section>
    </main>
  );
}
