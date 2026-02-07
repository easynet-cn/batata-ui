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

/**
 * Get a relative time description (e.g., "Just now", "5 minutes ago").
 */
export function getRelativeTime(
  timestamp: number,
  labels: { justNow: string; minutesAgo: string; hoursAgo: string },
): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)

  if (minutes < 1) return labels.justNow
  if (minutes < 60) return `${minutes} ${labels.minutesAgo}`
  return `${hours} ${labels.hoursAgo}`
}
