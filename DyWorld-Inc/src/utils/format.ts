const TIERS = [
  { value: 1e18, suffix: 'E' },
  { value: 1e15, suffix: 'P' },
  { value: 1e12, suffix: 'T' },
  { value: 1e9,  suffix: 'B' },
  { value: 1e6,  suffix: 'M' },
  { value: 1e3,  suffix: 'K' },
]

export function formatNumber(n: number): string {
  if (!Number.isFinite(n) || n === 0) return '0'
  for (const { value, suffix } of TIERS) {
    if (n >= value) {
      const scaled = n / value
      const decimals = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2
      return `${scaled.toFixed(decimals)}${suffix}`
    }
  }
  return Math.floor(n).toLocaleString()
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0s'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}
