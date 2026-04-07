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

export const toast = {
  show(message: string, type: ToastType = 'info', duration = 3000) {
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
