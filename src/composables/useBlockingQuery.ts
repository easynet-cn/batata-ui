import { ref, onUnmounted, watch, type Ref } from 'vue'
import { storage } from '@/composables/useStorage'
import { logger } from '@/utils/logger'

const STORAGE_KEY = 'consul_blocking_queries'

export interface BlockingQueryOptions<T> {
  /** Function that performs the API call, receiving optional index/wait params */
  queryFn: (params: {
    index?: string
    wait?: string
  }) => Promise<{ data: T; headers: Record<string, string> }>
  /** Callback invoked with the response data */
  onData: (data: T) => void
  /** Reactive boolean to enable/disable the composable externally */
  enabled?: Ref<boolean>
  /** Consul blocking query wait duration (default: '5m') */
  wait?: string
}

export interface BlockingQueryReturn {
  /** True only during the initial fetch (index=0) */
  loading: Ref<boolean>
  /** Error message from the last failed request, or null */
  error: Ref<string | null>
  /** Whether blocking (long-poll) mode is enabled */
  blockingEnabled: Ref<boolean>
  /** Start polling from scratch */
  start: () => void
  /** Stop all polling activity */
  stop: () => void
  /** Stop then start (resets the index) */
  refresh: () => void
}

/**
 * Composable that wraps a Consul API call with X-Consul-Index based long polling.
 *
 * When blocking queries are enabled (via localStorage toggle), the composable
 * will continuously long-poll the server using the `index` and `wait` query
 * parameters. The server holds the connection open until the resource changes
 * or the wait timeout elapses, at which point the composable fires `onData`
 * and immediately re-polls.
 *
 * When blocking queries are disabled, only a single fetch is performed per
 * `start()` / `refresh()` call.
 */
export function useBlockingQuery<T>(options: BlockingQueryOptions<T>): BlockingQueryReturn {
  const { queryFn, onData, enabled, wait = '5m' } = options

  const loading = ref(false)
  const error = ref<string | null>(null)
  const blockingEnabled = ref(storage.get(STORAGE_KEY) === 'true')

  let currentIndex = '0'
  let abortController: AbortController | null = null
  let active = false
  let retryTimer: ReturnType<typeof setTimeout> | null = null

  // Watch the external enabled ref – stop polling when disabled, start when enabled
  if (enabled) {
    watch(enabled, (val) => {
      if (val && !active) {
        start()
      } else if (!val && active) {
        stop()
      }
    })
  }

  async function poll(): Promise<void> {
    if (!active) return

    try {
      // Only show the loading spinner on the very first fetch
      loading.value = currentIndex === '0'
      error.value = null

      const params: { index?: string; wait?: string } = {}
      if (blockingEnabled.value && currentIndex !== '0') {
        params.index = currentIndex
        params.wait = wait
      }

      abortController = new AbortController()
      const response = await queryFn(params)

      if (!active) return

      // Extract X-Consul-Index from response headers (case-insensitive)
      const headers = response.headers as unknown as Record<string, string>
      const newIndex =
        headers?.['x-consul-index'] || headers?.['X-Consul-Index'] || headers?.['X-CONSUL-INDEX']
      if (newIndex) {
        currentIndex = newIndex
      }

      onData(response.data)
      loading.value = false

      // Continue long-polling if blocking is enabled
      if (blockingEnabled.value && active) {
        poll()
      }
    } catch (err: unknown) {
      if (!active) return
      loading.value = false

      const message = err instanceof Error ? err.message : 'Query failed'
      error.value = message
      logger.error('Blocking query error:', err)

      // Retry after a delay on error (only if blocking is enabled)
      if (blockingEnabled.value && active) {
        retryTimer = setTimeout(() => {
          retryTimer = null
          poll()
        }, 5000)
      }
    }
  }

  function start(): void {
    currentIndex = '0'
    active = true
    poll()
  }

  function stop(): void {
    active = false
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    if (retryTimer) {
      clearTimeout(retryTimer)
      retryTimer = null
    }
  }

  function refresh(): void {
    stop()
    start()
  }

  onUnmounted(() => {
    stop()
  })

  return { loading, error, blockingEnabled, start, stop, refresh }
}
