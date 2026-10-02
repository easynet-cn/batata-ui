import axios, { type AxiosInstance } from 'axios'
import { config } from '@/config'
import { storage } from '@/composables/useStorage'
import { ApiError, AuthError, NetworkError, isSessionExpired, toast } from '@/utils/error'
import { setupRetryInterceptor } from '@/utils/retry'
import { useI18n } from '@/i18n'

const { t } = useI18n()

/**
 * Create an Axios instance with shared interceptors for token injection and error handling.
 */
export function createApiInstance(baseURL: string): AxiosInstance {
  const instance = axios.create({
    baseURL,
    timeout: config.api.timeout,
    headers: { 'Content-Type': 'application/json' },
  })

  // Request interceptor: inject auth headers
  instance.interceptors.request.use(
    (reqConfig) => {
      const token = storage.get(config.storage.tokenKey)
      const username = storage.get(config.storage.usernameKey)
      if (token) {
        reqConfig.headers.set('accessToken', token)
      }
      if (username) {
        reqConfig.headers.set('username', username)
      }
      return reqConfig
    },
    (error) => Promise.reject(error),
  )

  // Response interceptor: classify errors
  instance.interceptors.response.use(
    (response) => {
      const data = response.data
      if (data && typeof data === 'object' && 'code' in data) {
        const code = Number(data.code)
        if (code !== 0 && code !== 200) {
          if (isSessionExpired(data.message, (data as { data?: unknown }).data)) {
            storage.remove(config.storage.tokenKey)
            storage.remove(config.storage.usernameKey)
            storage.remove(config.storage.userKey)
            if (window.location.pathname !== '/login') {
              window.location.href = '/login'
            }
            return Promise.reject(new AuthError(data.message || t('sessionExpired')))
          }
          if (code === 403) {
            return Promise.reject(new ApiError(403, data.message || t('permissionDenied')))
          }
          return Promise.reject(new ApiError(code, data.message || t('requestFailed')))
        }
      }
      return response
    },
    (error) => {
      if (error.response) {
        const status = error.response.status
        const respData = error.response.data
        const msg = typeof respData === 'string' ? respData : respData?.message || ''
        const dataStr =
          respData &&
          typeof respData === 'object' &&
          typeof (respData as { data?: unknown }).data === 'string'
            ? ((respData as { data?: unknown }).data as string)
            : ''

        // Surface the error here (mirrors Nacos console-ui's `toastError` in the
        // response error interceptor) so that requests whose callers don't handle
        // the rejection still get a visible message. The toast system de-duplicates
        // identical messages fired in quick succession.
        toast.error(msg || t('requestFailed'))

        if (status === 401 || status === 403) {
          if (isSessionExpired(msg, dataStr)) {
            storage.remove(config.storage.tokenKey)
            storage.remove(config.storage.usernameKey)
            storage.remove(config.storage.userKey)
            if (window.location.pathname !== '/login') {
              window.location.href = '/login'
            }
            return Promise.reject(new AuthError(msg || t('sessionExpired')))
          }
          return Promise.reject(new ApiError(status, msg || t('permissionDenied')))
        }
        if (status === 503) {
          return Promise.reject(new ApiError(503, 'Service unavailable'))
        }
        return Promise.reject(new ApiError(status, msg || t('requestFailed')))
      }
      return Promise.reject(new NetworkError(error.message))
    },
  )

  // Setup retry for network errors and 5xx
  if (config.api.retryCount > 0) {
    setupRetryInterceptor(instance, config.api.retryCount)
  }

  return instance
}
