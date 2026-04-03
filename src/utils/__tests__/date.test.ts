import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getTimeRange, formatDateTime, formatTimestamp } from '../date'

describe('date utilities', () => {
  describe('formatDateTime', () => {
    it('formats date to YYYY-MM-DD HH:mm:ss', () => {
      const date = new Date('2024-06-15T10:30:45.000Z')
      expect(formatDateTime(date)).toBe('2024-06-15 10:30:45')
    })
  })

  describe('formatTimestamp', () => {
    it('returns "-" for falsy values', () => {
      expect(formatTimestamp(0)).toBe('-')
      expect(formatTimestamp(null)).toBe('-')
      expect(formatTimestamp(undefined)).toBe('-')
    })

    it('formats valid timestamps to locale string', () => {
      const timestamp = new Date('2024-06-15T10:30:00Z').getTime()
      const result = formatTimestamp(timestamp)
      expect(result).toBeTruthy()
      expect(result).not.toBe('-')
    })
  })

  describe('getTimeRange', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('returns correct range for 1h preset', () => {
      const result = getTimeRange('1h')
      expect(result.endTime).toBe('2024-06-15 12:00:00')
      expect(result.startTime).toBe('2024-06-15 11:00:00')
    })

    it('returns correct range for 24h preset', () => {
      const result = getTimeRange('24h')
      expect(result.endTime).toBe('2024-06-15 12:00:00')
      expect(result.startTime).toBe('2024-06-14 12:00:00')
    })

    it('returns correct range for 7d preset', () => {
      const result = getTimeRange('7d')
      expect(result.endTime).toBe('2024-06-15 12:00:00')
      expect(result.startTime).toBe('2024-06-08 12:00:00')
    })

    it('returns correct range for 30d preset', () => {
      const result = getTimeRange('30d')
      expect(result.endTime).toBe('2024-06-15 12:00:00')
      expect(result.startTime).toBe('2024-05-16 12:00:00')
    })

    it('returns undefined startTime for unknown preset', () => {
      const result = getTimeRange('custom')
      expect(result.startTime).toBeUndefined()
      expect(result.endTime).toBe('2024-06-15 12:00:00')
    })

    it('returns correct range for 15m preset', () => {
      const result = getTimeRange('15m')
      expect(result.endTime).toBe('2024-06-15 12:00:00')
      expect(result.startTime).toBe('2024-06-15 11:45:00')
    })
  })
})
