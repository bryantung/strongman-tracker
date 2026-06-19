import { AnalyticsRule, AnalyticsInsight, WeeklySummary } from "../../insights/insightTypes";

export class CnsFatigueRule implements AnalyticsRule {
  id = "cns-fatigue-rule";

  evaluate(summary: WeeklySummary, history: WeeklySummary[]): AnalyticsInsight[] {
    const insights: AnalyticsInsight[] = [];

    if (summary.average_rpe !== null && summary.average_rpe > 8.5 && summary.compound_volume > 12000) {
      insights.push({
        category: "fatigue",
        severity: "high",
        confidence: 0.9,
        title: "CNS Fatigue Risk Detected",
        description: `Average RPE ${summary.average_rpe.toFixed(1)} combined with ${summary.compound_volume} kg compound volume is extremely high.`,
        recommendations: [
          "Reduce compound sets by 15–20% next week.",
          "Target RPE below 8.0 on accessory work."
        ]
      });
    } else if (summary.fatigue_score > 70) {
      insights.push({
        category: "fatigue",
        severity: "medium",
        confidence: 0.8,
        title: "Elevated Training Fatigue",
        description: `Cumulative fatigue score (${summary.fatigue_score}) has exceeded optimal baselines.`,
        recommendations: [
          "Ensure 8+ hours of sleep per night.",
          "Add an extra rest day between heavy loading sessions."
        ]
      });
    }

    return insights;
  }
}
