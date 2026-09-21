const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi']

export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '0'
  const sign = n < 0 ? '-' : ''
  const abs = Math.abs(n)
  if (abs < 1000) return sign + (Number.isInteger(abs) ? abs.toString() : abs.toFixed(1))

  const tier = Math.min(SUFFIXES.length - 1, Math.floor(Math.log10(abs) / 3))
  const scaled = abs / Math.pow(1000, tier)
  return `${sign}${scaled.toFixed(scaled < 10 ? 2 : 1)}${SUFFIXES[tier]}`
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.ceil(seconds)}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes}m`
}
