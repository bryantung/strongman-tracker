import { WeeklySummary } from "../insights/insightTypes";

/**
 * Computes a simple linear slope (kg/week) for a given numeric key
 * across an array of weekly summaries (chronological order).
 * Returns 0 if fewer than 2 non-zero data points exist.
 */
export function getTrendSlope(history: WeeklySummary[], key: keyof WeeklySummary): number {
  const values = history
    .map(h => (h[key] as number) || 0)
    .filter(v => v > 0);

  if (values.length < 2) return 0;

  const first = values[0];
  const last = values[values.length - 1];
  return (last - first) / Math.max(1, values.length - 1);
}

/**
 * Count how many consecutive weeks a metric stayed within ±0.5 kg of the prior week.
 * Walks backwards from the latest summary.
 */
export function countStalledWeeks(summaries: WeeklySummary[], key: keyof WeeklySummary): number {
  if (summaries.length < 2) return 0;

  let stalled = 0;
  for (let i = summaries.length - 1; i >= 1; i--) {
    const curr = (summaries[i][key] as number) || 0;
    const prev = (summaries[i - 1][key] as number) || 0;
    if (prev > 0 && Math.abs(curr - prev) < 0.5) {
      stalled++;
    } else {
      break;
    }
  }
  return stalled;
}
