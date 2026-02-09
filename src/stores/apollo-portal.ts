import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  ApolloUser,
  ApolloUserPayload,
  ApolloAppRoleUsers,
  ApolloRoleType,
  ApolloConsumer,
  ApolloConsumerPayload,
  ApolloConsumerRole,
  ApolloFavorite,
  ApolloFavoritePayload,
  ApolloSystemInfo,
  ApolloHealthCheck,
  ApolloServerConfig,
  ApolloServerConfigPayload,
  ApolloItemDiff,
  ApolloSyntaxCheckResult,
  ApolloAccessKey,
  ApolloApp,
  ApolloPageResult,
} from '@/types/apollo'
import apolloPortalApi from '@/api/apollo-portal'

export const useApolloPortalStore = defineStore('apollo-portal', () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  // State
  const users = ref<ApolloUser[]>([])
  const appRoleUsers = ref<ApolloAppRoleUsers | null>(null)
  const consumers = ref<ApolloPageResult<ApolloConsumer> | null>(null)
  const accessKeys = ref<ApolloAccessKey[]>([])
  const favorites = ref<ApolloFavorite[]>([])
  const systemInfo = ref<ApolloSystemInfo | null>(null)
  const healthCheck = ref<ApolloHealthCheck | null>(null)
  const portalConfigs = ref<ApolloServerConfig[]>([])
  const envConfigs = ref<ApolloServerConfig[]>([])
  const itemDiffs = ref<ApolloItemDiff[]>([])
  const syntaxResult = ref<ApolloSyntaxCheckResult | null>(null)
  const searchResults = ref<ApolloPageResult<ApolloApp> | null>(null)

  // ============================================
  // Users
  // ============================================

  async function fetchUsers(keyword?: string, includeInactive?: boolean) {
    try {
      loading.value = true
      error.value = null
      const response = await apolloPortalApi.getUsers(keyword, includeInactive)
      users.value = response.data || []
      return users.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch users'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createUser(data: ApolloUserPayload) {
    try {
      loading.value = true
      error.value = null
      const response = await apolloPortalApi.createUser(data)
      return response.data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to create user'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function setUserEnabled(userId: string, enabled: boolean) {
    try {
      loading.value = true
      error.value = null
      await apolloPortalApi.setUserEnabled(userId, enabled)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to update user status'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // Permissions
  // ============================================

  async function fetchAppRoleUsers(appId: string) {
    try {
      loading.value = true
      error.value = null
      const response = await apolloPortalApi.getAppRoleUsers(appId)
      appRoleUsers.value = response.data
      return appRoleUsers.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch role users'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function assignAppRole(appId: string, userId: string, roleType: ApolloRoleType) {
    try {
      loading.value = true
      error.value = null
      await apolloPortalApi.assignAppRole(appId, userId, roleType)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to assign role'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function removeAppRole(appId: string, userId: string, roleType: ApolloRoleType) {
    try {
      loading.value = true
      error.value = null
      await apolloPortalApi.removeAppRole(appId, userId, roleType)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to remove role'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // Consumers
  // ============================================

  async function fetchConsumers(page: number = 0, size: number = 20) {
    try {
      loading.value = true
      error.value = null
      const response = await apolloPortalApi.getConsumers(page, size)
      consumers.value = response.data
      return consumers.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch consumers'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createConsumer(data: ApolloConsumerPayload) {
    try {
      loading.value = true
      error.value = null
      const response = await apolloPortalApi.createConsumer(data)
      return response.data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to create consumer'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function getConsumerToken(consumerId: number) {
    try {
      error.value = null
      const response = await apolloPortalApi.getConsumerToken(consumerId)
      return response.data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to get consumer token'
      throw err
    }
  }

  async function assignConsumerRole(consumerId: number, data: ApolloConsumerRole) {
    try {
      loading.value = true
      error.value = null
      await apolloPortalApi.assignConsumerRole(consumerId, data)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to assign consumer role'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteConsumer(consumerId: number) {
    try {
      loading.value = true
      error.value = null
      await apolloPortalApi.deleteConsumer(consumerId)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to delete consumer'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // Access Keys
  // ============================================

  async function fetchAccessKeys(appId: string, env: string) {
    try {
      loading.value = true
      error.value = null
      const response = await apolloPortalApi.getAccessKeys(appId, env)
      accessKeys.value = response.data || []
      return accessKeys.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch access keys'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createAccessKey(appId: string, env: string) {
    try {
      loading.value = true
      error.value = null
      const response = await apolloPortalApi.createAccessKey(appId, env)
      return response.data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to create access key'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteAccessKey(appId: string, env: string, keyId: number) {
    try {
      loading.value = true
      error.value = null
      await apolloPortalApi.deleteAccessKey(appId, env, keyId)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to delete access key'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function enableAccessKey(appId: string, env: string, keyId: number) {
    try {
      loading.value = true
      error.value = null
      await apolloPortalApi.enableAccessKey(appId, env, keyId)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to enable access key'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function disableAccessKey(appId: string, env: string, keyId: number) {
    try {
      loading.value = true
      error.value = null
      await apolloPortalApi.disableAccessKey(appId, env, keyId)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to disable access key'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // Import / Export
  // ============================================

  async function exportConfig(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
  ) {
    try {
      loading.value = true
      error.value = null
      const response = await apolloPortalApi.exportConfig(env, appId, clusterName, namespaceName)
      return response.data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to export config'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function importConfig(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    file: File,
  ) {
    try {
      loading.value = true
      error.value = null
      await apolloPortalApi.importConfig(env, appId, clusterName, namespaceName, file)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to import config'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // Sync
  // ============================================

  async function diffNamespaceItems(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    targetEnv: string,
    targetCluster: string,
    targetNamespace: string,
  ) {
    try {
      loading.value = true
      error.value = null
      const response = await apolloPortalApi.diffNamespaceItems(
        env,
        appId,
        clusterName,
        namespaceName,
        targetEnv,
        targetCluster,
        targetNamespace,
      )
      itemDiffs.value = response.data || []
      return itemDiffs.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to diff namespace items'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function syncNamespaceItems(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    targetEnv: string,
    targetCluster: string,
    targetNamespace: string,
    syncKeys: string[],
  ) {
    try {
      loading.value = true
      error.value = null
      await apolloPortalApi.syncNamespaceItems(
        env,
        appId,
        clusterName,
        namespaceName,
        targetEnv,
        targetCluster,
        targetNamespace,
        syncKeys,
      )
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to sync namespace items'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // Syntax Check / Revoke
  // ============================================

  async function checkSyntax(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
  ) {
    try {
      loading.value = true
      error.value = null
      const response = await apolloPortalApi.syntaxCheck(env, appId, clusterName, namespaceName)
      syntaxResult.value = response.data
      return syntaxResult.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to check syntax'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function revokeItems(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
  ) {
    try {
      loading.value = true
      error.value = null
      await apolloPortalApi.revokeItems(env, appId, clusterName, namespaceName)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to revoke items'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // Search
  // ============================================

  async function searchApps(keyword: string, page: number = 0, size: number = 20) {
    try {
      loading.value = true
      error.value = null
      const response = await apolloPortalApi.searchApps(keyword, page, size)
      searchResults.value = response.data
      return searchResults.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to search apps'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // Favorites
  // ============================================

  async function fetchFavorites(userId: string) {
    try {
      error.value = null
      const response = await apolloPortalApi.getFavorites(userId)
      favorites.value = response.data || []
      return favorites.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch favorites'
      throw err
    }
  }

  async function addFavorite(data: ApolloFavoritePayload) {
    try {
      error.value = null
      const response = await apolloPortalApi.addFavorite(data)
      return response.data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to add favorite'
      throw err
    }
  }

  async function removeFavorite(favoriteId: number) {
    try {
      error.value = null
      await apolloPortalApi.removeFavorite(favoriteId)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to remove favorite'
      throw err
    }
  }

  // ============================================
  // System Info
  // ============================================

  async function fetchSystemInfo() {
    try {
      loading.value = true
      error.value = null
      const response = await apolloPortalApi.getSystemInfo()
      systemInfo.value = response.data
      return systemInfo.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch system info'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function checkInstanceHealth(instanceId?: string) {
    try {
      loading.value = true
      error.value = null
      const response = await apolloPortalApi.getInstanceHealth(instanceId)
      healthCheck.value = response.data
      return healthCheck.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to check instance health'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // Server Config
  // ============================================

  async function fetchPortalConfigs() {
    try {
      loading.value = true
      error.value = null
      const response = await apolloPortalApi.getPortalConfigs()
      portalConfigs.value = response.data || []
      return portalConfigs.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch portal configs'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function savePortalConfig(data: ApolloServerConfigPayload) {
    try {
      loading.value = true
      error.value = null
      await apolloPortalApi.savePortalConfig(data)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to save portal config'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchEnvConfigs(env: string) {
    try {
      loading.value = true
      error.value = null
      const response = await apolloPortalApi.getEnvConfigs(env)
      envConfigs.value = response.data || []
      return envConfigs.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch env configs'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function saveEnvConfig(env: string, data: ApolloServerConfigPayload) {
    try {
      loading.value = true
      error.value = null
      await apolloPortalApi.saveEnvConfig(env, data)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to save env config'
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
    users.value = []
    appRoleUsers.value = null
    consumers.value = null
    accessKeys.value = []
    favorites.value = []
    systemInfo.value = null
    healthCheck.value = null
    portalConfigs.value = []
    envConfigs.value = []
    itemDiffs.value = []
    syntaxResult.value = null
    searchResults.value = null
    error.value = null
  }

  return {
    // State
    loading,
    error,
    users,
    appRoleUsers,
    consumers,
    accessKeys,
    favorites,
    systemInfo,
    healthCheck,
    portalConfigs,
    envConfigs,
    itemDiffs,
    syntaxResult,
    searchResults,

    // Actions
    fetchUsers,
    createUser,
    setUserEnabled,
    fetchAppRoleUsers,
    assignAppRole,
    removeAppRole,
    fetchConsumers,
    createConsumer,
    getConsumerToken,
    assignConsumerRole,
    deleteConsumer,
    fetchAccessKeys,
    createAccessKey,
    deleteAccessKey,
    enableAccessKey,
    disableAccessKey,
    exportConfig,
    importConfig,
    diffNamespaceItems,
    syncNamespaceItems,
    checkSyntax,
    revokeItems,
    searchApps,
    fetchFavorites,
    addFavorite,
    removeFavorite,
    fetchSystemInfo,
    checkInstanceHealth,
    fetchPortalConfigs,
    savePortalConfig,
    fetchEnvConfigs,
    saveEnvConfig,
    clearError,
    $reset,
  }
})
