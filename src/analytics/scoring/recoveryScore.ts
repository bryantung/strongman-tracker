import { queryItems } from "../../services/dynamo";
import { getISOWeek } from "../utils/dateUtils";

export interface RecoveryLog {
  PK: string;
  SK: string;
  sleep: number;
  energy: number;
  joint: number;
  status: string;
  level: string;
}

/**
 * Calculates recovery score for a given sleep, energy, and joint fatigue.
 * Formula: recovery_score = (sleepScore * 0.4) + (energyScore * 0.3) - (fatigueScore * 0.3)
 * where:
 * - sleep is rated hours of sleep (scaled out of 10: sleepScore = min(sleep, 10) * 10)
 * - energy is self-rated energy level 1-5 (scaled out of 5: energyScore = energy * 20)
 * - joint is self-rated joint fatigue 1-5 (scaled out of 5: jointScore = joint * 20)
 */
export function calculateRecoveryScore(sleep: number, energy: number, joint: number): number {
  const sleepScore = Math.min(sleep, 10) * 10;
  const energyScore = energy * 20;
  const jointScore = joint * 20;
  const score = (sleepScore * 0.4) + (energyScore * 0.3) - (jointScore * 0.3);
  return Math.round(score * 10) / 10;
}

/**
 * Fetches all recovery logs and computes the average recovery score mapping per week.
 */
export async function getWeeklyRecoveryScores(): Promise<Record<string, number>> {
  const logs = (await queryItems("USER#1", "RECOVERY#")) as RecoveryLog[];
  const weeklyData: Record<string, { sleepSum: number; energySum: number; jointSum: number; count: number }> = {};

  logs.forEach(log => {
    const timestamp = log.SK.replace("RECOVERY#", "");
    const week = getISOWeek(timestamp);
    if (!week) return;

    if (!weeklyData[week]) {
      weeklyData[week] = { sleepSum: 0, energySum: 0, jointSum: 0, count: 0 };
    }

    weeklyData[week].sleepSum += log.sleep || 0;
    weeklyData[week].energySum += log.energy || 0;
    weeklyData[week].jointSum += log.joint || 0;
    weeklyData[week].count++;
  });

  const weeklyScores: Record<string, number> = {};
  for (const week in weeklyData) {
    const data = weeklyData[week];
    if (data.count > 0) {
      const avgSleep = data.sleepSum / data.count;
      const avgEnergy = data.energySum / data.count;
      const avgJoint = data.jointSum / data.count;
      weeklyScores[week] = calculateRecoveryScore(avgSleep, avgEnergy, avgJoint);
    }
  }

  return weeklyScores;
}
