import axios from 'axios'
import type { AxiosInstance } from 'axios'
import { config } from '@/config'
import { storage } from '@/composables/useStorage'
import type {
  ApolloUser,
  ApolloUserPayload,
  ApolloAppRoleUsers,
  ApolloRoleType,
  ApolloConsumer,
  ApolloConsumerPayload,
  ApolloConsumerToken,
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

class ApolloPortalApi {
  private instance: AxiosInstance

  constructor() {
    this.instance = axios.create({
      baseURL: config.api.apolloPortalBaseUrl,
      timeout: config.api.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.instance.interceptors.request.use(
      (reqConfig) => {
        const token = storage.get('apollo-token')
        if (token) {
          reqConfig.headers['Authorization'] = token
        }
        return reqConfig
      },
      (error) => Promise.reject(error),
    )
  }

  // ============================================
  // Users API
  // ============================================

  async getUsers(keyword?: string, includeInactive?: boolean) {
    return this.instance.get<ApolloUser[]>('/users', {
      params: { keyword, includeInactive },
    })
  }

  async getUser(userId: string) {
    return this.instance.get<ApolloUser>(`/users/${userId}`)
  }

  async createUser(data: ApolloUserPayload) {
    return this.instance.post<ApolloUser>('/users', data)
  }

  async setUserEnabled(userId: string, enabled: boolean) {
    return this.instance.put<void>(`/users/${userId}/enabled`, null, {
      params: { enabled },
    })
  }

  async getCurrentUser() {
    return this.instance.get<ApolloUser>('/user')
  }

  // ============================================
  // Permissions API
  // ============================================

  async getAppRoleUsers(appId: string) {
    return this.instance.get<ApolloAppRoleUsers>(`/apps/${appId}/role_users`)
  }

  async assignAppRole(appId: string, userId: string, roleType: ApolloRoleType) {
    return this.instance.post<void>(`/apps/${appId}/role_users`, null, {
      params: { userId, roleType },
    })
  }

  async removeAppRole(appId: string, userId: string, roleType: ApolloRoleType) {
    return this.instance.delete<void>(`/apps/${appId}/role_users`, {
      params: { userId, roleType },
    })
  }

  async getNamespaceRoleUsers(
    appId: string,
    env: string,
    clusterName: string,
    namespaceName: string,
  ) {
    return this.instance.get<ApolloAppRoleUsers>(
      `/apps/${appId}/envs/${env}/clusters/${clusterName}/namespaces/${namespaceName}/role_users`,
    )
  }

  async assignNamespaceRole(
    appId: string,
    env: string,
    clusterName: string,
    namespaceName: string,
    userId: string,
    roleType: ApolloRoleType,
  ) {
    return this.instance.post<void>(
      `/apps/${appId}/envs/${env}/clusters/${clusterName}/namespaces/${namespaceName}/role_users`,
      null,
      { params: { userId, roleType } },
    )
  }

  async removeNamespaceRole(
    appId: string,
    env: string,
    clusterName: string,
    namespaceName: string,
    userId: string,
    roleType: ApolloRoleType,
  ) {
    return this.instance.delete<void>(
      `/apps/${appId}/envs/${env}/clusters/${clusterName}/namespaces/${namespaceName}/role_users`,
      { params: { userId, roleType } },
    )
  }

  // ============================================
  // Consumers API
  // ============================================

  async getConsumers(page: number = 0, size: number = 20) {
    return this.instance.get<ApolloPageResult<ApolloConsumer>>('/consumers', {
      params: { page, size },
    })
  }

  async createConsumer(data: ApolloConsumerPayload) {
    return this.instance.post<ApolloConsumer>('/consumers', data)
  }

  async getConsumerToken(consumerId: number) {
    return this.instance.get<ApolloConsumerToken>(`/consumers/${consumerId}/token`)
  }

  async assignConsumerRole(consumerId: number, data: ApolloConsumerRole) {
    return this.instance.post<void>(`/consumers/${consumerId}/assign-role`, data)
  }

  async deleteConsumer(consumerId: number) {
    return this.instance.delete<void>(`/consumers/${consumerId}`)
  }

  // ============================================
  // Access Keys API
  // ============================================

  async getAccessKeys(appId: string, env: string) {
    return this.instance.get<ApolloAccessKey[]>(`/apps/${appId}/envs/${env}/accesskeys`)
  }

  async createAccessKey(appId: string, env: string) {
    return this.instance.post<ApolloAccessKey>(`/apps/${appId}/envs/${env}/accesskeys`)
  }

  async deleteAccessKey(appId: string, env: string, keyId: number) {
    return this.instance.delete<void>(`/apps/${appId}/envs/${env}/accesskeys/${keyId}`)
  }

  async enableAccessKey(appId: string, env: string, keyId: number) {
    return this.instance.put<void>(`/apps/${appId}/envs/${env}/accesskeys/${keyId}/enable`)
  }

  async disableAccessKey(appId: string, env: string, keyId: number) {
    return this.instance.put<void>(`/apps/${appId}/envs/${env}/accesskeys/${keyId}/disable`)
  }

  // ============================================
  // Import / Export API
  // ============================================

  async exportConfig(env: string, appId: string, clusterName: string, namespaceName: string) {
    return this.instance.get<Blob>(
      `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/items/export`,
      { responseType: 'blob' },
    )
  }

  async importConfig(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    file: File,
  ) {
    const formData = new FormData()
    formData.append('file', file)
    return this.instance.post<void>(
      `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/items/import`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
  }

  // ============================================
  // Sync API
  // ============================================

  async diffNamespaceItems(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    targetEnv: string,
    targetCluster: string,
    targetNamespace: string,
  ) {
    return this.instance.get<ApolloItemDiff[]>(
      `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/diff`,
      { params: { targetEnv, targetCluster, targetNamespace } },
    )
  }

  async syncNamespaceItems(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    targetEnv: string,
    targetCluster: string,
    targetNamespace: string,
    syncKeys: string[],
  ) {
    return this.instance.post<void>(
      `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/sync`,
      { targetEnv, targetCluster, targetNamespace, syncKeys },
    )
  }

  // ============================================
  // Syntax Check / Revoke API
  // ============================================

  async syntaxCheck(env: string, appId: string, clusterName: string, namespaceName: string) {
    return this.instance.post<ApolloSyntaxCheckResult>(
      `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/syntax-check`,
    )
  }

  async revokeItems(env: string, appId: string, clusterName: string, namespaceName: string) {
    return this.instance.put<void>(
      `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/items/revoke`,
    )
  }

  // ============================================
  // Search API
  // ============================================

  async searchApps(keyword: string, page: number = 0, size: number = 20) {
    return this.instance.get<ApolloPageResult<ApolloApp>>('/apps/search', {
      params: { keyword, page, size },
    })
  }

  // ============================================
  // Favorites API
  // ============================================

  async getFavorites(userId: string) {
    return this.instance.get<ApolloFavorite[]>('/favorites', {
      params: { userId },
    })
  }

  async addFavorite(data: ApolloFavoritePayload) {
    return this.instance.post<ApolloFavorite>('/favorites', data)
  }

  async removeFavorite(favoriteId: number) {
    return this.instance.delete<void>(`/favorites/${favoriteId}`)
  }

  // ============================================
  // System Info API
  // ============================================

  async getSystemInfo() {
    return this.instance.get<ApolloSystemInfo>('/system-info')
  }

  async getInstanceHealth(instanceId?: string) {
    return this.instance.get<ApolloHealthCheck>('/health', {
      params: instanceId ? { instanceId } : undefined,
    })
  }

  // ============================================
  // Server Config API
  // ============================================

  async getPortalConfigs() {
    return this.instance.get<ApolloServerConfig[]>('/server/config/portal-db')
  }

  async savePortalConfig(data: ApolloServerConfigPayload) {
    return this.instance.post<void>('/server/config/portal-db', data)
  }

  async getEnvConfigs(env: string) {
    return this.instance.get<ApolloServerConfig[]>(`/server/config/${env}`)
  }

  async saveEnvConfig(env: string, data: ApolloServerConfigPayload) {
    return this.instance.post<void>(`/server/config/${env}`, data)
  }
}

export default new ApolloPortalApi()
