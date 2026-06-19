import { AnalyticsRule, AnalyticsInsight, WeeklySummary, PlateauResult } from "../../insights/insightTypes";
import { getTrendSlope, countStalledWeeks } from "../../utils/trendSlope";
import { plateauSeverity, diagnosePlateau } from "../../utils/thresholdUtils";

export class LiftPlateauRule implements AnalyticsRule {
  id = "lift-plateau-rule";
  public autoPlateaus: PlateauResult[] = [];

  evaluate(summary: WeeklySummary, history: WeeklySummary[]): AnalyticsInsight[] {
    const insights: AnalyticsInsight[] = [];
    this.autoPlateaus = [];

    if (history.length < 2) {
      return insights;
    }

    const recentWindow = history.slice(-4);
    const historyWindow = history.slice(-8);

    const benchSlope = getTrendSlope(recentWindow, "bench_avg");
    const deadliftSlope = getTrendSlope(recentWindow, "deadlift_avg");
    const pushPressSlope = getTrendSlope(recentWindow, "push_press_avg");

    const liftChecks = [
      {
        name: "Bench Press",
        key: "bench_avg" as keyof WeeklySummary,
        slope: benchSlope,
        stalledWeeks: countStalledWeeks(historyWindow, "bench_avg"),
        hasData: summary.bench_avg > 0
      },
      {
        name: "Deadlift",
        key: "deadlift_avg" as keyof WeeklySummary,
        slope: deadliftSlope,
        stalledWeeks: countStalledWeeks(historyWindow, "deadlift_avg"),
        hasData: summary.deadlift_avg > 0
      },
      {
        name: "Push Press",
        key: "push_press_avg" as keyof WeeklySummary,
        slope: pushPressSlope,
        stalledWeeks: countStalledWeeks(historyWindow, "push_press_avg"),
        hasData: summary.push_press_avg > 0
      }
    ];

    liftChecks.forEach(lift => {
      if (!lift.hasData) return;

      const isPlateaued = Math.abs(lift.slope) < 0.5;
      const isDecline = lift.slope < -0.5;
      const severity = plateauSeverity(lift.stalledWeeks);
      const bottlenecks = (isPlateaued || isDecline) ? diagnosePlateau(summary) : [];

      this.autoPlateaus.push({
        lift: lift.name,
        slope: parseFloat(lift.slope.toFixed(2)),
        stalledWeeks: lift.stalledWeeks,
        isPlateaued: isPlateaued || isDecline,
        trend: isDecline ? "declining" : isPlateaued ? "stalled" : "progressing",
        severity: (isPlateaued || isDecline) ? severity : null,
        bottlenecks
      });

      if (isPlateaued && lift.stalledWeeks >= 2) {
        insights.push({
          category: "plateau",
          severity: severity === "critical" || severity === "high" ? "high" : "medium",
          confidence: 0.88,
          title: `${lift.name} Plateau — ${severity.charAt(0).toUpperCase() + severity.slice(1)} Severity`,
          description: `${lift.name} slope: ${lift.slope.toFixed(2)} kg/wk over ${lift.stalledWeeks} week(s). Progress has stalled.`,
          recommendations: bottlenecks
        });
      }
    });

    return insights;
  }
}
