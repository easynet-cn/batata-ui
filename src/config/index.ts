/**
 * Application configuration
 */
export const config = {
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
    timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
    retryCount: Number(import.meta.env.VITE_API_RETRY_COUNT) || 3,
  },
  app: {
    title: import.meta.env.VITE_APP_TITLE || 'Batata Console',
    version: import.meta.env.VITE_APP_VERSION || '2.0.0',
  },
  storage: {
    tokenKey: 'batata-token',
    usernameKey: 'batata-username',
    userKey: 'batata_user',
    namespaceKey: 'batata_current_ns',
    langKey: 'batata_lang',
  },
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [10, 20, 50, 100],
  },
  cache: {
    maxSize: 100,
    ttl: 60000, // 1 minute
  },
  websocket: {
    url: import.meta.env.VITE_WS_URL || '',
    reconnectInterval: 5000,
    maxReconnectAttempts: 5,
    enabled: import.meta.env.VITE_WS_ENABLED === 'true',
  },
} as const

export type Config = typeof config
