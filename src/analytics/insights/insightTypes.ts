// ─── Core shared types for the Strongman Tracker Analytics Engine ───────────

export interface WeeklySummary {
  PK: string;
  SK: string;
  week: string;

  bodyweight: number;
  fatigue_score: number;
  compound_volume: number;
  carry_volume: number;
  total_volume: number;
  average_rpe: number | null;
  strongman_score: number;

  bench_avg: number;
  bench_max: number;
  deadlift_avg: number;
  deadlift_max: number;
  push_press_avg: number;
  push_press_max: number;

  chest_sets: number;
  back_sets: number;
  trap_sets: number;
  shoulder_sets: number;
  leg_sets: number;
  arm_sets: number;
  core_sets: number;

  recovery_score?: number;
}

export interface AnalyticsInsight {
  category:
    | "progression"
    | "recovery"
    | "plateau"
    | "physique"
    | "fatigue"
    | "strongman";

  severity: "low" | "medium" | "high";

  confidence: number;

  title: string;

  description: string;

  recommendations?: string[];
}

export interface AnalyticsRule {
  id: string;
  evaluate(summary: WeeklySummary, history: WeeklySummary[]): AnalyticsInsight[];
}

export interface PlateauResult {
  lift: string;
  slope: number;
  stalledWeeks: number;
  isPlateaued: boolean;
  trend: "progressing" | "stalled" | "declining";
  severity: "low" | "medium" | "high" | "critical" | null;
  bottlenecks: string[];
}

export interface MeasurementEntry {
  PK: string;
  SK: string;
  bodyweight?: number;
  chest?: number;
  arms?: number;
  waist?: number;
  neck?: number;
  thigh?: number;
  forearm?: number;
}

export interface AnalyticsResult {
  latestSummary: WeeklySummary | null;
  insights: AnalyticsInsight[];
  history: WeeklySummary[];
  autoPlateaus: PlateauResult[];
  autoPhysique: AutoPhysique | null;
  autoMeasurements: AutoMeasurements | null;
}

export interface MuscleStimulus {
  sets: number;
  status: "under" | "maintenance" | "growth";
}

export interface AutoPhysique {
  momentum: string;
  silhouetteScore: number;
  trapScore: number;
  torsoScore: number;
  muscleStimulus: Record<string, MuscleStimulus>;
  bulkQuality: string | null;
}

export interface AutoMeasurements {
  latest: MeasurementEntry;
  previous: MeasurementEntry | null;
  deltas: Record<string, number | null>;
  bulkQuality: string | null;
}
