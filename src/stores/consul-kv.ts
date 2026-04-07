import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ConsulKVPair } from '@/types/consul'
import consulApi from '@/api/consul'

export const useConsulKVStore = defineStore('consul-kv', () => {
  // State
  const loading = ref(false)
  const error = ref<string | null>(null)
  const kvKeys = ref<string[]>([])
  const kvPairs = ref<ConsulKVPair[]>([])

  // Actions
  async function fetchKVKeys(prefix?: string) {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.listKVKeys(prefix)
      kvKeys.value = response.data || []
      return kvKeys.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch KV keys'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchKV(key: string) {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.getKV(key)
      return response.data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch KV pair'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function putKV(key: string, value: string, flags?: number) {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.putKV(key, value, flags)
      return response.data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to put KV pair'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteKV(key: string, recurse?: boolean) {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.deleteKV(key, recurse)
      return response.data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to delete KV pair'
      throw err
    } finally {
      loading.value = false
    }
  }

  function $reset() {
    kvKeys.value = []
    kvPairs.value = []
    error.value = null
  }

  return {
    loading,
    error,
    kvKeys,
    kvPairs,
    fetchKVKeys,
    fetchKV,
    putKV,
    deleteKV,
    $reset,
  }
})
