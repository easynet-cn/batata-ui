import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  ApolloApp,
  ApolloAppPayload,
  ApolloClusterPayload,
  ApolloEnvCluster,
  ApolloNamespace,
  ApolloNamespacePayload,
  ApolloNamespaceLock,
  ApolloItem,
  ApolloItemPayload,
  ApolloRelease,
  ApolloReleasePayload,
  ApolloPageResult,
  ApolloOrganization,
  ApolloEnvironment,
  ApolloInstance,
  ApolloBranch,
  ApolloGrayReleaseRule,
  ApolloGrayReleaseRulePayload,
  ApolloGrayReleasePayload,
  ApolloCreateAppPayload,
} from '@/types/apollo'
import apolloApi from '@/api/apollo'

export const useApolloStore = defineStore('apollo', () => {
  // State
  const loading = ref(false)
  const error = ref<string | null>(null)

  const apps = ref<ApolloApp[]>([])
  const currentApp = ref<ApolloApp | null>(null)
  const envClusters = ref<ApolloEnvCluster[]>([])
  const namespaces = ref<ApolloNamespace[]>([])
  const items = ref<ApolloItem[]>([])
  const latestRelease = ref<ApolloRelease | null>(null)
  const releases = ref<ApolloPageResult<ApolloRelease> | null>(null)
  const organizations = ref<ApolloOrganization[]>([])
  const environments = ref<ApolloEnvironment[]>([])
  const instances = ref<ApolloPageResult<ApolloInstance> | null>(null)
  const namespaceLock = ref<ApolloNamespaceLock | null>(null)
  const branch = ref<ApolloBranch | null>(null)
  const grayRules = ref<ApolloGrayReleaseRule | null>(null)

  // ============================================
  // Apps Actions
  // ============================================

  async function fetchApps(appIds?: string[]) {
    try {
      loading.value = true
      error.value = null
      const response = await apolloApi.getApps(appIds)
      apps.value = response.data || []
      return apps.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch apps'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchApp(appId: string) {
    try {
      loading.value = true
      error.value = null
      const response = await apolloApi.getApp(appId)
      currentApp.value = response.data
      return currentApp.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch app'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createApp(data: ApolloAppPayload) {
    try {
      loading.value = true
      error.value = null
      const response = await apolloApi.createApp(data)
      return response.data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to create app'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createAppInEnv(env: string, data: ApolloCreateAppPayload) {
    try {
      loading.value = true
      error.value = null
      await apolloApi.createAppInEnv(env, data)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to create app in env'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateApp(appId: string, data: Partial<ApolloAppPayload>) {
    try {
      loading.value = true
      error.value = null
      await apolloApi.updateApp(appId, data)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to update app'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteApp(appId: string) {
    try {
      loading.value = true
      error.value = null
      await apolloApi.deleteApp(appId)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to delete app'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // Organizations & Environments
  // ============================================

  async function fetchOrganizations() {
    try {
      loading.value = true
      error.value = null
      const response = await apolloApi.getOrganizations()
      organizations.value = response.data || []
      return organizations.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch organizations'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchEnvironments() {
    try {
      loading.value = true
      error.value = null
      const response = await apolloApi.getEnvironments()
      environments.value = response.data || []
      return environments.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch environments'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // Env/Cluster Actions
  // ============================================

  async function fetchEnvClusters(appId: string) {
    try {
      loading.value = true
      error.value = null
      const response = await apolloApi.getEnvClusters(appId)
      envClusters.value = response.data || []
      return envClusters.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch env clusters'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createCluster(appId: string, env: string, data: ApolloClusterPayload) {
    try {
      loading.value = true
      error.value = null
      const response = await apolloApi.createCluster(appId, env, data)
      return response.data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to create cluster'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteCluster(env: string, appId: string, clusterName: string, operator: string) {
    try {
      loading.value = true
      error.value = null
      await apolloApi.deleteCluster(env, appId, clusterName, operator)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to delete cluster'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // Namespace Actions
  // ============================================

  async function fetchNamespaces(env: string, appId: string, clusterName: string) {
    try {
      loading.value = true
      error.value = null
      const response = await apolloApi.getNamespaces(env, appId, clusterName)
      namespaces.value = response.data || []
      return namespaces.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch namespaces'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createNamespace(appId: string, data: ApolloNamespacePayload) {
    try {
      loading.value = true
      error.value = null
      const response = await apolloApi.createNamespace(appId, data)
      return response.data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to create namespace'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteNamespace(
    appId: string,
    env: string,
    clusterName: string,
    namespaceName: string,
    operator: string,
  ) {
    try {
      loading.value = true
      error.value = null
      await apolloApi.deleteNamespace(appId, env, clusterName, namespaceName, operator)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to delete namespace'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchNamespaceLock(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
  ) {
    try {
      error.value = null
      const response = await apolloApi.getNamespaceLock(env, appId, clusterName, namespaceName)
      namespaceLock.value = response.data
      return namespaceLock.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch namespace lock'
      throw err
    }
  }

  // ============================================
  // Items Actions
  // ============================================

  async function fetchItems(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
  ) {
    try {
      loading.value = true
      error.value = null
      const response = await apolloApi.getItems(env, appId, clusterName, namespaceName)
      items.value = response.data || []
      return items.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch items'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createItem(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    data: ApolloItemPayload,
  ) {
    try {
      loading.value = true
      error.value = null
      const response = await apolloApi.createItem(env, appId, clusterName, namespaceName, data)
      return response.data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to create item'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateItem(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    key: string,
    data: ApolloItemPayload,
  ) {
    try {
      loading.value = true
      error.value = null
      await apolloApi.updateItem(env, appId, clusterName, namespaceName, key, data)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to update item'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteItem(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    key: string,
    operator: string,
  ) {
    try {
      loading.value = true
      error.value = null
      await apolloApi.deleteItem(env, appId, clusterName, namespaceName, key, operator)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to delete item'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // Release Actions
  // ============================================

  async function fetchReleases(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    page: number = 0,
    size: number = 20,
  ) {
    try {
      loading.value = true
      error.value = null
      const response = await apolloApi.getReleases(
        env,
        appId,
        clusterName,
        namespaceName,
        page,
        size,
      )
      releases.value = response.data
      return releases.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch releases'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchLatestRelease(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
  ) {
    try {
      loading.value = true
      error.value = null
      const response = await apolloApi.getLatestRelease(env, appId, clusterName, namespaceName)
      latestRelease.value = response.data
      return latestRelease.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch latest release'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createRelease(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    data: ApolloReleasePayload,
  ) {
    try {
      loading.value = true
      error.value = null
      const response = await apolloApi.createRelease(env, appId, clusterName, namespaceName, data)
      return response.data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to create release'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function rollbackRelease(env: string, releaseId: number, operator: string) {
    try {
      loading.value = true
      error.value = null
      await apolloApi.rollbackRelease(env, releaseId, operator)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to rollback release'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // Gray Release / Branch Actions
  // ============================================

  async function fetchBranch(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
  ) {
    try {
      error.value = null
      const response = await apolloApi.getBranch(env, appId, clusterName, namespaceName)
      branch.value = response.data
      return branch.value
    } catch {
      // Branch may not exist, that's OK
      branch.value = null
      return null
    }
  }

  async function createBranch(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    operator: string,
  ) {
    try {
      loading.value = true
      error.value = null
      const response = await apolloApi.createBranch(
        env,
        appId,
        clusterName,
        namespaceName,
        operator,
      )
      branch.value = response.data
      return branch.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to create branch'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteBranch(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    branchName: string,
    operator: string,
  ) {
    try {
      loading.value = true
      error.value = null
      await apolloApi.deleteBranch(env, appId, clusterName, namespaceName, branchName, operator)
      branch.value = null
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to delete branch'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchGrayRules(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    branchName: string,
  ) {
    try {
      error.value = null
      const response = await apolloApi.getBranchGrayRules(
        env,
        appId,
        clusterName,
        namespaceName,
        branchName,
      )
      grayRules.value = response.data
      return grayRules.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch gray rules'
      throw err
    }
  }

  async function updateGrayRules(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    branchName: string,
    data: ApolloGrayReleaseRulePayload,
  ) {
    try {
      loading.value = true
      error.value = null
      await apolloApi.updateBranchGrayRules(
        env,
        appId,
        clusterName,
        namespaceName,
        branchName,
        data,
      )
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to update gray rules'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createGrayRelease(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    branchName: string,
    data: ApolloGrayReleasePayload,
  ) {
    try {
      loading.value = true
      error.value = null
      const response = await apolloApi.createGrayRelease(
        env,
        appId,
        clusterName,
        namespaceName,
        branchName,
        data,
      )
      return response.data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to create gray release'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function mergeGrayRelease(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    branchName: string,
    data: ApolloReleasePayload,
  ) {
    try {
      loading.value = true
      error.value = null
      const response = await apolloApi.mergeGrayRelease(
        env,
        appId,
        clusterName,
        namespaceName,
        branchName,
        data,
      )
      return response.data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to merge gray release'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // Instances Actions
  // ============================================

  async function fetchInstances(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
  ) {
    try {
      loading.value = true
      error.value = null
      const response = await apolloApi.getInstances(env, appId, clusterName, namespaceName)
      instances.value = response.data
      return instances.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch instances'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // Utility
  // ============================================

  function clearError() {
    error.value = null
  }

  function $reset() {
    apps.value = []
    currentApp.value = null
    envClusters.value = []
    namespaces.value = []
    items.value = []
    latestRelease.value = null
    releases.value = null
    organizations.value = []
    environments.value = []
    instances.value = null
    namespaceLock.value = null
    branch.value = null
    grayRules.value = null
    error.value = null
  }

  return {
    // State
    loading,
    error,
    apps,
    currentApp,
    envClusters,
    namespaces,
    items,
    latestRelease,
    releases,
    organizations,
    environments,
    instances,
    namespaceLock,
    branch,
    grayRules,

    // Actions
    fetchApps,
    fetchApp,
    createApp,
    createAppInEnv,
    updateApp,
    deleteApp,
    fetchOrganizations,
    fetchEnvironments,
    fetchEnvClusters,
    createCluster,
    deleteCluster,
    fetchNamespaces,
    createNamespace,
    deleteNamespace,
    fetchNamespaceLock,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    fetchReleases,
    fetchLatestRelease,
    createRelease,
    rollbackRelease,
    fetchBranch,
    createBranch,
    deleteBranch,
    fetchGrayRules,
    updateGrayRules,
    createGrayRelease,
    mergeGrayRelease,
    fetchInstances,
    clearError,
    $reset,
  }
})
