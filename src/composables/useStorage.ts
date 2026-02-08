import { logger } from '@/utils/logger'

/**
 * Type-safe localStorage abstraction with JSON serialization support.
 */
export const storage = {
  get<T = string>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(key)
      if (item === null) return defaultValue ?? null
      return item as T
    } catch (e) {
      logger.error(`Failed to read localStorage key "${key}"`, e)
      return defaultValue ?? null
    }
  },

  getJSON<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(key)
      if (item === null) return defaultValue ?? null
      return JSON.parse(item) as T
    } catch (e) {
      logger.error(`Failed to parse localStorage key "${key}"`, e)
      return defaultValue ?? null
    }
  },

  set(key: string, value: string): void {
    try {
      localStorage.setItem(key, value)
    } catch (e) {
      logger.error(`Failed to write localStorage key "${key}"`, e)
    }
  },

  setJSON<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      logger.error(`Failed to serialize localStorage key "${key}"`, e)
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch (e) {
      logger.error(`Failed to remove localStorage key "${key}"`, e)
    }
  },
}
