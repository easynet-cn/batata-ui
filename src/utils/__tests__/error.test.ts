import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiError, NetworkError, AuthError, handleError, toast } from '../error'

describe('error utilities', () => {
  describe('ApiError', () => {
    it('creates an error with code and message', () => {
      const error = new ApiError(404, 'Not found')
      expect(error.code).toBe(404)
      expect(error.message).toBe('Not found')
      expect(error.name).toBe('ApiError')
    })

    it('stores optional details', () => {
      const details = { field: 'dataId' }
      const error = new ApiError(400, 'Bad request', details)
      expect(error.details).toEqual(details)
    })
  })

  describe('NetworkError', () => {
    it('creates with default message', () => {
      const error = new NetworkError()
      expect(error.name).toBe('NetworkError')
      expect(error.message).toContain('Network')
    })

    it('creates with custom message', () => {
      const error = new NetworkError('Custom message')
      expect(error.message).toBe('Custom message')
    })
  })

  describe('AuthError', () => {
    it('creates with default message', () => {
      const error = new AuthError()
      expect(error.name).toBe('AuthError')
      expect(error.message).toContain('Session')
    })
  })

  describe('handleError', () => {
    it('returns ApiError message', () => {
      const error = new ApiError(500, 'Server error')
      expect(handleError(error)).toBe('Server error')
    })

    it('returns NetworkError message', () => {
      const error = new NetworkError('Network down')
      expect(handleError(error)).toBe('Network down')
    })

    it('returns AuthError message', () => {
      const error = new AuthError('Expired')
      expect(handleError(error)).toBe('Expired')
    })

    it('returns generic Error message', () => {
      const error = new Error('Something went wrong')
      expect(handleError(error)).toBe('Something went wrong')
    })

    it('returns default message for unknown errors', () => {
      expect(handleError('string error')).toBe('An unknown error occurred')
      expect(handleError(42)).toBe('An unknown error occurred')
      expect(handleError(null)).toBe('An unknown error occurred')
    })
  })

  describe('toast', () => {
    beforeEach(() => {
      toast.clear()
    })

    it('shows a toast and returns an id', () => {
      const id = toast.show('Test message', 'info')
      expect(id).toBeGreaterThan(0)
      const toasts = toast.getToasts().value
      expect(toasts).toHaveLength(1)
      expect(toasts[0]!.message).toBe('Test message')
    })

    it('shows different toast types', () => {
      toast.success('Success')
      toast.error('Error')
      toast.warning('Warning')
      toast.info('Info')
      const toasts = toast.getToasts().value
      expect(toasts).toHaveLength(4)
      expect(toasts[0]!.type).toBe('success')
      expect(toasts[1]!.type).toBe('error')
      expect(toasts[2]!.type).toBe('warning')
      expect(toasts[3]!.type).toBe('info')
    })

    it('removes a toast by id', () => {
      const id = toast.show('Test', 'info', 0) // no auto-dismiss
      expect(toast.getToasts().value).toHaveLength(1)
      toast.remove(id)
      expect(toast.getToasts().value).toHaveLength(0)
    })

    it('clears all toasts', () => {
      toast.show('A', 'info', 0)
      toast.show('B', 'info', 0)
      toast.show('C', 'info', 0)
      expect(toast.getToasts().value).toHaveLength(3)
      toast.clear()
      expect(toast.getToasts().value).toHaveLength(0)
    })

    it('auto-dismisses toast after duration', () => {
      vi.useFakeTimers()
      toast.show('Auto dismiss', 'info', 1000)
      expect(toast.getToasts().value).toHaveLength(1)
      vi.advanceTimersByTime(1000)
      expect(toast.getToasts().value).toHaveLength(0)
      vi.useRealTimers()
    })
  })
})
