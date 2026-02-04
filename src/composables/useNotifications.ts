import { ref, readonly } from 'vue'

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message?: string
  timestamp: number
  read: boolean
  duration?: number
}

const notifications = ref<Notification[]>([])
const unreadCount = ref(0)

let notificationId = 0

/**
 * Notification composable for real-time updates and alerts
 */
export function useNotifications() {
  const addNotification = (
    notification: Omit<Notification, 'id' | 'timestamp' | 'read'>,
  ): Notification => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${++notificationId}`,
      timestamp: Date.now(),
      read: false,
    }

    notifications.value.unshift(newNotification)
    unreadCount.value++

    // Auto-remove after duration (if specified)
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        removeNotification(newNotification.id)
      }, notification.duration)
    }

    // Keep only last 50 notifications
    if (notifications.value.length > 50) {
      notifications.value = notifications.value.slice(0, 50)
    }

    return newNotification
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex((n) => n.id === id)
    if (index > -1) {
      const notification = notifications.value[index]
      if (notification && !notification.read) {
        unreadCount.value--
      }
      notifications.value.splice(index, 1)
    }
  }

  const markAsRead = (id: string) => {
    const notification = notifications.value.find((n) => n.id === id)
    if (notification !== undefined && !notification.read) {
      notification.read = true
      unreadCount.value--
    }
  }

  const markAllAsRead = () => {
    notifications.value.forEach((n) => {
      n.read = true
    })
    unreadCount.value = 0
  }

  const clearAll = () => {
    notifications.value = []
    unreadCount.value = 0
  }

  // Convenience methods
  const info = (title: string, message?: string, duration?: number) => {
    return addNotification({ type: 'info', title, message, duration })
  }

  const success = (title: string, message?: string, duration?: number) => {
    return addNotification({ type: 'success', title, message, duration })
  }

  const warning = (title: string, message?: string, duration?: number) => {
    return addNotification({ type: 'warning', title, message, duration })
  }

  const error = (title: string, message?: string, duration?: number) => {
    return addNotification({ type: 'error', title, message, duration })
  }

  return {
    notifications: readonly(notifications),
    unreadCount: readonly(unreadCount),
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    info,
    success,
    warning,
    error,
  }
}

// Singleton instance for global use
export const globalNotifications = useNotifications()
