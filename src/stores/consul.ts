import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  ConsulKVPair,
  ConsulNode,
  ConsulHealthCheck,
  ConsulACLToken,
  ConsulACLPolicy,
  ConsulACLRole,
  ConsulACLAuthMethod,
  ConsulACLBindingRule,
  ConsulIntention,
  ConsulSession,
  ConsulConfigEntry,
  ConsulConfigEntryKind,
  ConsulAgentMember,
  ConsulServiceNode,
  ConsulPeering,
  ConsulCatalogSummary,
  ConsulServiceTopology,
  ConsulExportedService,
  ConsulImportedService,
  ConsulUserEvent,
  ConsulRaftConfiguration,
  ConsulOperatorUsage,
} from '@/types/consul'
import consulApi from '@/api/consul'

export const useConsulStore = defineStore('consul', () => {
  // State
  const loading = ref(false)
  const error = ref<string | null>(null)

  // KV Store
  const kvKeys = ref<string[]>([])
  const kvPairs = ref<ConsulKVPair[]>([])

  // Catalog
  const services = ref<Record<string, string[]>>({}) // name -> tags
  const serviceNodes = ref<ConsulServiceNode[]>([])
  const nodes = ref<ConsulNode[]>([])

  // Health
  const healthChecks = ref<ConsulHealthCheck[]>([])

  // Agent
  const members = ref<ConsulAgentMember[]>([])

  // ACL
  const aclTokens = ref<ConsulACLToken[]>([])
  const aclPolicies = ref<ConsulACLPolicy[]>([])
  const aclRoles = ref<ConsulACLRole[]>([])

  // Mesh
  const intentions = ref<ConsulIntention[]>([])
  const configEntries = ref<ConsulConfigEntry[]>([])

  // Auth Methods
  const authMethods = ref<ConsulACLAuthMethod[]>([])
  const bindingRules = ref<ConsulACLBindingRule[]>([])

  // Peerings
  const peerings = ref<ConsulPeering[]>([])

  // Sessions
  const sessions = ref<ConsulSession[]>([])

  // Catalog Overview
  const catalogOverview = ref<ConsulCatalogSummary | null>(null)

  // Service Topology
  const serviceTopology = ref<ConsulServiceTopology | null>(null)

  // Exported/Imported Services
  const exportedServices = ref<ConsulExportedService[]>([])
  const importedServices = ref<ConsulImportedService[]>([])

  // Events
  const events = ref<ConsulUserEvent[]>([])

  // Operator
  const raftConfig = ref<ConsulRaftConfiguration | null>(null)
  const operatorUsage = ref<ConsulOperatorUsage | null>(null)

  // Cluster
  const datacenters = ref<string[]>([])
  const currentDc = ref<string>('')

  // ============================================
  // KV Store Actions
  // ============================================

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

  // ============================================
  // Catalog Actions
  // ============================================

  async function fetchServices(dc?: string) {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.getCatalogServices(dc || currentDc.value || undefined)
      services.value = response.data || {}
      return services.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch services'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchServiceNodes(name: string, dc?: string) {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.getCatalogServiceNodes(
        name,
        dc || currentDc.value || undefined,
      )
      serviceNodes.value = response.data || []
      return serviceNodes.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch service nodes'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchNodes(dc?: string) {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.getCatalogNodes(dc || currentDc.value || undefined)
      nodes.value = response.data || []
      return nodes.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch nodes'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // Health Actions
  // ============================================

  async function fetchHealthChecks(state?: string, dc?: string) {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.getHealthState(
        state || 'any',
        dc || currentDc.value || undefined,
      )
      healthChecks.value = response.data || []
      return healthChecks.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch health checks'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // Agent Actions
  // ============================================

  async function fetchMembers() {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.getAgentMembers()
      members.value = response.data || []
      return members.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch agent members'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // ACL Actions
  // ============================================

  async function fetchACLTokens() {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.listACLTokens()
      aclTokens.value = response.data || []
      return aclTokens.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch ACL tokens'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchACLPolicies() {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.listACLPolicies()
      aclPolicies.value = response.data || []
      return aclPolicies.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch ACL policies'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchACLRoles() {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.listACLRoles()
      aclRoles.value = response.data || []
      return aclRoles.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch ACL roles'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // Intentions Actions
  // ============================================

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

  // ============================================
  // Config Entries Actions
  // ============================================

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

  // ============================================
  // Session Actions
  // ============================================

  async function fetchSessions(dc?: string) {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.listSessions(dc || currentDc.value || undefined)
      sessions.value = response.data || []
      return sessions.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch sessions'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // Auth Method Actions
  // ============================================

  async function fetchAuthMethods() {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.listACLAuthMethods()
      authMethods.value = response.data || []
      return authMethods.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch auth methods'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchBindingRules(authMethod?: string) {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.listBindingRules(authMethod)
      bindingRules.value = response.data || []
      return bindingRules.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch binding rules'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // Peering Actions
  // ============================================

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

  // ============================================
  // Catalog Overview Actions
  // ============================================

  async function fetchCatalogOverview(dc?: string) {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.getCatalogOverview(dc || currentDc.value || undefined)
      catalogOverview.value = response.data || null
      return catalogOverview.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch catalog overview'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchServiceTopology(service: string, dc?: string) {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.getServiceTopology(
        service,
        dc || currentDc.value || undefined,
      )
      serviceTopology.value = response.data || null
      return serviceTopology.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch service topology'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // Exported/Imported Services Actions
  // ============================================

  async function fetchExportedServices() {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.getExportedServices()
      exportedServices.value = response.data || []
      return exportedServices.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch exported services'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchImportedServices() {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.getImportedServices()
      importedServices.value = response.data || []
      return importedServices.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch imported services'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // Events Actions
  // ============================================

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

  // ============================================
  // Operator Actions
  // ============================================

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

  // ============================================
  // Datacenter Actions
  // ============================================

  async function fetchDatacenters() {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.getDatacenters()
      datacenters.value = response.data || []
      if (datacenters.value.length > 0 && !currentDc.value) {
        currentDc.value = datacenters.value[0] ?? ''
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

  function $reset() {
    kvKeys.value = []
    kvPairs.value = []
    services.value = {}
    serviceNodes.value = []
    nodes.value = []
    healthChecks.value = []
    members.value = []
    aclTokens.value = []
    aclPolicies.value = []
    aclRoles.value = []
    authMethods.value = []
    bindingRules.value = []
    peerings.value = []
    intentions.value = []
    configEntries.value = []
    sessions.value = []
    catalogOverview.value = null
    serviceTopology.value = null
    exportedServices.value = []
    importedServices.value = []
    events.value = []
    raftConfig.value = null
    operatorUsage.value = null
    datacenters.value = []
    currentDc.value = ''
    error.value = null
  }

  return {
    // State
    loading,
    error,
    kvKeys,
    kvPairs,
    services,
    serviceNodes,
    nodes,
    healthChecks,
    members,
    aclTokens,
    aclPolicies,
    aclRoles,
    authMethods,
    bindingRules,
    peerings,
    intentions,
    configEntries,
    sessions,
    catalogOverview,
    serviceTopology,
    exportedServices,
    importedServices,
    events,
    raftConfig,
    operatorUsage,
    datacenters,
    currentDc,

    // Actions
    fetchKVKeys,
    fetchKV,
    putKV,
    deleteKV,
    fetchServices,
    fetchServiceNodes,
    fetchNodes,
    fetchHealthChecks,
    fetchMembers,
    fetchACLTokens,
    fetchACLPolicies,
    fetchACLRoles,
    fetchAuthMethods,
    fetchBindingRules,
    fetchPeerings,
    fetchIntentions,
    fetchConfigEntries,
    fetchSessions,
    fetchCatalogOverview,
    fetchServiceTopology,
    fetchExportedServices,
    fetchImportedServices,
    fetchEvents,
    fireEvent,
    fetchRaftConfig,
    fetchOperatorUsage,
    fetchDatacenters,
    setCurrentDc,
    clearError,
    $reset,
  }
})
