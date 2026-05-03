import { useGameStore } from '../store/gameStore'

const ENGINEERING_TIERS = [
  { value: 1e18, suffix: 'E' },
  { value: 1e15, suffix: 'P' },
  { value: 1e12, suffix: 'T' },
  { value: 1e9,  suffix: 'B' },
  { value: 1e6,  suffix: 'M' },
  { value: 1e3,  suffix: 'K' },
]

const NORMAL_TIERS = [
  { value: 1e18, suffix: ' quintillion' },
  { value: 1e15, suffix: ' quadrillion' },
  { value: 1e12, suffix: ' trillion' },
  { value: 1e9,  suffix: ' billion' },
  { value: 1e6,  suffix: ' million' },
  { value: 1e3,  suffix: 'k' },
]

export function formatNumber(n: number): string {
  if (!Number.isFinite(n) || n === 0) return '0'
  const format = useGameStore.getState().numberFormat

  if (format === 'scientific') {
    if (Math.abs(n) < 1000) return Math.floor(n).toString()
    const exp = Math.floor(Math.log10(Math.abs(n)))
    const mantissa = n / Math.pow(10, exp)
    return `${mantissa.toFixed(2)}e${exp}`
  }

  const tiers = format === 'normal' ? NORMAL_TIERS : ENGINEERING_TIERS
  for (const { value, suffix } of tiers) {
    if (n >= value) {
      const scaled = n / value
      const decimals = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2
      return `${scaled.toFixed(decimals)}${suffix}`
    }
  }
  return n.toFixed(2).toLocaleString()
  // return Math.floor(n).toLocaleString()
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0s'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}
