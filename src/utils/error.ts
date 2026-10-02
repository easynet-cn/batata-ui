import { ref } from 'vue'

export class ApiError extends Error {
  constructor(
    public code: number,
    message: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class NetworkError extends Error {
  constructor(message = 'Network connection failed, please check your network settings') {
    super(message)
    this.name = 'NetworkError'
  }
}

export class AuthError extends Error {
  constructor(message = 'Session expired, please login again') {
    super(message)
    this.name = 'AuthError'
  }
}

export class TimeoutError extends Error {
  constructor(message = 'Request timed out, please try again') {
    super(message)
    this.name = 'TimeoutError'
  }
}

export class ValidationError extends Error {
  public fields: Record<string, string[]>

  constructor(message = 'Validation failed', fields: Record<string, string[]> = {}) {
    super(message)
    this.name = 'ValidationError'
    this.fields = fields
  }
}

// Messages that indicate an expired/invalid token or session, which require the
// user to re-authenticate. Mirrors Nacos console-ui `SESSION_EXPIRED_MESSAGES`,
// extended with messages returned by the batata server.
export const SESSION_EXPIRED_MESSAGES = [
  'unknown user!',
  'user not found',
  'token invalid!',
  'token expired!',
  'expired token',
  'session expired!',
  'invalid signature',
  'unsupported signature algorithm',
  'invalid token',
  'token is required',
  'token is empty',
  'token has expired',
  'token signature verification failed',
  'no valid oidc token found',
  'token audience validation failed',
  'token issuer mismatch',
  'token is not yet valid',
  'token processing error',
  // batata server specific
  'token validation failed',
  'authentication failed',
]

// Returns true when the given text indicates the session/token is expired or
// otherwise invalid, i.e. the client should clear credentials and redirect to login.
// `extra` (typically the response body's `data` string field) is folded into the
// matched text, mirroring Nacos console-ui `combined = message + ' ' + dataField`.
export function isSessionExpired(message?: string | null, extra?: unknown): boolean {
  const base = message ?? ''
  const extraText = typeof extra === 'string' ? extra : ''
  const text = `${base} ${extraText}`.toLowerCase().trim()
  if (!text) return false
  return SESSION_EXPIRED_MESSAGES.some((m) => text.includes(m))
}

// Global error handler
export function handleError(error: unknown): string {
  if (error instanceof ValidationError) {
    const fieldMessages = Object.entries(error.fields)
      .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
      .join('; ')
    return fieldMessages || error.message
  }
  if (error instanceof TimeoutError) {
    return error.message
  }
  if (error instanceof ApiError) {
    return error.message
  }
  if (error instanceof NetworkError) {
    return error.message
  }
  if (error instanceof AuthError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unknown error occurred'
}

// Toast notification system
type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

const toasts = ref<Toast[]>([])
let toastId = 0
const recentToastKeys = new Map<string, number>()
const TOAST_DEDUPE_MS = 1000

export const toast = {
  show(message: string, type: ToastType = 'info', duration = 3000) {
    // De-duplicate identical toasts fired within a short window. This lets the
    // interceptor layer toast errors (mirroring Nacos) without doubling up with
    // callers that also surface the same error.
    const now = Date.now()
    const key = `${type}:${message}`
    const last = recentToastKeys.get(key)
    if (last !== undefined && now - last < TOAST_DEDUPE_MS) {
      return -1
    }
    recentToastKeys.set(key, now)

    const id = ++toastId
    toasts.value.push({ id, message, type })
    if (duration > 0) {
      setTimeout(() => this.remove(id), duration)
    }
    return id
  },
  success(message: string, duration?: number) {
    return this.show(message, 'success', duration)
  },
  error(message: string, duration?: number) {
    return this.show(message, 'error', duration)
  },
  warning(message: string, duration?: number) {
    return this.show(message, 'warning', duration)
  },
  info(message: string, duration?: number) {
    return this.show(message, 'info', duration)
  },
  remove(id: number) {
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  },
  apiError(error: unknown, duration?: number) {
    const message = handleError(error)
    return this.error(message, duration)
  },
  clear() {
    toasts.value = []
  },
  getToasts() {
    return toasts
  },
}
