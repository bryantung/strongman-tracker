import { AnalyticsRule, AnalyticsInsight, WeeklySummary } from "../../insights/insightTypes";
import { getTrendSlope } from "../../utils/trendSlope";

export class RecoveryRule implements AnalyticsRule {
  id = "recovery-rule";

  evaluate(summary: WeeklySummary, history: WeeklySummary[]): AnalyticsInsight[] {
    const insights: AnalyticsInsight[] = [];
    
    const recentWindow = history.slice(-4);
    const recoveryTrend = getTrendSlope(recentWindow, "recovery_score" as keyof WeeklySummary);

    if (recoveryTrend < -10) {
      insights.push({
        category: "recovery",
        severity: "high",
        confidence: 0.85,
        title: "Recovery Trend Declining",
        description: `Your recovery score trend has dropped by ${Math.abs(recoveryTrend).toFixed(1)} points/week over the last 4 weeks.`,
        recommendations: [
          "Reduce training volume by 15–20% temporarily.",
          "Ensure 8+ hours of sleep per night.",
          "Prioritize nutritional recovery and stress management."
        ]
      });
    }

    return insights;
  }
}
