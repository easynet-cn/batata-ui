import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'
import type { AxiosError } from 'axios'
import { setupRetryInterceptor } from '../retry'

function createMockError(status: number | null, code?: string): AxiosError {
  const config = { headers: {} as never }
  return {
    isAxiosError: true,
    name: 'AxiosError',
    message: 'Request failed',
    config,
    response:
      status !== null ? { status, data: {}, headers: {}, config, statusText: '' } : undefined,
    code,
    toJSON: () => ({}),
  } as AxiosError
}

describe('setupRetryInterceptor', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('retries on network error (no response)', async () => {
    const instance = axios.create()
    const requestSpy = vi.spyOn(instance, 'request').mockResolvedValue({ data: 'ok' })
    setupRetryInterceptor(instance, 2)

    // Get the interceptor error handler
    const interceptors = (
      instance.interceptors.response as unknown as {
        handlers: Array<{ rejected: (error: AxiosError) => Promise<unknown> }>
      }
    ).handlers
    const retryHandler = interceptors[0]!.rejected

    const error = createMockError(null)
    const promise = retryHandler(error)
    await vi.advanceTimersByTimeAsync(1000)

    const result = await promise
    expect(result).toEqual({ data: 'ok' })
    expect(requestSpy).toHaveBeenCalledTimes(1)
  })

  it('retries on 500 server error', async () => {
    const instance = axios.create()
    const requestSpy = vi.spyOn(instance, 'request').mockResolvedValue({ data: 'ok' })
    setupRetryInterceptor(instance, 2)

    const interceptors = (
      instance.interceptors.response as unknown as {
        handlers: Array<{ rejected: (error: AxiosError) => Promise<unknown> }>
      }
    ).handlers
    const retryHandler = interceptors[0]!.rejected

    const error = createMockError(500)
    const promise = retryHandler(error)
    await vi.advanceTimersByTimeAsync(1000)

    const result = await promise
    expect(result).toEqual({ data: 'ok' })
    expect(requestSpy).toHaveBeenCalledTimes(1)
  })

  it('does not retry on 4xx client errors', async () => {
    const instance = axios.create()
    setupRetryInterceptor(instance, 3)

    const interceptors = (
      instance.interceptors.response as unknown as {
        handlers: Array<{ rejected: (error: AxiosError) => Promise<unknown> }>
      }
    ).handlers
    const retryHandler = interceptors[0]!.rejected

    const error = createMockError(400)
    await expect(retryHandler(error)).rejects.toEqual(error)
  })

  it('does not retry on 401 auth errors', async () => {
    const instance = axios.create()
    setupRetryInterceptor(instance, 3)

    const interceptors = (
      instance.interceptors.response as unknown as {
        handlers: Array<{ rejected: (error: AxiosError) => Promise<unknown> }>
      }
    ).handlers
    const retryHandler = interceptors[0]!.rejected

    const error = createMockError(401)
    await expect(retryHandler(error)).rejects.toEqual(error)
  })

  it('does not retry cancelled requests', async () => {
    const instance = axios.create()
    setupRetryInterceptor(instance, 3)

    const interceptors = (
      instance.interceptors.response as unknown as {
        handlers: Array<{ rejected: (error: AxiosError) => Promise<unknown> }>
      }
    ).handlers
    const retryHandler = interceptors[0]!.rejected

    const error = createMockError(null, 'ERR_CANCELED')
    await expect(retryHandler(error)).rejects.toEqual(error)
  })

  it('stops retrying after maxRetries exceeded', async () => {
    const instance = axios.create()
    setupRetryInterceptor(instance, 1)

    const interceptors = (
      instance.interceptors.response as unknown as {
        handlers: Array<{ rejected: (error: AxiosError) => Promise<unknown> }>
      }
    ).handlers
    const retryHandler = interceptors[0]!.rejected

    const error = createMockError(503)
    // Simulate: after one retry, __retryCount equals maxRetries, so reject immediately
    ;(error.config as unknown as Record<string, unknown>).__retryCount = 1

    await expect(retryHandler(error)).rejects.toEqual(error)
  })

  it('does nothing when maxRetries is 0', async () => {
    const instance = axios.create()
    setupRetryInterceptor(instance, 0)

    const interceptors = (
      instance.interceptors.response as unknown as {
        handlers: Array<{ rejected: (error: AxiosError) => Promise<unknown> }>
      }
    ).handlers
    expect(interceptors).toHaveLength(0)
  })
})
