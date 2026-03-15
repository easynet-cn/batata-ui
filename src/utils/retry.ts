import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'

interface RetryableConfig extends InternalAxiosRequestConfig {
  __retryCount?: number
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryable(error: AxiosError): boolean {
  // Never retry if the request was cancelled
  if (error.code === 'ERR_CANCELED') return false

  // Retry on network errors (no response received)
  if (!error.response) return true

  // Retry on 5xx server errors
  return error.response.status >= 500
}

/**
 * Add retry-with-exponential-backoff to an Axios instance.
 * Must be added BEFORE any error-classification interceptor so it
 * receives the raw AxiosError and can transparently re-send the request.
 */
export function setupRetryInterceptor(instance: AxiosInstance, maxRetries: number) {
  if (maxRetries <= 0) return

  instance.interceptors.response.use(undefined, async (error: AxiosError) => {
    const cfg = error.config as RetryableConfig | undefined
    if (!cfg) return Promise.reject(error)

    cfg.__retryCount = cfg.__retryCount ?? 0

    if (!isRetryable(error) || cfg.__retryCount >= maxRetries) {
      return Promise.reject(error)
    }

    cfg.__retryCount += 1

    // Exponential backoff: 1 s, 2 s, 4 s …
    const backoff = Math.pow(2, cfg.__retryCount - 1) * 1000
    console.warn(
      `[API Retry] Attempt ${cfg.__retryCount}/${maxRetries} for ${cfg.url} after ${backoff}ms`,
    )
    await delay(backoff)

    return instance.request(cfg)
  })
}
