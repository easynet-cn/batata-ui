/**
 * Calculate time range based on a preset key.
 * Returns start/end timestamps formatted as 'YYYY-MM-DD HH:mm:ss'.
 */
export function getTimeRange(preset: string): { startTime?: string; endTime?: string } {
  const now = new Date()
  const endTime = formatDateTime(now)

  const presetMs: Record<string, number> = {
    '15m': 15 * 60 * 1000,
    '1h': 3600000,
    '6h': 6 * 3600000,
    '24h': 86400000,
    '7d': 7 * 86400000,
    '30d': 30 * 86400000,
  }

  const ms = presetMs[preset]
  if (!ms) {
    return { startTime: undefined, endTime }
  }

  const startTime = formatDateTime(new Date(now.getTime() - ms))
  return { startTime, endTime }
}

/**
 * Format a Date object to 'YYYY-MM-DD HH:mm:ss' string.
 */
export function formatDateTime(date: Date): string {
  return date.toISOString().slice(0, 19).replace('T', ' ')
}

/**
 * Format a Unix timestamp (ms) to locale string. Returns '-' for falsy values.
 */
export function formatTimestamp(timestamp: number | undefined | null): string {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleString()
}
