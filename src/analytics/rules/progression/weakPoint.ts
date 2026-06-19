import { AnalyticsRule, AnalyticsInsight, WeeklySummary } from "../../insights/insightTypes";
import { getTrendSlope } from "../../utils/trendSlope";

export class WeakPointRule implements AnalyticsRule {
  id = "weak-point-rule";

  evaluate(summary: WeeklySummary, history: WeeklySummary[]): AnalyticsInsight[] {
    const insights: AnalyticsInsight[] = [];
    
    const recentWindow = history.slice(-4);
    const benchSlope = getTrendSlope(recentWindow, "bench_avg");

    if (summary.chest_sets < 10 && benchSlope < 0.5) {
      insights.push({
        category: "progression",
        severity: "medium",
        confidence: 0.8,
        title: "Limiting Factor: Chest Volume",
        description: `Chest sets (${summary.chest_sets}/wk) are low while bench progress has flattened.`,
        recommendations: [
          "Increase chest volume to 12–16 weekly sets.",
          "Add Dumbbell Incline Press or chest dips."
        ]
      });
    }

    if (summary.trap_sets < 8 && summary.carry_volume < 1000) {
      insights.push({
        category: "progression",
        severity: "low",
        confidence: 0.75,
        title: "Strongman Support: Trap Conditioning",
        description: `Trap sets (${summary.trap_sets}) and carry volume are low. This limits overhead lockouts and farmer walk grip.`,
        recommendations: [
          "Add 6–8 sets of heavy farmer carries or barbell shrugs.",
          "Include rack pulls to overload the upper back."
        ]
      });
    }

    return insights;
  }
}
