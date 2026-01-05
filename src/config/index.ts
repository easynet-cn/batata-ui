/**
 * Application configuration
 */
export const config = {
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || '/nacos',
    timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
    retryCount: Number(import.meta.env.VITE_API_RETRY_COUNT) || 3,
  },
  app: {
    title: import.meta.env.VITE_APP_TITLE || 'Nacos Console',
    version: import.meta.env.VITE_APP_VERSION || '2.0.0',
  },
  storage: {
    tokenKey: 'nacos-token',
    usernameKey: 'nacos-username',
    userKey: 'nacos_user',
    namespaceKey: 'nacos_current_ns',
    langKey: 'nacos_lang',
  },
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [10, 20, 50, 100],
  },
  cache: {
    maxSize: 100,
    ttl: 60000, // 1 minute
  },
} as const

export type Config = typeof config
