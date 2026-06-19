import { WeeklySummary } from "../insights/insightTypes";

/**
 * Calculates fatigue score.
 * Under modular design, this calculates a normalized score (0-100)
 * from the weekly summary's cumulative fatigue score.
 */
export function calculateFatigueScore(summary: WeeklySummary): number {
  if (!summary.fatigue_score) return 0;
  // Cumulative fatigue score is sum(sets * fatigue_score_of_exercise)
  // We normalize this, capping it at 100 for display and rule checking.
  return Math.min(Math.round(summary.fatigue_score), 100);
}
