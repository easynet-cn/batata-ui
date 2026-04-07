import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ServiceInfo, ConfigInfo, NodeInfo } from '@/types'
import batataApi from '@/api/batata'
import { useI18n } from '@/i18n'
import { useAuthStore } from './auth'
import { useNamespaceStore } from './namespace'

export const useBatataStore = defineStore('batata', () => {
  const { t } = useI18n()
  const authStore = useAuthStore()
  const namespaceStore = useNamespaceStore()

  // Service state
  const services = ref<ServiceInfo[]>([])
  const serviceTotal = ref(0)
  const currentService = ref<ServiceInfo | null>(null)
  const serviceLoading = ref(false)

  // Config state
  const configs = ref<ConfigInfo[]>([])
  const configTotal = ref(0)
  const currentConfig = ref<ConfigInfo | null>(null)
  const configLoading = ref(false)

  // Cluster state
  const clusterNodes = ref<NodeInfo[]>([])
  const clusterLoading = ref(false)

  // Backward-compatible loading/error (delegates to auth store)
  const loading = computed(
    () => authStore.loading || serviceLoading.value || configLoading.value || clusterLoading.value,
  )
  const error = computed({
    get: () => authStore.error,
    set: (val) => {
      authStore.error = val
    },
  })

  // Backward-compatible delegates
  const currentUser = computed(() => authStore.currentUser)
  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const namespaces = computed(() => namespaceStore.namespaces)
  const currentNamespace = computed({
    get: () => namespaceStore.currentNamespace,
    set: (val) => namespaceStore.selectNamespace(val),
  })

  const healthyServicesCount = computed(
    () => services.value.filter((s) => s.healthyInstanceCount > 0).length,
  )
  const totalInstancesCount = computed(() => services.value.reduce((sum, s) => sum + s.ipCount, 0))

  // Delegate auth actions
  function restoreSession() {
    return authStore.restoreSession()
  }
  async function login(username: string, password: string) {
    return authStore.login(username, password)
  }
  async function loginWithToken(secretId: string) {
    return authStore.loginWithToken(secretId)
  }
  function logout() {
    authStore.logout()
    services.value = []
    configs.value = []
  }

  // Delegate namespace actions
  async function fetchNamespaces() {
    return namespaceStore.fetchNamespaces()
  }
  async function createNamespace(data: {
    namespaceId?: string
    namespaceName: string
    namespaceDesc?: string
  }) {
    return namespaceStore.createNamespace(data)
  }
  async function deleteNamespace(namespaceId: string) {
    return namespaceStore.deleteNamespace(namespaceId)
  }

  // Service actions (with local loading)
  async function fetchServices(params?: {
    pageNo?: number
    pageSize?: number
    groupName?: string
    serviceName?: string
    namespaceId?: string
  }) {
    serviceLoading.value = true
    try {
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
      authStore.error = message
      throw err
    } finally {
      serviceLoading.value = false
    }
  }

  async function fetchServiceDetail(serviceName: string, groupName: string, namespaceId?: string) {
    serviceLoading.value = true
    try {
      const response = await batataApi.getServiceDetail(serviceName, groupName, namespaceId)
      return response.data.data
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('fetchServiceDetailFailed')
      authStore.error = message
      throw err
    } finally {
      serviceLoading.value = false
    }
  }

  async function deleteService(serviceName: string, groupName: string, namespaceId?: string) {
    serviceLoading.value = true
    try {
      await batataApi.deleteService(serviceName, groupName, namespaceId)
      return true
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('deleteServiceFailed')
      authStore.error = message
      throw err
    } finally {
      serviceLoading.value = false
    }
  }

  async function createService(data: {
    serviceName: string
    groupName?: string
    namespaceId?: string
    protectThreshold?: number
    metadata?: Record<string, string>
  }) {
    serviceLoading.value = true
    try {
      await batataApi.createService(data)
      return true
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('createServiceFailed')
      authStore.error = message
      throw err
    } finally {
      serviceLoading.value = false
    }
  }

  // Config actions (with local loading)
  async function fetchConfigs(params?: {
    pageNo?: number
    pageSize?: number
    dataId?: string
    group?: string
    tenant?: string
  }) {
    configLoading.value = true
    try {
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
      authStore.error = message
      throw err
    } finally {
      configLoading.value = false
    }
  }

  async function fetchConfigContent(dataId: string, group: string, tenant?: string) {
    configLoading.value = true
    try {
      const response = await batataApi.getConfig(dataId, group, tenant)
      return response.data.data
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('fetchConfigContentFailed')
      authStore.error = message
      throw err
    } finally {
      configLoading.value = false
    }
  }

  async function deleteConfig(dataId: string, group: string, namespaceId?: string) {
    configLoading.value = true
    try {
      await batataApi.deleteConfig(dataId, group, namespaceId)
      return true
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('deleteConfigFailed')
      authStore.error = message
      throw err
    } finally {
      configLoading.value = false
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
    configTags?: string
  }) {
    configLoading.value = true
    try {
      await batataApi.publishConfig(data)
      return true
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('publishConfigFailed')
      authStore.error = message
      throw err
    } finally {
      configLoading.value = false
    }
  }

  // Cluster actions (with local loading)
  async function fetchClusterNodes() {
    clusterLoading.value = true
    try {
      const response = await batataApi.getClusterNodes()
      clusterNodes.value = response.data.data
      return response.data.data
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('fetchClusterNodesFailed')
      authStore.error = message
      throw err
    } finally {
      clusterLoading.value = false
    }
  }

  function clearError() {
    authStore.clearError()
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
    restoreSession,
    login,
    loginWithToken,
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
