/**
 * Helper to compute ISO Week string (e.g. "2026-W22") from a date string.
 */
export function getISOWeek(dateString: string): string | null {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  week1.setDate(week1.getDate() + 3 - (week1.getDay() + 6) % 7);
  const weekNo = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  const weekPad = String(weekNo).padStart(2, "0");
  return `${d.getFullYear()}-W${weekPad}`;
}
