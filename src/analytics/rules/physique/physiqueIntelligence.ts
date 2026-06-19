import {
  AnalyticsRule,
  AnalyticsInsight,
  WeeklySummary,
  MeasurementEntry,
  AutoPhysique,
  AutoMeasurements,
  MuscleStimulus
} from "../../insights/insightTypes";
import { getTrendSlope } from "../../utils/trendSlope";
import { stimulusLabel } from "../../utils/thresholdUtils";

export function detectBulkQuality(prev: MeasurementEntry | null, curr: MeasurementEntry | null): string | null {
  if (!prev || !curr) return null;

  const prevBw = prev.bodyweight || 0;
  const currBw = curr.bodyweight || 0;
  const prevChest = prev.chest || 0;
  const currChest = curr.chest || 0;
  const prevWaist = prev.waist || 0;
  const currWaist = curr.waist || 0;

  const bwUp = currBw > prevBw + 0.3;
  const bwFlat = Math.abs(currBw - prevBw) <= 0.3;
  const chestUp = currChest > prevChest + 0.2;
  const waistUp = currWaist > prevWaist + 0.5;
  const waistDown = currWaist < prevWaist - 0.3;
  const waistStable = Math.abs(currWaist - prevWaist) <= 0.3;

  if (bwUp && chestUp && waistStable) return "lean_gain";
  if (bwUp && waistUp && !chestUp) return "fat_gain";
  if (bwFlat && waistDown && chestUp) return "recomposition";
  if (bwUp && chestUp && waistUp) return "bulk";
  return "stable";
}

export function trapDevelopmentScore(summary: WeeklySummary): number {
  const carry = summary.carry_volume || 0;
  const traps = summary.trap_sets || 0;
  const back = summary.back_sets || 0;
  return Math.round((carry * 0.005 * 0.5) + (traps * 2 * 0.3) + (back * 1.5 * 0.2));
}

export function torsoDevelopmentScore(summary: WeeklySummary): number {
  const chest = summary.chest_sets || 0;
  const shoulder = summary.shoulder_sets || 0;
  const bw = summary.bodyweight || 80;
  return Math.round((chest * 1.5 * 0.5) + (shoulder * 1.5 * 0.3) + (bw * 0.05 * 0.2));
}

export function strongmanSilhouetteScore(summary: WeeklySummary): number {
  const bw = Math.min(summary.bodyweight || 80, 140);
  const torso = torsoDevelopmentScore(summary);
  const trap = trapDevelopmentScore(summary);
  const carry = Math.min(summary.carry_volume || 0, 15000);

  const score = (
    (bw / 140) * 25 +
    Math.min(torso / 30, 1) * 30 +
    Math.min(trap / 20, 1) * 25 +
    (carry / 15000) * 20
  );
  return Math.round(Math.min(score, 100));
}

export function physiqueMomentum(summaries: WeeklySummary[]): string {
  if (summaries.length < 2) return "Insufficient Data";
  const recent = summaries.slice(-3);
  const volumeSlope = getTrendSlope(recent, "total_volume");
  const bwSlope = getTrendSlope(recent, "bodyweight");

  if (volumeSlope > 500 && bwSlope >= 0) return "Accelerating";
  if (volumeSlope < -500 || bwSlope < -0.5) return "Declining";
  return "Stable";
}

export class PhysiqueIntelligenceRule implements AnalyticsRule {
  id = "physique-intelligence-rule";
  private measurements: MeasurementEntry[];
  public autoPhysique: AutoPhysique | null = null;
  public autoMeasurements: AutoMeasurements | null = null;

  constructor(measurements: MeasurementEntry[] = []) {
    // Sort chronologically by SK
    this.measurements = [...measurements].sort((a, b) => a.SK.localeCompare(b.SK));
  }

  evaluate(summary: WeeklySummary, history: WeeklySummary[]): AnalyticsInsight[] {
    const insights: AnalyticsInsight[] = [];

    // Calculate autoMeasurements
    if (this.measurements.length > 0) {
      const latest = this.measurements[this.measurements.length - 1];
      const previous = this.measurements.length > 1 ? this.measurements[this.measurements.length - 2] : null;

      const delta = (curr: MeasurementEntry, prev: MeasurementEntry | null, key: keyof MeasurementEntry) => {
        if (!prev || !curr[key] || !prev[key]) return null;
        return parseFloat(((curr[key] as number) - (prev[key] as number)).toFixed(1));
      };

      this.autoMeasurements = {
        latest,
        previous,
        deltas: {
          bodyweight: delta(latest, previous, "bodyweight"),
          chest: delta(latest, previous, "chest"),
          arms: delta(latest, previous, "arms"),
          waist: delta(latest, previous, "waist"),
          neck: delta(latest, previous, "neck"),
          thigh: delta(latest, previous, "thigh"),
          forearm: delta(latest, previous, "forearm")
        },
        bulkQuality: detectBulkQuality(previous, latest)
      };
    }

    // Calculate physique scores
    const silhouetteScore = strongmanSilhouetteScore(summary);
    const trapScore = trapDevelopmentScore(summary);
    const torsoScore = torsoDevelopmentScore(summary);
    const momentum = physiqueMomentum(history);

    const muscleStimulus: Record<string, MuscleStimulus> = {
      chest: { sets: summary.chest_sets || 0, status: stimulusLabel(summary.chest_sets || 0) },
      back: { sets: summary.back_sets || 0, status: stimulusLabel(summary.back_sets || 0) },
      traps: { sets: summary.trap_sets || 0, status: stimulusLabel(summary.trap_sets || 0) },
      shoulders: { sets: summary.shoulder_sets || 0, status: stimulusLabel(summary.shoulder_sets || 0) },
      legs: { sets: summary.leg_sets || 0, status: stimulusLabel(summary.leg_sets || 0) },
      arms: { sets: summary.arm_sets || 0, status: stimulusLabel(summary.arm_sets || 0) },
      core: { sets: summary.core_sets || 0, status: stimulusLabel(summary.core_sets || 0) }
    };

    this.autoPhysique = {
      momentum,
      silhouetteScore,
      trapScore,
      torsoScore,
      muscleStimulus,
      bulkQuality: this.autoMeasurements ? this.autoMeasurements.bulkQuality : null
    };

    return insights;
  }
}
