import { WeeklySummary } from "../insights/insightTypes";

/** Plateau severity based on consecutive stalled weeks. */
export function plateauSeverity(
  stalledWeeks: number
): "low" | "medium" | "high" | "critical" {
  if (stalledWeeks >= 12) return "critical";
  if (stalledWeeks >= 8) return "high";
  if (stalledWeeks >= 4) return "medium";
  return "low";
}

/**
 * Diagnose the root cause of a plateau.
 * Returns an array of human-readable bottleneck strings.
 */
export function diagnosePlateau(latestSummary: WeeklySummary): string[] {
  const reasons: string[] = [];
  const fatigue = latestSummary.fatigue_score || 0;
  const rpe = latestSummary.average_rpe || 0;
  const volume = latestSummary.compound_volume || 0;
  const recovery = latestSummary.recovery_score;

  if (fatigue > 75) {
    reasons.push("Recovery may be limiting progression — fatigue score is critically high.");
  }
  if (recovery !== undefined && recovery < 50) {
    reasons.push("Recovery score is low — prioritise sleep and reduce session stress.");
  }
  if (volume < 3000) {
    reasons.push("Training volume may be insufficient to drive adaptation.");
  }
  if (rpe > 0 && rpe < 7) {
    reasons.push("Training intensity may be too low — push harder on working sets.");
  }
  if (reasons.length === 0) {
    reasons.push(
      "Review exercise selection and consider a deload before resuming progressive overload."
    );
  }
  return reasons;
}

/**
 * Stimulus label for a given weekly set count relative to hypertrophy targets.
 */
export function stimulusLabel(sets: number): "under" | "maintenance" | "growth" {
  if (sets >= 10) return "growth";
  if (sets >= 4) return "maintenance";
  return "under";
}
