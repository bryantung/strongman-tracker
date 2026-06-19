/**
 * Computes a simple rolling average over the last N values of an array.
 */
export function rollingAverage(values: number[], windowSize: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = values.slice(start, i + 1).filter(v => v > 0);
    if (window.length === 0) {
      result.push(0);
    } else {
      result.push(window.reduce((a, b) => a + b, 0) / window.length);
    }
  }
  return result;
}

/**
 * Returns the average of a numeric array, ignoring zeros.
 */
export function average(values: number[]): number {
  const nonZero = values.filter(v => v > 0);
  if (nonZero.length === 0) return 0;
  return nonZero.reduce((a, b) => a + b, 0) / nonZero.length;
}
