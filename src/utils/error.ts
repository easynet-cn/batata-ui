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
  constructor(message = '网络连接失败，请检查网络设置') {
    super(message)
    this.name = 'NetworkError'
  }
}

export class AuthError extends Error {
  constructor(message = '登录已过期，请重新登录') {
    super(message)
    this.name = 'AuthError'
  }
}

// Global error handler
export function handleError(error: unknown): string {
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
  return '发生未知错误'
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
  clear() {
    toasts.value = []
  },
  getToasts() {
    return toasts
  },
}
