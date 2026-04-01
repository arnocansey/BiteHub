export const adminDateRangeOptions = [
  { value: "today", label: "Today", days: 1 },
  { value: "7d", label: "Last 7 days", days: 7 },
  { value: "30d", label: "Last 30 days", days: 30 },
  { value: "all", label: "All time", days: null }
] as const;

export type AdminDateRange = (typeof adminDateRangeOptions)[number]["value"];

export function parseAdminDateRange(value: string | null | undefined): AdminDateRange {
  if (value === "today" || value === "7d" || value === "30d" || value === "all") {
    return value;
  }

  return "today";
}

export function getAdminDateRangeLabel(value: AdminDateRange) {
  return adminDateRangeOptions.find((option) => option.value === value)?.label ?? "Today";
}

export function isWithinAdminDateRange(
  dateValue: string | number | Date | null | undefined,
  range: AdminDateRange
) {
  if (range === "all") {
    return true;
  }

  if (!dateValue) {
    return false;
  }

  const target = new Date(dateValue);
  if (Number.isNaN(target.getTime())) {
    return false;
  }

  const now = new Date();
  const threshold = new Date(now);
  const days = range === "today" ? 1 : range === "7d" ? 7 : 30;
  threshold.setDate(now.getDate() - days);

  return target >= threshold && target <= now;
}
