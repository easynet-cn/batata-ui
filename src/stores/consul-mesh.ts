import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  ConsulIntention,
  ConsulConfigEntry,
  ConsulConfigEntryKind,
  ConsulSession,
  ConsulPeering,
  ConsulUserEvent,
  ConsulRaftConfiguration,
  ConsulOperatorUsage,
} from '@/types/consul'
import consulApi from '@/api/consul'

export const useConsulMeshStore = defineStore('consul-mesh', () => {
  // State
  const loading = ref(false)
  const error = ref<string | null>(null)
  const intentions = ref<ConsulIntention[]>([])
  const configEntries = ref<ConsulConfigEntry[]>([])
  const sessions = ref<ConsulSession[]>([])
  const peerings = ref<ConsulPeering[]>([])
  const events = ref<ConsulUserEvent[]>([])
  const raftConfig = ref<ConsulRaftConfiguration | null>(null)
  const operatorUsage = ref<ConsulOperatorUsage | null>(null)

  // Actions
  async function fetchIntentions() {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.listIntentions()
      intentions.value = response.data || []
      return intentions.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch intentions'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchConfigEntries(kind: ConsulConfigEntryKind) {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.listConfigEntries(kind)
      configEntries.value = response.data || []
      return configEntries.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch config entries'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchSessions(dc?: string) {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.listSessions(dc)
      sessions.value = response.data || []
      return sessions.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch sessions'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchPeerings() {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.listPeerings()
      peerings.value = response.data || []
      return peerings.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch peerings'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchEvents(name?: string) {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.listEvents(name)
      events.value = response.data || []
      return events.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch events'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fireEvent(
    name: string,
    payload?: string,
    node?: string,
    service?: string,
    tag?: string,
  ) {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.fireEvent(name, payload, node, service, tag)
      return response.data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fire event'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchRaftConfig() {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.getRaftConfiguration()
      raftConfig.value = response.data || null
      return raftConfig.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch raft configuration'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchOperatorUsage() {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.getOperatorUsage()
      operatorUsage.value = response.data || null
      return operatorUsage.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch operator usage'
      throw err
    } finally {
      loading.value = false
    }
  }

  function $reset() {
    intentions.value = []
    configEntries.value = []
    sessions.value = []
    peerings.value = []
    events.value = []
    raftConfig.value = null
    operatorUsage.value = null
    error.value = null
  }

  return {
    loading,
    error,
    intentions,
    configEntries,
    sessions,
    peerings,
    events,
    raftConfig,
    operatorUsage,
    fetchIntentions,
    fetchConfigEntries,
    fetchSessions,
    fetchPeerings,
    fetchEvents,
    fireEvent,
    fetchRaftConfig,
    fetchOperatorUsage,
    $reset,
  }
})
