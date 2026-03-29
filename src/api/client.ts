import axios, { type AxiosInstance } from 'axios'
import { config } from '@/config'
import { storage } from '@/composables/useStorage'
import { ApiError, AuthError, NetworkError } from '@/utils/error'
import { setupRetryInterceptor } from '@/utils/retry'

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
          if (code === 401 || code === 403) {
            storage.remove(config.storage.tokenKey)
            storage.remove(config.storage.usernameKey)
            storage.remove(config.storage.userKey)
            if (window.location.pathname !== '/login') {
              window.location.href = '/login'
            }
            return Promise.reject(new AuthError(data.message || 'Session expired'))
          }
          return Promise.reject(new ApiError(code, data.message || 'Request failed'))
        }
      }
      return response
    },
    (error) => {
      if (error.response) {
        const status = error.response.status
        if (status === 401 || status === 403) {
          storage.remove(config.storage.tokenKey)
          storage.remove(config.storage.usernameKey)
          storage.remove(config.storage.userKey)
          if (window.location.pathname !== '/login') {
            window.location.href = '/login'
          }
          return Promise.reject(new AuthError('Session expired'))
        }
        if (status === 503) {
          return Promise.reject(new ApiError(503, 'Service unavailable'))
        }
        return Promise.reject(
          new ApiError(status, error.response.data?.message || 'Request failed'),
        )
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
