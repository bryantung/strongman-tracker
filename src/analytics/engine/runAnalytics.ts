import { queryItems } from "../../services/dynamo";
import {
  WeeklySummary,
  AnalyticsInsight,
  AnalyticsResult,
  MeasurementEntry
} from "../insights/insightTypes";
import { CnsFatigueRule } from "../rules/fatigue/cnsFatigue";
import { LiftPlateauRule } from "../rules/plateau/liftPlateau";
import { WeakPointRule } from "../rules/progression/weakPoint";
import { StrongmanAlignmentRule } from "../rules/strongman/strongmanAlignment";
import { PhysiqueIntelligenceRule } from "../rules/physique/physiqueIntelligence";
import { RecoveryRule } from "../rules/recovery/recoveryRule";

export async function runAnalytics(): Promise<AnalyticsResult> {
  // Query all summaries, sort chronologically
  const summaries = (await queryItems("USER#1", "SUMMARY#")) as WeeklySummary[];
  summaries.sort((a, b) => a.SK.localeCompare(b.SK));

  // Deduplicate by week key (keep the latest version per week)
  const summaryMap: Record<string, WeeklySummary> = {};
  summaries.forEach(s => {
    summaryMap[s.week] = s;
  });
  const dedupedSummaries = Object.values(summaryMap).sort((a, b) => a.week.localeCompare(b.week));

  if (dedupedSummaries.length === 0) {
    return {
      latestSummary: null,
      insights: [],
      history: [],
      autoPlateaus: [],
      autoPhysique: null,
      autoMeasurements: null
    };
  }

  const latestSummary = dedupedSummaries[dedupedSummaries.length - 1];

  // Query measurements for physique intelligence
  const measurements = (await queryItems("USER#1", "MEASURE#")) as MeasurementEntry[];

  // Instantiate rules
  const cnsFatigueRule = new CnsFatigueRule();
  const liftPlateauRule = new LiftPlateauRule();
  const weakPointRule = new WeakPointRule();
  const strongmanAlignmentRule = new StrongmanAlignmentRule();
  const physiqueIntelligenceRule = new PhysiqueIntelligenceRule(measurements);
  const recoveryRule = new RecoveryRule();

  // Evaluate rules
  const rules = [
    cnsFatigueRule,
    liftPlateauRule,
    weakPointRule,
    strongmanAlignmentRule,
    physiqueIntelligenceRule,
    recoveryRule
  ];

  let insights: AnalyticsInsight[] = [];
  rules.forEach(rule => {
    const ruleInsights = rule.evaluate(latestSummary, dedupedSummaries);
    insights = insights.concat(ruleInsights);
  });

  return {
    latestSummary,
    insights,
    history: dedupedSummaries,
    autoPlateaus: liftPlateauRule.autoPlateaus,
    autoPhysique: physiqueIntelligenceRule.autoPhysique,
    autoMeasurements: physiqueIntelligenceRule.autoMeasurements
  };
}
