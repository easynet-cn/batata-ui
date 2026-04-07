import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  ConsulNode,
  ConsulUINode,
  ConsulUIServiceSummary,
  ConsulHealthCheck,
  ConsulAgentMember,
  ConsulServiceNode,
  ConsulCatalogSummary,
  ConsulServiceTopology,
  ConsulExportedService,
  ConsulImportedService,
} from '@/types/consul'
import consulApi from '@/api/consul'

export const useConsulCatalogStore = defineStore('consul-catalog', () => {
  // State
  const loading = ref(false)
  const error = ref<string | null>(null)
  const services = ref<Record<string, string[]>>({}) // name -> tags
  const uiServices = ref<ConsulUIServiceSummary[]>([])
  const serviceNodes = ref<ConsulServiceNode[]>([])
  const nodes = ref<ConsulNode[]>([])
  const uiNodes = ref<ConsulUINode[]>([])
  const healthChecks = ref<ConsulHealthCheck[]>([])
  const members = ref<ConsulAgentMember[]>([])
  const catalogOverview = ref<ConsulCatalogSummary | null>(null)
  const serviceTopology = ref<ConsulServiceTopology | null>(null)
  const exportedServices = ref<ConsulExportedService[]>([])
  const importedServices = ref<ConsulImportedService[]>([])

  // Actions
  async function fetchServices(dc?: string) {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.getCatalogServices(dc)
      services.value = response.data || {}
      return services.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch services'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchUIServices(dc?: string) {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.getUIServices(dc)
      uiServices.value = response.data || []
      return uiServices.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch UI services'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchServiceNodes(name: string, dc?: string) {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.getCatalogServiceNodes(name, dc)
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
      const response = await consulApi.getCatalogNodes(dc)
      nodes.value = response.data || []
      return nodes.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch nodes'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchUINodes(dc?: string) {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.getUINodes(dc)
      uiNodes.value = response.data || []
      return uiNodes.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch UI nodes'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchHealthChecks(state?: string, dc?: string) {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.getHealthState(state || 'any', dc)
      healthChecks.value = response.data || []
      return healthChecks.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch health checks'
      throw err
    } finally {
      loading.value = false
    }
  }

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

  async function fetchCatalogOverview(dc?: string) {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.getCatalogOverview(dc)
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
      const response = await consulApi.getServiceTopology(service, dc)
      serviceTopology.value = response.data || null
      return serviceTopology.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch service topology'
      throw err
    } finally {
      loading.value = false
    }
  }

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

  function $reset() {
    services.value = {}
    uiServices.value = []
    serviceNodes.value = []
    nodes.value = []
    uiNodes.value = []
    healthChecks.value = []
    members.value = []
    catalogOverview.value = null
    serviceTopology.value = null
    exportedServices.value = []
    importedServices.value = []
    error.value = null
  }

  return {
    loading,
    error,
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
    $reset,
  }
})
