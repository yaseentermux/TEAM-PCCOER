/**
 * Centralized date formatting utility.
 * Safely handles null, undefined, and invalid date values.
 */
export function formatDate(
  dateInput: string | number | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!dateInput) return "—";
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      ...options,
    }).format(date);
  } catch {
    return "—";
  }
}

export function formatDateTime(
  dateInput: string | number | Date | null | undefined,
): string {
  return formatDate(dateInput, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
