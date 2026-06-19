import { queryItems, putItem } from "../../services/dynamo";
import { WeeklySummary } from "../insights/insightTypes";
import { getISOWeek } from "../utils/dateUtils";
import { calculateStrongmanScore } from "../scoring/strongmanScore";
import { getWeeklyRecoveryScores } from "../scoring/recoveryScore";

interface WorkoutLog {
  PK: string;
  SK: string;
  exercise: string;
  sets?: number;
  reps?: string | number;
  weight?: number;
  category?: string;
  muscle_group?: string;
  fatigue_score?: number;
  rpe?: number;
}

interface MetricLog {
  PK: string;
  SK: string;
  bodyweight: number;
  bench?: number;
  deadlift?: number;
  push_press?: number;
}

interface MeasurementLog {
  PK: string;
  SK: string;
  bodyweight: number;
}

interface WeekAccumulator {
  week: string;
  workoutLogs: WorkoutLog[];
  bodyweight: number;
  bench_max: number;
  deadlift_max: number;
  push_press_max: number;
  bench_sum: number;
  bench_count: number;
  deadlift_sum: number;
  deadlift_count: number;
  push_press_sum: number;
  push_press_count: number;
}

export async function aggregateAllWeeks(): Promise<WeeklySummary[]> {
  const workoutLogs = (await queryItems("USER#1", "WORKOUT#")) as WorkoutLog[];
  const metricLogs = (await queryItems("USER#1", "METRIC#")) as MetricLog[];
  const measurements = (await queryItems("USER#1", "MEASURE#")) as MeasurementLog[];
  
  // Get weekly recovery scores
  const weeklyRecoveryScores = await getWeeklyRecoveryScores();

  const weeksData: Record<string, WeekAccumulator> = {};

  const getBodyweightForWeek = (week: string): number => {
    const weekMeasures = measurements.filter(m => getISOWeek(m.SK.replace("MEASURE#", "")) === week);
    if (weekMeasures.length > 0) {
      return weekMeasures.reduce((sum, m) => sum + m.bodyweight, 0) / weekMeasures.length;
    }
    const weekMetrics = metricLogs.filter(m => getISOWeek(m.SK.replace("METRIC#", "")) === week);
    if (weekMetrics.length > 0) {
      return weekMetrics.reduce((sum, m) => sum + m.bodyweight, 0) / weekMetrics.length;
    }

    let closestBw = 90;
    let minDiff = Infinity;
    const targetTime = new Date(week.replace("-W", "-") + "-1").getTime();

    measurements.concat(metricLogs).forEach(m => {
      const ts = m.SK.includes("MEASURE#") ? m.SK.replace("MEASURE#", "") : m.SK.replace("METRIC#", "");
      const t = new Date(ts).getTime();
      if (t < targetTime && (targetTime - t) < minDiff) {
        minDiff = targetTime - t;
        closestBw = m.bodyweight;
      }
    });
    return closestBw;
  };

  workoutLogs.forEach(log => {
    const timestamp = log.SK.replace("WORKOUT#", "");
    const week = getISOWeek(timestamp);
    if (!week) return;

    if (!weeksData[week]) {
      weeksData[week] = {
        week,
        workoutLogs: [],
        bodyweight: getBodyweightForWeek(week),
        bench_max: 0,
        deadlift_max: 0,
        push_press_max: 0,
        bench_sum: 0,
        bench_count: 0,
        deadlift_sum: 0,
        deadlift_count: 0,
        push_press_sum: 0,
        push_press_count: 0
      };
    }
    weeksData[week].workoutLogs.push(log);
  });

  metricLogs.forEach(log => {
    const timestamp = log.SK.replace("METRIC#", "");
    const week = getISOWeek(timestamp);
    if (!week) return;

    if (!weeksData[week]) {
      weeksData[week] = {
        week,
        workoutLogs: [],
        bodyweight: getBodyweightForWeek(week),
        bench_max: 0,
        deadlift_max: 0,
        push_press_max: 0,
        bench_sum: 0,
        bench_count: 0,
        deadlift_sum: 0,
        deadlift_count: 0,
        push_press_sum: 0,
        push_press_count: 0
      };
    }

    if (log.bench) {
      weeksData[week].bench_sum += log.bench;
      weeksData[week].bench_count++;
      weeksData[week].bench_max = Math.max(weeksData[week].bench_max, log.bench);
    }
    if (log.deadlift) {
      weeksData[week].deadlift_sum += log.deadlift;
      weeksData[week].deadlift_count++;
      weeksData[week].deadlift_max = Math.max(weeksData[week].deadlift_max, log.deadlift);
    }
    if (log.push_press) {
      weeksData[week].push_press_sum += log.push_press;
      weeksData[week].push_press_count++;
      weeksData[week].push_press_max = Math.max(weeksData[week].push_press_max, log.push_press);
    }
  });

  const summaries: WeeklySummary[] = [];

  for (const week in weeksData) {
    const data = weeksData[week];

    let total_volume = 0;
    let compound_volume = 0;
    let carry_volume = 0;
    let fatigue_score = 0;
    let rpe_sum = 0;
    let rpe_count = 0;

    const muscleSets: Record<string, number> = {
      chest: 0, back: 0, traps: 0, shoulders: 0, legs: 0, arms: 0, core: 0
    };

    data.workoutLogs.forEach(log => {
      const sets = Number(log.sets) || 0;
      const repsStr = String(log.reps || "5");
      const repsMatch = repsStr.match(/^(\d+)/);
      const reps = repsMatch ? Number(repsMatch[1]) : 5;
      const weight = Number(log.weight) || 0;
      const vol = sets * reps * weight;

      total_volume += vol;
      if (log.category === "compound") {
        compound_volume += vol;
      } else if (log.category === "carry") {
        carry_volume += vol;
      }

      fatigue_score += sets * (Number(log.fatigue_score) || 0);

      if (log.rpe) {
        rpe_sum += log.rpe * sets;
        rpe_count += sets;
      }

      if (log.muscle_group && muscleSets[log.muscle_group] !== undefined) {
        muscleSets[log.muscle_group] += sets;
      }

      const nameLower = log.exercise.toLowerCase();
      if (nameLower.includes("bench press")) {
        data.bench_sum += weight;
        data.bench_count++;
        data.bench_max = Math.max(data.bench_max, weight);
      } else if (nameLower.includes("deadlift")) {
        data.deadlift_sum += weight;
        data.deadlift_count++;
        data.deadlift_max = Math.max(data.deadlift_max, weight);
      } else if (nameLower.includes("push press")) {
        data.push_press_sum += weight;
        data.push_press_count++;
        data.push_press_max = Math.max(data.push_press_max, weight);
      }
    });

    const average_rpe = rpe_count > 0 ? (rpe_sum / rpe_count) : null;
    const bodyweight = data.bodyweight;

    const bench_avg = data.bench_count > 0 ? (data.bench_sum / data.bench_count) : 0;
    const deadlift_avg = data.deadlift_count > 0 ? (data.deadlift_sum / data.deadlift_count) : 0;
    const push_press_avg = data.push_press_count > 0 ? (data.push_press_sum / data.push_press_count) : 0;

    const strongman_score = calculateStrongmanScore(compound_volume, carry_volume, bodyweight);

    const summaryItem: WeeklySummary = {
      PK: "USER#1",
      SK: "SUMMARY#" + week,
      week,
      bodyweight,
      fatigue_score,
      compound_volume,
      carry_volume,
      total_volume,
      average_rpe,
      strongman_score,

      bench_avg: Math.round(bench_avg * 10) / 10,
      bench_max: data.bench_max,
      deadlift_avg: Math.round(deadlift_avg * 10) / 10,
      deadlift_max: data.deadlift_max,
      push_press_avg: Math.round(push_press_avg * 10) / 10,
      push_press_max: data.push_press_max,

      chest_sets: muscleSets.chest,
      back_sets: muscleSets.back,
      trap_sets: muscleSets.traps,
      shoulder_sets: muscleSets.shoulders,
      leg_sets: muscleSets.legs,
      arm_sets: muscleSets.arms,
      core_sets: muscleSets.core
    };

    const recovery_score = weeklyRecoveryScores[week];
    if (recovery_score !== undefined) {
      summaryItem.recovery_score = recovery_score;
    }

    await putItem(summaryItem);
    summaries.push(summaryItem);
  }

  return summaries;
}
