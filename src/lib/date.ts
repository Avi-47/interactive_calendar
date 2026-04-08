export function normalizeDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function dateToKey(date: Date): string {
  const normalized = normalizeDate(date);
  const year = normalized.getFullYear();
  const month = String(normalized.getMonth() + 1).padStart(2, "0");
  const day = String(normalized.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function sameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) {
    return false;
  }

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isBetweenInclusive(day: Date, start: Date | null, end: Date | null): boolean {
  if (!start || !end) {
    return false;
  }

  const value = normalizeDate(day).getTime();
  const startValue = normalizeDate(start).getTime();
  const endValue = normalizeDate(end).getTime();

  return value >= startValue && value <= endValue;
}

export function isBetweenExclusive(day: Date, start: Date | null, end: Date | null): boolean {
  if (!start || !end) {
    return false;
  }

  const value = normalizeDate(day).getTime();
  const startValue = normalizeDate(start).getTime();
  const endValue = normalizeDate(end).getTime();

  return value > startValue && value < endValue;
}

export function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getRangeKey(start: Date | null, end: Date | null): string {
  if (!start || !end) {
    return "";
  }

  const startDate = normalizeDate(start);
  const endDate = normalizeDate(end);

  const ordered = startDate.getTime() <= endDate.getTime()
    ? [startDate, endDate]
    : [endDate, startDate];

  return `${dateToKey(ordered[0])}_${dateToKey(ordered[1])}`;
}

export function getTimeOfDay(date: Date): "morning" | "afternoon" | "evening" | "night" {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) {
    return "morning";
  }

  if (hour >= 12 && hour < 17) {
    return "afternoon";
  }

  if (hour >= 17 && hour < 21) {
    return "evening";
  }

  return "night";
}
