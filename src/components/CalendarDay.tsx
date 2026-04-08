import { sameDay } from "@/lib/date";

type CalendarDayProps = {
  day: Date;
  today: Date;
  selectedDay: Date | null;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  inRange: boolean;
  hasNote: boolean;
  completionPercent: number;
  onClick: (day: Date) => void;
};

export function CalendarDay({
  day,
  today,
  selectedDay,
  rangeStart,
  rangeEnd,
  inRange,
  hasNote,
  completionPercent,
  onClick,
}: CalendarDayProps) {
  const isToday = sameDay(day, today);
  const isSelected = sameDay(day, selectedDay);
  const isStart = sameDay(day, rangeStart);
  const isEnd = sameDay(day, rangeEnd);
  const weekend = day.getDay() === 0 || day.getDay() === 6;
  const progressClass =
    completionPercent < 0
      ? ""
      : completionPercent <= 30
        ? "is-productivity-low"
        : completionPercent <= 70
          ? "is-productivity-medium"
          : "is-productivity-high";

  return (
    <button
      type="button"
      className={[
        "date-cell",
        progressClass,
        isToday ? "is-today" : "",
        isSelected || isStart || isEnd ? "is-edge" : "",
        inRange ? "is-range" : "",
        weekend ? "is-weekend" : "",
      ]
        .join(" ")
        .trim()}
      onClick={() => onClick(day)}
      aria-label={`Select ${day.toDateString()}`}
      title={completionPercent < 0 ? "No tasks for this day" : `Task completion: ${completionPercent}%`}
    >
      <span>{day.getDate()}</span>
      {hasNote ? <i aria-hidden="true" /> : null}
    </button>
  );
}
