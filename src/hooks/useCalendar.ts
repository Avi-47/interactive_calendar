import { useEffect, useMemo, useState } from "react";
import { normalizeDate, sameDay } from "@/lib/date";

export type SelectionMode = "day" | "range";

export function useCalendar(initialDate = new Date(), selectionMode: SelectionMode = "day") {
  const today = useMemo(() => normalizeDate(initialDate), [initialDate]);
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [activeDate, setActiveDate] = useState<Date | null>(null);

  useEffect(() => {
    if (selectionMode === "day") {
      setRangeStart(null);
      setRangeEnd(null);
    }
  }, [selectionMode]);

  const days = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const firstWeekday = firstDayOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

    return Array.from({ length: totalCells }, (_, index) => {
      const dateNumber = index - firstWeekday + 1;
      if (dateNumber < 1 || dateNumber > daysInMonth) {
        return null;
      }
      return new Date(year, month, dateNumber);
    });
  }, [currentMonth]);

  function goToNextMonth() {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  function goToPreviousMonth() {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function onDayClick(day: Date) {
    const normalized = normalizeDate(day);
    setActiveDate(normalized);

    if (selectionMode === "day") {
      setRangeStart(null);
      setRangeEnd(null);
      return;
    }

    if (!rangeStart) {
      setRangeStart(normalized);
      setRangeEnd(null);
      return;
    }

    if (rangeStart && !rangeEnd) {
      if (sameDay(rangeStart, normalized)) {
        setRangeStart(normalized);
        setRangeEnd(normalized);
        return;
      }

      if (normalized.getTime() < rangeStart.getTime()) {
        setRangeEnd(rangeStart);
        setRangeStart(normalized);
        return;
      }

      setRangeEnd(normalized);
      return;
    }

    setRangeStart(normalized);
    setRangeEnd(null);
  }

  return {
    today,
    currentMonth,
    days,
    rangeStart,
    rangeEnd,
    activeDate,
    setActiveDate,
    goToNextMonth,
    goToPreviousMonth,
    onDayClick,
  };
}
