import { ref, onMounted, onUnmounted, watch, type Ref } from 'vue'
import { useDocumentVisibility } from '@vueuse/core'

export interface UseAutoRefreshOptions {
  /** Refresh function to call */
  fetchFn: () => Promise<void>
  /** Interval in milliseconds (default: 30000 = 30s) */
  interval?: number
  /** Start immediately on mount (default: true) */
  immediate?: boolean
  /** Pause when tab is hidden (default: true) */
  pauseOnHidden?: boolean
}

export interface UseAutoRefreshReturn {
  /** Whether auto-refresh is active */
  isActive: Ref<boolean>
  /** Last refresh timestamp */
  lastRefreshed: Ref<Date | null>
  /** Start auto-refreshing */
  start: () => void
  /** Stop auto-refreshing */
  stop: () => void
  /** Toggle auto-refresh */
  toggle: () => void
  /** Manually trigger refresh */
  refresh: () => Promise<void>
}

/**
 * Composable for auto-refreshing data at a configurable interval.
 * Supports pause/resume via Page Visibility API and manual refresh.
 */
export function useAutoRefresh(options: UseAutoRefreshOptions): UseAutoRefreshReturn {
  const { fetchFn, interval = 30000, immediate = true, pauseOnHidden = true } = options

  const isActive = ref(false)
  const lastRefreshed = ref<Date | null>(null)
  let timerId: ReturnType<typeof setInterval> | null = null

  // Track whether the user explicitly started auto-refresh,
  // so we can resume after tab becomes visible again.
  let wasActiveBeforeHidden = false

  const visibility = pauseOnHidden ? useDocumentVisibility() : null

  /**
   * Execute the fetch function and update the last refreshed timestamp.
   */
  async function refresh(): Promise<void> {
    try {
      await fetchFn()
      lastRefreshed.value = new Date()
    } catch {
      // Errors should be handled by the caller's fetchFn.
      // We still update the timestamp so the UI reflects the attempt.
      lastRefreshed.value = new Date()
    }
  }

  /**
   * Start auto-refreshing at the configured interval.
   */
  function start(): void {
    if (timerId !== null) {
      return
    }
    isActive.value = true
    timerId = setInterval(refresh, interval)
  }

  /**
   * Stop auto-refreshing and clear the interval timer.
   */
  function stop(): void {
    isActive.value = false
    if (timerId !== null) {
      clearInterval(timerId)
      timerId = null
    }
  }

  /**
   * Toggle auto-refresh on or off.
   */
  function toggle(): void {
    if (isActive.value) {
      stop()
    } else {
      start()
    }
  }

  // Pause/resume based on document visibility
  if (visibility) {
    watch(visibility, (current) => {
      if (current === 'hidden') {
        wasActiveBeforeHidden = isActive.value
        if (isActive.value) {
          stop()
        }
      } else if (current === 'visible' && wasActiveBeforeHidden) {
        // Resume and trigger an immediate refresh to catch up
        start()
        refresh()
      }
    })
  }

  onMounted(() => {
    if (immediate) {
      start()
    }
  })

  onUnmounted(() => {
    stop()
  })

  return {
    isActive,
    lastRefreshed,
    start,
    stop,
    toggle,
    refresh,
  }
}

/**
 * Simple polling composable that calls a function at a fixed interval.
 * Automatically starts on mount and cleans up on unmount.
 * Pauses when the document tab is hidden.
 */
export function usePolling(fn: () => Promise<void>, interval: number = 30000): void {
  let timerId: ReturnType<typeof setInterval> | null = null
  let wasRunning = false
  const visibility = useDocumentVisibility()

  function startTimer(): void {
    if (timerId !== null) return
    timerId = setInterval(fn, interval)
  }

  function stopTimer(): void {
    if (timerId !== null) {
      clearInterval(timerId)
      timerId = null
    }
  }

  // Pause when tab is hidden, resume when visible
  watch(visibility, (current) => {
    if (current === 'hidden') {
      wasRunning = timerId !== null
      stopTimer()
    } else if (current === 'visible' && wasRunning) {
      startTimer()
      fn()
    }
  })

  onMounted(() => {
    startTimer()
  })

  onUnmounted(() => {
    stopTimer()
  })
}
