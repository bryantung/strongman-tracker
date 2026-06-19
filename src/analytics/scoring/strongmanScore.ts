/**
 * Calculates the Strongman Alignment Score.
 * Formula: ((compoundVolume / 100) * 0.5) + ((carryVolume / 100) * 0.3) + (bodyweight * 0.2)
 */
export function calculateStrongmanScore(
  compoundVolume: number,
  carryVolume: number,
  bodyweight: number
): number {
  const score = ((compoundVolume / 100) * 0.5) + ((carryVolume / 100) * 0.3) + (bodyweight * 0.2);
  return Math.round(score * 10) / 10;
}
