const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value) {
  if (!ISO_DATE.test(String(value))) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return date.toISOString().slice(0, 10) === value;
}

export function compareDates(left, right) {
  return left.localeCompare(right);
}

export function isWithinWindow(date, start, end) {
  return compareDates(date, start) >= 0 && compareDates(date, end) <= 0;
}

export function dateRange(start, end) {
  if (!isIsoDate(start) || !isIsoDate(end) || compareDates(start, end) > 0) {
    return [];
  }

  const days = [];
  const cursor = new Date(`${start}T00:00:00.000Z`);
  const last = new Date(`${end}T00:00:00.000Z`);

  while (cursor <= last) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
}

export function rangesOverlap(firstStart, firstEnd, secondStart, secondEnd) {
  return compareDates(firstStart, secondEnd) <= 0 &&
    compareDates(secondStart, firstEnd) <= 0;
}
