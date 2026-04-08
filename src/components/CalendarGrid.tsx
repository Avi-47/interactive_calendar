import { CalendarDay } from "@/components/CalendarDay";
import { isBetweenExclusive } from "@/lib/date";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type CalendarGridProps = {
  monthLabel: string;
  days: Array<Date | null>;
  today: Date;
  selectedDay: Date | null;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onDayClick: (day: Date) => void;
  hasNoteForDay: (day: Date) => boolean;
  getDayCompletionPercent: (day: Date) => number;
};

export function CalendarGrid({
  monthLabel,
  days,
  today,
  selectedDay,
  rangeStart,
  rangeEnd,
  onPreviousMonth,
  onNextMonth,
  onDayClick,
  hasNoteForDay,
  getDayCompletionPercent,
}: CalendarGridProps) {
  return (
    <section className="calendar-panel">
      <header className="calendar-head">
        <button type="button" onClick={onPreviousMonth} aria-label="Previous month">
          Prev
        </button>
        <h2>{monthLabel}</h2>
        <button type="button" onClick={onNextMonth} aria-label="Next month">
          Next
        </button>
      </header>

      <div className="legend-row">
        <span>Start / End</span>
        <span>In Range</span>
        <span>Today</span>
      </div>

      <div className="weekday-row">
        {WEEKDAYS.map((weekday) => (
          <span key={weekday}>{weekday}</span>
        ))}
      </div>

      <div className="date-grid" role="grid" aria-label={`Calendar for ${monthLabel}`}>
        {days.map((day, index) => {
          if (!day) {
            return <span key={`empty-${index}`} className="date-empty" aria-hidden="true" />;
          }

          return (
            <CalendarDay
              key={day.toISOString()}
              day={day}
              today={today}
              selectedDay={selectedDay}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              inRange={isBetweenExclusive(day, rangeStart, rangeEnd)}
              hasNote={hasNoteForDay(day)}
              completionPercent={getDayCompletionPercent(day)}
              onClick={onDayClick}
            />
          );
        })}
      </div>
    </section>
  );
}
