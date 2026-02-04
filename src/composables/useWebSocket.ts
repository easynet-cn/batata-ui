import { ref, onUnmounted, readonly } from 'vue'
import { config } from '@/config'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface WebSocketMessage {
  type: 'config_change' | 'service_change' | 'instance_change' | 'notification'
  data: unknown
  timestamp: number
}

export interface UseWebSocketOptions {
  autoConnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

const defaultOptions: UseWebSocketOptions = {
  autoConnect: true,
  reconnectInterval: 5000,
  maxReconnectAttempts: 5,
}

/**
 * WebSocket composable for real-time updates
 * Note: This is infrastructure code - actual WebSocket endpoint needs to be provided by backend
 */
export function useWebSocket(options: UseWebSocketOptions = {}) {
  const opts = { ...defaultOptions, ...options }

  const status = ref<ConnectionStatus>('disconnected')
  const lastMessage = ref<WebSocketMessage | null>(null)
  const reconnectAttempts = ref(0)

  let ws: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null

  const listeners: Map<string, Set<(data: unknown) => void>> = new Map()

  const connect = () => {
    if (ws?.readyState === WebSocket.OPEN) {
      return
    }

    status.value = 'connecting'

    try {
      // WebSocket URL - can be configured to point to actual backend
      const wsUrl = config.websocket?.url || `ws://${window.location.host}/ws/v1/console`
      ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        status.value = 'connected'
        reconnectAttempts.value = 0
        console.log('[WebSocket] Connected')
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          lastMessage.value = message

          // Notify listeners
          const typeListeners = listeners.get(message.type)
          if (typeListeners) {
            typeListeners.forEach((callback) => callback(message.data))
          }

          // Notify global listeners
          const globalListeners = listeners.get('*')
          if (globalListeners) {
            globalListeners.forEach((callback) => callback(message))
          }
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error)
        status.value = 'error'
      }

      ws.onclose = () => {
        status.value = 'disconnected'
        console.log('[WebSocket] Disconnected')

        // Attempt to reconnect
        if (reconnectAttempts.value < (opts.maxReconnectAttempts || 5)) {
          reconnectTimer = setTimeout(() => {
            reconnectAttempts.value++
            console.log(`[WebSocket] Reconnecting... (attempt ${reconnectAttempts.value})`)
            connect()
          }, opts.reconnectInterval)
        }
      }
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error)
      status.value = 'error'
    }
  }

  const disconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }

    if (ws) {
      ws.close()
      ws = null
    }

    status.value = 'disconnected'
    reconnectAttempts.value = 0
  }

  const send = (message: unknown) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    } else {
      console.warn('[WebSocket] Cannot send message - not connected')
    }
  }

  const on = (type: string, callback: (data: unknown) => void) => {
    if (!listeners.has(type)) {
      listeners.set(type, new Set())
    }
    listeners.get(type)!.add(callback)

    // Return unsubscribe function
    return () => {
      listeners.get(type)?.delete(callback)
    }
  }

  const off = (type: string, callback?: (data: unknown) => void) => {
    if (callback) {
      listeners.get(type)?.delete(callback)
    } else {
      listeners.delete(type)
    }
  }

  // Auto connect if enabled
  if (opts.autoConnect) {
    // Delay connection to avoid issues during SSR or initial render
    setTimeout(connect, 100)
  }

  // Cleanup on unmount
  onUnmounted(() => {
    disconnect()
    listeners.clear()
  })

  return {
    status: readonly(status),
    lastMessage: readonly(lastMessage),
    reconnectAttempts: readonly(reconnectAttempts),
    connect,
    disconnect,
    send,
    on,
    off,
  }
}

// Singleton instance for global use
let globalInstance: ReturnType<typeof useWebSocket> | null = null

export function useGlobalWebSocket() {
  if (!globalInstance) {
    globalInstance = useWebSocket({ autoConnect: false })
  }
  return globalInstance
}
