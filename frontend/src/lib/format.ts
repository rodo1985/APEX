/**
 * Formats an ISO date or timestamp into a short month/day label.
 */
export function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(parseIsoLikeDate(value));
}

/**
 * Formats an ISO date or timestamp into a long human-readable label.
 */
export function formatLongDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(parseIsoLikeDate(value));
}

/**
 * Formats distance in meters into a kilometer string.
 */
export function formatDistanceKm(distanceMeters: number) {
  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

/**
 * Formats a duration in seconds into a compact label.
 */
export function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes} min`;
}

/**
 * Converts a date-like input into a `YYYY-MM-DD` string for date inputs.
 */
export function toDateInputValue(value: string | Date | null | undefined) {
  if (!value) {
    return "";
  }

  return toIsoDate(value);
}

/**
 * Converts a date-like input into a normalized `YYYY-MM-DD` string.
 */
export function toIsoDate(value: string | Date) {
  const date = value instanceof Date ? new Date(value) : parseIsoLikeDate(value);
  return [
    date.getFullYear(),
    `${date.getMonth() + 1}`.padStart(2, "0"),
    `${date.getDate()}`.padStart(2, "0"),
  ].join("-");
}

/**
 * Shifts an ISO date string by a whole number of days.
 */
export function shiftIsoDate(value: string, days: number) {
  const date = parseIsoLikeDate(value);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

/**
 * Creates a relative label like Today, Yesterday, or a short date.
 */
export function formatRelativeDayLabel(value: string) {
  const normalizedValue = toIsoDate(value);
  const today = toIsoDate(new Date());
  const yesterday = shiftIsoDate(today, -1);
  const tomorrow = shiftIsoDate(today, 1);

  if (normalizedValue === today) {
    return "Today";
  }

  if (normalizedValue === yesterday) {
    return "Yesterday";
  }

  if (normalizedValue === tomorrow) {
    return "Tomorrow";
  }

  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(parseIsoLikeDate(normalizedValue));
}

/**
 * Parses ISO dates in local time so date-only values do not drift by timezone.
 */
function parseIsoLikeDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  return new Date(value);
}
