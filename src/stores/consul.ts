import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { storage } from '@/composables/useStorage'
import type { ConsulConfigEntryKind } from '@/types/consul'
import consulApi from '@/api/consul'
import { useConsulKVStore } from '@/stores/consul-kv'
import { useConsulACLStore } from '@/stores/consul-acl'
import { useConsulCatalogStore } from '@/stores/consul-catalog'
import { useConsulMeshStore } from '@/stores/consul-mesh'

// Re-export sub-stores for direct use
export { useConsulKVStore } from '@/stores/consul-kv'
export { useConsulACLStore } from '@/stores/consul-acl'
export { useConsulCatalogStore } from '@/stores/consul-catalog'
export { useConsulMeshStore } from '@/stores/consul-mesh'

export const useConsulStore = defineStore('consul', () => {
  // Shared state
  const loading = ref(false)
  const error = ref<string | null>(null)
  const datacenters = ref<string[]>([])
  const savedDc = storage.get('consul_current_dc') || ''
  const currentDc = ref<string>(savedDc)

  // Persist currentDc changes
  watch(currentDc, (val) => {
    storage.set('consul_current_dc', val)
  })

  // Helper to resolve datacenter parameter
  function resolveDc(dc?: string): string | undefined {
    return dc || currentDc.value || undefined
  }

  // ============================================
  // Datacenter Actions (shared)
  // ============================================

  async function fetchDatacenters() {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.getDatacenters()
      datacenters.value = response.data || []
      // Restore saved DC or default to first
      if (datacenters.value.length > 0) {
        if (!currentDc.value || !datacenters.value.includes(currentDc.value)) {
          currentDc.value = datacenters.value[0] ?? ''
        }
      }
      return datacenters.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch datacenters'
      throw err
    } finally {
      loading.value = false
    }
  }

  function setCurrentDc(dc: string) {
    currentDc.value = dc
  }

  function clearError() {
    error.value = null
  }

  // ============================================
  // Facade: delegate to sub-stores
  // ============================================

  // KV Store
  const kvStore = computed(() => useConsulKVStore())
  const kvKeys = computed(() => kvStore.value.kvKeys)
  const kvPairs = computed(() => kvStore.value.kvPairs)

  function fetchKVKeys(prefix?: string) {
    return kvStore.value.fetchKVKeys(prefix)
  }
  function fetchKV(key: string) {
    return kvStore.value.fetchKV(key)
  }
  function putKV(key: string, value: string, flags?: number) {
    return kvStore.value.putKV(key, value, flags)
  }
  function deleteKV(key: string, recurse?: boolean) {
    return kvStore.value.deleteKV(key, recurse)
  }

  // ACL Store
  const aclStore = computed(() => useConsulACLStore())
  const aclTokens = computed(() => aclStore.value.aclTokens)
  const aclPolicies = computed(() => aclStore.value.aclPolicies)
  const aclRoles = computed(() => aclStore.value.aclRoles)
  const authMethods = computed(() => aclStore.value.authMethods)
  const bindingRules = computed(() => aclStore.value.bindingRules)
  const aclEnabled = computed(() => aclStore.value.aclEnabled)

  function fetchACLTokens() {
    return aclStore.value.fetchACLTokens()
  }
  function fetchACLPolicies() {
    return aclStore.value.fetchACLPolicies()
  }
  function fetchACLRoles() {
    return aclStore.value.fetchACLRoles()
  }
  function fetchAuthMethods() {
    return aclStore.value.fetchAuthMethods()
  }
  function fetchBindingRules(authMethod?: string) {
    return aclStore.value.fetchBindingRules(authMethod)
  }
  function probeACLCapabilities() {
    return aclStore.value.probeACLCapabilities()
  }

  // Catalog Store
  const catalogStore = computed(() => useConsulCatalogStore())
  const services = computed(() => catalogStore.value.services)
  const uiServices = computed(() => catalogStore.value.uiServices)
  const serviceNodes = computed(() => catalogStore.value.serviceNodes)
  const nodes = computed(() => catalogStore.value.nodes)
  const uiNodes = computed(() => catalogStore.value.uiNodes)
  const healthChecks = computed(() => catalogStore.value.healthChecks)
  const members = computed(() => catalogStore.value.members)
  const catalogOverview = computed(() => catalogStore.value.catalogOverview)
  const serviceTopology = computed(() => catalogStore.value.serviceTopology)
  const exportedServices = computed(() => catalogStore.value.exportedServices)
  const importedServices = computed(() => catalogStore.value.importedServices)

  function fetchServices(dc?: string) {
    return catalogStore.value.fetchServices(resolveDc(dc))
  }
  function fetchUIServices(dc?: string) {
    return catalogStore.value.fetchUIServices(resolveDc(dc))
  }
  function fetchServiceNodes(name: string, dc?: string) {
    return catalogStore.value.fetchServiceNodes(name, resolveDc(dc))
  }
  function fetchNodes(dc?: string) {
    return catalogStore.value.fetchNodes(resolveDc(dc))
  }
  function fetchUINodes(dc?: string) {
    return catalogStore.value.fetchUINodes(resolveDc(dc))
  }
  function fetchHealthChecks(state?: string, dc?: string) {
    return catalogStore.value.fetchHealthChecks(state, resolveDc(dc))
  }
  function fetchMembers() {
    return catalogStore.value.fetchMembers()
  }
  function fetchCatalogOverview(dc?: string) {
    return catalogStore.value.fetchCatalogOverview(resolveDc(dc))
  }
  function fetchServiceTopology(service: string, dc?: string) {
    return catalogStore.value.fetchServiceTopology(service, resolveDc(dc))
  }
  function fetchExportedServices() {
    return catalogStore.value.fetchExportedServices()
  }
  function fetchImportedServices() {
    return catalogStore.value.fetchImportedServices()
  }

  // Mesh Store
  const meshStore = computed(() => useConsulMeshStore())
  const intentions = computed(() => meshStore.value.intentions)
  const configEntries = computed(() => meshStore.value.configEntries)
  const sessions = computed(() => meshStore.value.sessions)
  const peerings = computed(() => meshStore.value.peerings)
  const events = computed(() => meshStore.value.events)
  const raftConfig = computed(() => meshStore.value.raftConfig)
  const operatorUsage = computed(() => meshStore.value.operatorUsage)

  function fetchIntentions() {
    return meshStore.value.fetchIntentions()
  }
  function fetchConfigEntries(kind: ConsulConfigEntryKind) {
    return meshStore.value.fetchConfigEntries(kind)
  }
  function fetchSessions(dc?: string) {
    return meshStore.value.fetchSessions(resolveDc(dc))
  }
  function fetchPeerings() {
    return meshStore.value.fetchPeerings()
  }
  function fetchEvents(name?: string) {
    return meshStore.value.fetchEvents(name)
  }
  function fireEvent(
    name: string,
    payload?: string,
    node?: string,
    service?: string,
    tag?: string,
  ) {
    return meshStore.value.fireEvent(name, payload, node, service, tag)
  }
  function fetchRaftConfig() {
    return meshStore.value.fetchRaftConfig()
  }
  function fetchOperatorUsage() {
    return meshStore.value.fetchOperatorUsage()
  }

  // ============================================
  // Reset all stores
  // ============================================

  function $reset() {
    kvStore.value.$reset()
    aclStore.value.$reset()
    catalogStore.value.$reset()
    meshStore.value.$reset()
    datacenters.value = []
    currentDc.value = ''
    error.value = null
  }

  return {
    // Shared state
    loading,
    error,
    datacenters,
    currentDc,

    // KV state
    kvKeys,
    kvPairs,

    // ACL state
    aclTokens,
    aclPolicies,
    aclRoles,
    authMethods,
    bindingRules,
    aclEnabled,

    // Catalog state
    services,
    uiServices,
    serviceNodes,
    nodes,
    uiNodes,
    healthChecks,
    members,
    catalogOverview,
    serviceTopology,
    exportedServices,
    importedServices,

    // Mesh state
    intentions,
    configEntries,
    sessions,
    peerings,
    events,
    raftConfig,
    operatorUsage,

    // Shared actions
    fetchDatacenters,
    setCurrentDc,
    clearError,
    $reset,

    // KV actions
    fetchKVKeys,
    fetchKV,
    putKV,
    deleteKV,

    // ACL actions
    fetchACLTokens,
    fetchACLPolicies,
    fetchACLRoles,
    fetchAuthMethods,
    fetchBindingRules,
    probeACLCapabilities,

    // Catalog actions
    fetchServices,
    fetchUIServices,
    fetchServiceNodes,
    fetchNodes,
    fetchUINodes,
    fetchHealthChecks,
    fetchMembers,
    fetchCatalogOverview,
    fetchServiceTopology,
    fetchExportedServices,
    fetchImportedServices,

    // Mesh actions
    fetchIntentions,
    fetchConfigEntries,
    fetchSessions,
    fetchPeerings,
    fetchEvents,
    fireEvent,
    fetchRaftConfig,
    fetchOperatorUsage,
  }
})
