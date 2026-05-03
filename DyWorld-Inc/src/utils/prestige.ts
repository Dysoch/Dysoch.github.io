export function calculatePrestige(coins: number): number {
  return Math.floor(Math.sqrt(coins / 1000));
}
