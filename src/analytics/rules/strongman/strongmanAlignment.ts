import { AnalyticsRule, AnalyticsInsight, WeeklySummary } from "../../insights/insightTypes";

export class StrongmanAlignmentRule implements AnalyticsRule {
  id = "strongman-alignment-rule";

  evaluate(summary: WeeklySummary, history: WeeklySummary[]): AnalyticsInsight[] {
    const insights: AnalyticsInsight[] = [];

    if (summary.carry_volume < 1500) {
      insights.push({
        category: "physique", // Keep matches original runAnalytics.js category
        severity: "medium",
        confidence: 0.85,
        title: "Low Carry Exposure",
        description: `Weekly carry volume: ${summary.carry_volume} kg. Loaded walks are vital for functional core stability.`,
        recommendations: [
          "Integrate 2–3 sets of Farmer Walks or Sandbag carries.",
          "Target at least 1500 kg weekly carry volume."
        ]
      });
    }

    if (summary.strongman_score < 50) {
      insights.push({
        category: "physique", // Keep matches original runAnalytics.js category
        severity: "low",
        confidence: 0.8,
        title: "Low Strongman Alignment Score",
        description: `Strongman score: ${summary.strongman_score}. Overhead, deadlift, and carry ratio is suboptimal.`,
        recommendations: ["Prioritize heavy overhead and loaded carries over isolation work."]
      });
    }

    return insights;
  }
}
