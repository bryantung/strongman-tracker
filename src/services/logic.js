/**
 * Strongman Tracker – Evaluation Logic
 *
 * Pure functions that compute status labels from raw user inputs.
 * Keep this module free of side-effects so it stays easy to unit-test.
 */

/**
 * Determines recovery readiness.
 *
 * @param {number} sleep   – Hours of sleep (0-12+)
 * @param {number} energy  – Self-rated energy level (1-5)
 * @param {number} joint   – Self-rated joint fatigue (1-5, where 5 = severe)
 * @returns {{ label: string, level: string }}
 *   label: human-readable status
 *   level: one of "excellent" | "good" | "caution" | "rest"
 */
exports.recoveryStatus = (sleep, energy, joint) => {
  // Composite score: higher is better.  Joint is inverted (high fatigue = bad).
  const score = sleep + energy + (6 - joint);

  if (score >= 16) return { label: "Ready for PR",        level: "excellent" };
  if (score >= 12) return { label: "Ready to Train",      level: "good" };
  if (score >= 8)  return { label: "Light Session Only",  level: "caution" };
  return              { label: "Rest Day Recommended", level: "rest" };
};

