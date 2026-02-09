import axios from 'axios'
import type { AxiosInstance } from 'axios'
import { config } from '@/config'
import { storage } from '@/composables/useStorage'
import type {
  ApolloApp,
  ApolloAppPayload,
  ApolloCluster,
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

class ApolloApi {
  private instance: AxiosInstance

  constructor() {
    this.instance = axios.create({
      baseURL: config.api.apolloBaseUrl,
      timeout: config.api.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor: attach Apollo token
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
  // Apps API
  // ============================================

  async getApps(appIds?: string[]) {
    const params = appIds ? { appIds: appIds.join(',') } : undefined
    return this.instance.get<ApolloApp[]>('/apps', { params })
  }

  async getApp(appId: string) {
    return this.instance.get<ApolloApp>(`/apps/${appId}`)
  }

  async createApp(data: ApolloAppPayload) {
    return this.instance.post<ApolloApp>('/apps', data)
  }

  async createAppInEnv(env: string, data: ApolloCreateAppPayload) {
    return this.instance.post<void>(`/apps/envs/${env}`, data)
  }

  async updateApp(appId: string, data: Partial<ApolloAppPayload>) {
    return this.instance.put<void>(`/apps/${appId}`, data)
  }

  async deleteApp(appId: string) {
    return this.instance.delete<void>(`/apps/${appId}`)
  }

  async getNavTree(appId: string) {
    return this.instance.get<ApolloEnvCluster[]>(`/apps/${appId}/navtree`)
  }

  // ============================================
  // Environments API
  // ============================================

  async getEnvironments() {
    return this.instance.get<ApolloEnvironment[]>('/envs')
  }

  // ============================================
  // Organizations API
  // ============================================

  async getOrganizations() {
    return this.instance.get<ApolloOrganization[]>('/organizations')
  }

  // ============================================
  // Envs / Clusters API
  // ============================================

  async getEnvClusters(appId: string) {
    return this.instance.get<ApolloEnvCluster[]>(`/apps/${appId}/envclusters`)
  }

  async getCluster(env: string, appId: string, clusterName: string) {
    return this.instance.get<ApolloCluster>(`/envs/${env}/apps/${appId}/clusters/${clusterName}`)
  }

  async createCluster(appId: string, env: string, data: ApolloClusterPayload) {
    return this.instance.post<ApolloCluster>(`/envs/${env}/apps/${appId}/clusters`, data)
  }

  async deleteCluster(env: string, appId: string, clusterName: string, operator: string) {
    return this.instance.delete<void>(`/envs/${env}/apps/${appId}/clusters/${clusterName}`, {
      params: { operator },
    })
  }

  // ============================================
  // Namespaces API
  // ============================================

  async getNamespaces(env: string, appId: string, clusterName: string) {
    return this.instance.get<ApolloNamespace[]>(
      `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces`,
    )
  }

  async getNamespace(env: string, appId: string, clusterName: string, namespaceName: string) {
    return this.instance.get<ApolloNamespace>(
      `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}`,
    )
  }

  async createNamespace(appId: string, data: ApolloNamespacePayload) {
    return this.instance.post<ApolloNamespace>(`/apps/${appId}/appnamespaces`, data)
  }

  async deleteNamespace(
    appId: string,
    env: string,
    clusterName: string,
    namespaceName: string,
    operator: string,
  ) {
    return this.instance.delete<void>(
      `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}`,
      { params: { operator } },
    )
  }

  async getNamespaceLock(env: string, appId: string, clusterName: string, namespaceName: string) {
    return this.instance.get<ApolloNamespaceLock>(
      `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/lock`,
    )
  }

  // ============================================
  // Items API
  // ============================================

  async getItems(env: string, appId: string, clusterName: string, namespaceName: string) {
    return this.instance.get<ApolloItem[]>(
      `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/items`,
    )
  }

  async getItemsPaginated(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    page: number = 0,
    size: number = 50,
  ) {
    return this.instance.get<ApolloPageResult<ApolloItem>>(
      `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/items`,
      { params: { page, size } },
    )
  }

  async getItem(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    key: string,
  ) {
    return this.instance.get<ApolloItem>(
      `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/items/${key}`,
    )
  }

  async createItem(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    data: ApolloItemPayload,
  ) {
    return this.instance.post<ApolloItem>(
      `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/items`,
      data,
    )
  }

  async updateItem(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    key: string,
    data: ApolloItemPayload,
    createIfNotExists: boolean = false,
  ) {
    return this.instance.put<void>(
      `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/items/${key}`,
      data,
      { params: createIfNotExists ? { createIfNotExists: true } : undefined },
    )
  }

  async deleteItem(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    key: string,
    operator: string,
  ) {
    return this.instance.delete<void>(
      `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/items/${key}`,
      { params: { operator } },
    )
  }

  // ============================================
  // Releases API
  // ============================================

  async getReleases(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    page: number = 0,
    size: number = 20,
  ) {
    return this.instance.get<ApolloPageResult<ApolloRelease>>(
      `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/releases/all`,
      { params: { page, size } },
    )
  }

  async getLatestRelease(env: string, appId: string, clusterName: string, namespaceName: string) {
    return this.instance.get<ApolloRelease>(
      `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/releases/latest`,
    )
  }

  async createRelease(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    data: ApolloReleasePayload,
  ) {
    return this.instance.post<ApolloRelease>(
      `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/releases`,
      data,
    )
  }

  async rollbackRelease(env: string, releaseId: number, operator: string) {
    return this.instance.put<void>(`/envs/${env}/releases/${releaseId}/rollback`, null, {
      params: { operator },
    })
  }

  // ============================================
  // Namespace Branches (Gray Release) API
  // ============================================

  async getBranch(env: string, appId: string, clusterName: string, namespaceName: string) {
    return this.instance.get<ApolloBranch>(
      `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/branches`,
    )
  }

  async createBranch(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    operator: string,
  ) {
    return this.instance.post<ApolloBranch>(
      `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/branches`,
      null,
      { params: { operator } },
    )
  }

  async deleteBranch(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    branchName: string,
    operator: string,
  ) {
    return this.instance.delete<void>(
      `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/branches/${branchName}`,
      { params: { operator } },
    )
  }

  async getBranchGrayRules(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    branchName: string,
  ) {
    return this.instance.get<ApolloGrayReleaseRule>(
      `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/branches/${branchName}/rules`,
    )
  }

  async updateBranchGrayRules(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    branchName: string,
    data: ApolloGrayReleaseRulePayload,
  ) {
    return this.instance.put<void>(
      `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/branches/${branchName}/rules`,
      data,
    )
  }

  async createGrayRelease(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    branchName: string,
    data: ApolloGrayReleasePayload,
  ) {
    return this.instance.post<ApolloRelease>(
      `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/branches/${branchName}/releases`,
      data,
    )
  }

  async mergeGrayRelease(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    branchName: string,
    data: ApolloReleasePayload,
  ) {
    return this.instance.post<ApolloRelease>(
      `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/branches/${branchName}/merge`,
      data,
    )
  }

  // ============================================
  // Instances API
  // ============================================

  async getInstances(env: string, appId: string, clusterName: string, namespaceName: string) {
    return this.instance.get<ApolloPageResult<ApolloInstance>>(
      `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/instances`,
    )
  }
}

export default new ApolloApi()
