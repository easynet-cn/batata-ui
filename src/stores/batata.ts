import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ServiceInfo, ConfigInfo, Namespace, NodeInfo } from '@/types'
import batataApi from '@/api/batata'
import { storage } from '@/composables/useStorage'
import { useI18n } from '@/i18n'

export const useBatataStore = defineStore('batata', () => {
  const { t } = useI18n()

  // State
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentUser = ref<{ username: string; token: string } | null>(null)

  // Service state
  const services = ref<ServiceInfo[]>([])
  const serviceTotal = ref(0)
  const currentService = ref<ServiceInfo | null>(null)

  // Config state
  const configs = ref<ConfigInfo[]>([])
  const configTotal = ref(0)
  const currentConfig = ref<ConfigInfo | null>(null)

  // Namespace state
  const namespaces = ref<Namespace[]>([])
  const currentNamespace = ref<string>('public')

  // Cluster state
  const clusterNodes = ref<NodeInfo[]>([])

  // Computed
  const isAuthenticated = computed(() => !!currentUser.value)
  const healthyServicesCount = computed(
    () => services.value.filter((s) => s.healthyInstanceCount > 0).length,
  )
  const totalInstancesCount = computed(() => services.value.reduce((sum, s) => sum + s.ipCount, 0))

  // Actions
  async function login(username: string, password: string) {
    try {
      loading.value = true
      error.value = null

      const response = await batataApi.login(username, password)
      const { accessToken } = response.data

      currentUser.value = { username, token: accessToken }
      storage.set('batata-token', accessToken)
      storage.set('batata-username', username)

      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : t('loginFailedGeneric')
      return false
    } finally {
      loading.value = false
    }
  }

  function logout() {
    currentUser.value = null
    storage.remove('batata-token')
    storage.remove('batata-username')
    services.value = []
    configs.value = []
    namespaces.value = []
  }

  async function fetchServices(params?: {
    pageNo?: number
    pageSize?: number
    groupName?: string
    serviceName?: string
    namespaceId?: string
  }) {
    try {
      loading.value = true
      error.value = null

      const response = await batataApi.getServiceList({
        pageNo: params?.pageNo ?? 1,
        pageSize: params?.pageSize ?? 20,
        groupName: params?.groupName,
        serviceName: params?.serviceName,
        namespaceId: params?.namespaceId,
        hasIpCount: true,
      })
      services.value = response.data.data.pageItems || []
      serviceTotal.value = response.data.data.totalCount || 0

      return response.data.data
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('fetchServiceListFailed')
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchServiceDetail(serviceName: string, groupName: string, namespaceId?: string) {
    try {
      loading.value = true
      error.value = null

      const response = await batataApi.getServiceDetail(serviceName, groupName, namespaceId)
      return response.data.data
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('fetchServiceDetailFailed')
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchConfigs(params?: {
    pageNo?: number
    pageSize?: number
    dataId?: string
    group?: string
    tenant?: string
  }) {
    try {
      loading.value = true
      error.value = null

      const response = await batataApi.getConfigList({
        pageNo: params?.pageNo ?? 1,
        pageSize: params?.pageSize ?? 20,
        dataId: params?.dataId,
        groupName: params?.group,
        namespaceId: params?.tenant,
      })
      configs.value = response.data.data.pageItems
      configTotal.value = response.data.data.totalCount

      return response.data.data
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('fetchConfigListFailed')
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchConfigContent(dataId: string, group: string, tenant?: string) {
    try {
      loading.value = true
      error.value = null

      const response = await batataApi.getConfig(dataId, group, tenant)
      return response.data.data
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('fetchConfigContentFailed')
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchNamespaces() {
    try {
      loading.value = true
      error.value = null

      const response = await batataApi.getNamespaceList()
      namespaces.value = response.data.data

      return response.data.data
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('fetchNamespacesFailed')
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchClusterNodes() {
    try {
      loading.value = true
      error.value = null

      const response = await batataApi.getClusterNodes()
      clusterNodes.value = response.data.data

      return response.data.data
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('fetchClusterNodesFailed')
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteService(serviceName: string, groupName: string, namespaceId?: string) {
    try {
      loading.value = true
      error.value = null

      await batataApi.deleteService(serviceName, groupName, namespaceId)
      return true
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('deleteServiceFailed')
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createService(data: {
    serviceName: string
    groupName?: string
    namespaceId?: string
    protectThreshold?: number
    metadata?: Record<string, string>
  }) {
    try {
      loading.value = true
      error.value = null

      await batataApi.createService(data)
      return true
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('createServiceFailed')
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteConfig(dataId: string, group: string, tenant?: string) {
    try {
      loading.value = true
      error.value = null

      await batataApi.deleteConfig(dataId, group, tenant)
      return true
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('deleteConfigFailed')
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function publishConfig(data: {
    dataId: string
    groupName: string
    content: string
    type?: string
    namespaceId?: string
    appName?: string
    desc?: string
  }) {
    try {
      loading.value = true
      error.value = null

      await batataApi.publishConfig(data)
      return true
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('publishConfigFailed')
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteNamespace(namespaceId: string) {
    try {
      loading.value = true
      error.value = null

      await batataApi.deleteNamespace(namespaceId)
      return true
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('deleteNamespaceFailed')
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createNamespace(data: {
    namespaceId?: string
    namespaceName: string
    namespaceDesc?: string
  }) {
    try {
      loading.value = true
      error.value = null

      await batataApi.createNamespace(data)
      return true
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('createNamespaceFailed')
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    loading,
    error,
    currentUser,
    services,
    serviceTotal,
    currentService,
    configs,
    configTotal,
    currentConfig,
    namespaces,
    currentNamespace,
    clusterNodes,

    // Computed
    isAuthenticated,
    healthyServicesCount,
    totalInstancesCount,

    // Actions
    login,
    logout,
    fetchServices,
    fetchServiceDetail,
    fetchConfigs,
    fetchConfigContent,
    fetchNamespaces,
    fetchClusterNodes,
    deleteService,
    createService,
    deleteConfig,
    publishConfig,
    deleteNamespace,
    createNamespace,
    clearError,
  }
})
