import axios from 'axios'
import type { AxiosInstance } from 'axios'
import { config } from '@/config'
import { storage } from '@/composables/useStorage'
import { clearProviderTokenOnExpired } from '@/api/client'
import type {
  ApolloAppDTO,
  ApolloAppNamespaceDTO,
  ApolloClusterDTO,
  ApolloItemDTO,
  ApolloOpenNamespace,
  ApolloOpenRelease,
  ApolloReleaseHistoryDTO,
  ApolloGrayReleaseRuleDTO,
  ApolloAccessKeyDTO,
  ApolloAuditDTO,
  ApolloInstanceDTO,
  ApolloEnvCluster,
  ApolloPage,
  ApolloCommitDTO,
  ApolloConsumerDTO,
  ApolloFavoriteDTO,
  ApolloSearchResultDTO,
  ApolloMissingNamespaceDTO,
  ApolloCompareResultDTO,
  ApolloItemChangeDTO,
} from '@/types/apollo'

const operator = (op?: string) => (op ? { operator: op } : undefined)

// ---------------- P3 DTOs (aligned with apollo-portal) ----------------
export interface ApolloUserDTO {
  userId: string
  name?: string
  email?: string
  enabled?: boolean
}
export interface ApolloUserTokenDTO {
  id: string
  userId: string
  name: string
  tokenPrefix?: string
  status?: string
  operations?: string[]
  appIds?: string[]
  envs?: string[]
  rateLimit?: number
  expires?: string
  lastUsedTime?: string
  dataChangeCreatedTime?: string
}
export interface ApolloServerConfigDTO {
  key: string
  value: string
  comment?: string
  cluster?: string
  id?: number
}
export interface ApolloSystemInfoDTO {
  apolloVersion?: string
  gitCommitId?: string
  environments?: {
    env: string
    active: boolean
    metaServerAddress?: string
    configServices?: { appName?: string; instanceId?: string; homepageUrl?: string }[]
    adminServices?: { appName?: string; instanceId?: string; homepageUrl?: string }[]
  }[]
}

class ApolloApi {
  private instance: AxiosInstance

  constructor() {
    this.instance = axios.create({
      baseURL: config.api.apolloBaseUrl,
      timeout: config.api.timeout,
      headers: { 'Content-Type': 'application/json' },
    })
    this.instance.interceptors.request.use(
      (reqConfig) => {
        const token = storage.get('apollo-token')
        if (token) reqConfig.headers['X-Apollo-Token'] = token
        return reqConfig
      },
      (error) => Promise.reject(error),
    )

    // Response interceptor: drop the local Apollo token on 401/403-expired. Apollo
    // has independent auth, so we keep the original axios error untouched for callers.
    this.instance.interceptors.response.use(
      (response) => response,
      (error) => {
        clearProviderTokenOnExpired(error?.response?.status, error?.response?.data, 'apollo-token')
        return Promise.reject(error)
      },
    )
  }

  // ---------------- Apps ----------------
  listApps(appIds?: string): Promise<ApolloAppDTO[]> {
    return this.instance
      .get('/apps', { params: appIds ? { appIds } : undefined })
      .then((r) => r.data)
  }

  getApp(appId: string): Promise<ApolloAppDTO> {
    return this.instance.get(`/apps/${appId}`).then((r) => r.data)
  }

  createApp(app: ApolloAppDTO): Promise<void> {
    return this.instance.post('/apps', { app }).then(() => undefined)
  }

  updateApp(appId: string, app: ApolloAppDTO): Promise<void> {
    return this.instance.put(`/apps/${appId}`, app).then(() => undefined)
  }

  deleteApp(appId: string, op?: string): Promise<void> {
    return this.instance.delete(`/apps/${appId}`, { params: operator(op) }).then(() => undefined)
  }

  // ---------------- App Namespaces ----------------
  listAppNamespaces(appId: string): Promise<ApolloAppNamespaceDTO[]> {
    return this.instance.get(`/apps/${appId}/appnamespaces`).then((r) => r.data)
  }

  createAppNamespace(
    appId: string,
    dto: { name: string; format?: string; isPublic?: boolean; comment?: string },
  ): Promise<ApolloAppNamespaceDTO> {
    return this.instance
      .post(`/apps/${appId}/appnamespaces`, { appId, ...dto, isPublic: dto.isPublic ?? true })
      .then((r) => r.data)
  }

  deleteAppNamespace(appId: string, name: string, op?: string): Promise<void> {
    return this.instance
      .delete(`/apps/${appId}/appnamespaces/${name}`, { params: operator(op) })
      .then(() => undefined)
  }

  // ---------------- Env / Clusters ----------------
  getEnvClusters(appId: string): Promise<ApolloEnvCluster[]> {
    return this.instance.get(`/apps/${appId}/envclusters`).then((r) => r.data)
  }

  listEnvs(): Promise<string[]> {
    return this.instance.get('/envs').then((r) => r.data)
  }

  createCluster(
    env: string,
    appId: string,
    dto: { name: string; comment?: string },
  ): Promise<ApolloClusterDTO> {
    return this.instance
      .post(`/envs/${env}/apps/${appId}/clusters`, { name: dto.name, appId, comment: dto.comment })
      .then((r) => r.data)
  }

  getCluster(env: string, appId: string, clusterName: string): Promise<ApolloClusterDTO> {
    return this.instance
      .get(`/envs/${env}/apps/${appId}/clusters/${clusterName}`)
      .then((r) => r.data)
  }

  deleteCluster(env: string, appId: string, clusterName: string, op?: string): Promise<void> {
    return this.instance
      .delete(`/envs/${env}/apps/${appId}/clusters/${clusterName}`, { params: operator(op) })
      .then(() => undefined)
  }

  // ---------------- Namespaces ----------------
  listNamespaces(env: string, appId: string, clusterName: string): Promise<ApolloOpenNamespace[]> {
    return this.instance
      .get(`/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces`)
      .then((r) => r.data)
  }

  getNamespace(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
  ): Promise<ApolloOpenNamespace> {
    return this.instance
      .get(`/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}`)
      .then((r) => r.data)
  }

  createNamespace(
    env: string,
    appId: string,
    clusterName: string,
    dto: { name: string; format?: string; isPublic?: boolean; comment?: string },
  ): Promise<ApolloOpenNamespace> {
    return this.instance
      .post(`/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces`, {
        appId,
        ...dto,
        isPublic: dto.isPublic ?? true,
      })
      .then((r) => r.data)
  }

  deleteNamespace(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    op?: string,
  ): Promise<void> {
    return this.instance
      .delete(`/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}`, {
        params: operator(op),
      })
      .then(() => undefined)
  }

  // ---------------- Namespace lock (apollo-native read-only protection) ----------------
  lockNamespace(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    comment?: string,
    op?: string,
  ): Promise<void> {
    return this.instance
      .put(`/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/lock`, {
        operator: op || 'admin',
        namespaceName,
        lockedComment: comment || '',
      })
      .then(() => undefined)
  }

  unlockNamespace(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    op?: string,
  ): Promise<void> {
    return this.instance
      .delete(
        `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/lock`,
        { params: operator(op) },
      )
      .then(() => undefined)
  }

  // ---------------- Associate public namespace (apollo-native) ----------------
  associateNamespace(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    publicAppId: string,
    publicNamespaceName: string,
    op?: string,
  ): Promise<void> {
    return this.instance
      .post(
        `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/associate`,
        {
          namespaceName,
          publicAppId,
          publicNamespaceName,
          operator: op || 'admin',
        },
      )
      .then(() => undefined)
  }

  // ---------------- Items ----------------
  listItems(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    page = 0,
    size = 50,
    branchName?: string,
  ): Promise<ApolloPage<ApolloItemDTO>> {
    return this.instance
      .get(`/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/items`, {
        params: { page, size, ...(branchName ? { branchName } : {}) },
      })
      .then((r) => r.data)
  }

  getItem(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    key: string,
    branchName?: string,
  ): Promise<ApolloItemDTO> {
    return this.instance
      .get(
        `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/items/${key}`,
        { params: branchName ? { branchName } : undefined },
      )
      .then((r) => r.data)
  }

  createItem(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    dto: { key: string; value: string; comment?: string; type?: number },
    branchName?: string,
  ): Promise<ApolloItemDTO> {
    return this.instance
      .post(
        `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/items`,
        dto,
        { params: branchName ? { branchName } : undefined },
      )
      .then((r) => r.data)
  }

  updateItem(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    key: string,
    dto: { key: string; value: string; comment?: string; type?: number },
    branchName?: string,
  ): Promise<ApolloItemDTO> {
    return this.instance
      .put(
        `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/items/${key}`,
        dto,
        { params: branchName ? { branchName } : undefined },
      )
      .then((r) => r.data)
  }

  deleteItem(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    key: string,
    op?: string,
    branchName?: string,
  ): Promise<void> {
    return this.instance
      .delete(
        `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/items/${key}`,
        { params: { ...operator(op), ...(branchName ? { branchName } : {}) } },
      )
      .then(() => undefined)
  }

  // ---------------- Item-key history (apollo-native per-key change history) ----------------
  getItemHistory(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    key: string,
    branchName?: string,
  ): Promise<ApolloCommitDTO[]> {
    return this.instance
      .get(
        `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/items/${key}/commit`,
        { params: branchName ? { branchName } : undefined },
      )
      .then((r) => r.data)
  }

  // ---------------- Releases ----------------
  publishRelease(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    dto: {
      releaseTitle: string
      releaseComment?: string
      releasedBy: string
      isEmergencyPublish?: boolean
    },
  ): Promise<ApolloOpenRelease> {
    return this.instance
      .post(
        `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/releases`,
        dto,
      )
      .then((r) => r.data)
  }

  listReleases(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    page = 0,
    size = 10,
  ): Promise<ApolloPage<ApolloOpenRelease>> {
    return this.instance
      .get(
        `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/releases`,
        { params: { page, size } },
      )
      .then((r) => r.data)
  }

  getLatestRelease(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
  ): Promise<ApolloOpenRelease | null> {
    return this.instance
      .get(
        `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/releases/latest`,
      )
      .then((r) => r.data)
  }

  rollbackRelease(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    releaseId: number,
    op?: string,
  ): Promise<ApolloOpenRelease> {
    return this.instance
      .post(
        `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/releases/${releaseId}/rollback`,
        null,
        { params: operator(op) },
      )
      .then((r) => r.data)
  }

  releaseHistory(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    page = 0,
    size = 50,
  ): Promise<ApolloPage<ApolloReleaseHistoryDTO>> {
    return this.instance
      .get(
        `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/releases/history`,
        { params: { page, size } },
      )
      .then((r) => r.data)
  }

  // ---------------- Gray / Branch releases ----------------
  listBranches(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
  ): Promise<ApolloGrayReleaseRuleDTO[]> {
    return this.instance
      .get(
        `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/branches`,
      )
      .then((r) => r.data)
  }

  createBranch(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    branchName = 'gray',
    op = 'admin',
  ): Promise<ApolloGrayReleaseRuleDTO> {
    return this.instance
      .post(
        `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/branches`,
        { branchName, operator: op },
      )
      .then((r) => r.data)
  }

  deleteBranch(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    branchName: string,
    op?: string,
  ): Promise<void> {
    return this.instance
      .delete(
        `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/branches/${branchName}`,
        { params: operator(op) },
      )
      .then(() => undefined)
  }

  mergeBranch(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    branchName: string,
    dto: {
      releaseTitle: string
      releaseComment?: string
      releasedBy: string
      isEmergencyPublish?: boolean
      createItems?: ApolloItemDTO[]
      updateItems?: ApolloItemDTO[]
      deleteItems?: ApolloItemDTO[]
    },
  ): Promise<ApolloOpenRelease> {
    return this.instance
      .post(
        `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/branches/${branchName}/merge`,
        dto,
      )
      .then((r) => r.data)
  }

  // ---------------- Access Keys ----------------
  listAccessKeys(appId: string): Promise<ApolloAccessKeyDTO[]> {
    return this.instance.get(`/apps/${appId}/accesskeys`).then((r) => r.data)
  }

  createAccessKey(appId: string, createdBy = 'admin'): Promise<ApolloAccessKeyDTO> {
    return this.instance.post(`/apps/${appId}/accesskeys`, { createdBy }).then((r) => r.data)
  }

  deleteAccessKey(appId: string, id: number, op?: string): Promise<void> {
    return this.instance
      .delete(`/apps/${appId}/accesskeys/${id}`, { params: operator(op) })
      .then(() => undefined)
  }

  setAccessKeyEnabled(
    appId: string,
    env: string,
    id: number,
    enabled: boolean,
    op?: string,
  ): Promise<void> {
    const path = enabled ? 'activation' : 'deactivation'
    return this.instance
      .put(`/apps/${appId}/envs/${env}/accesskeys/${id}/${path}`, null, {
        params: operator(op),
      })
      .then(() => undefined)
  }

  // ---------------- Permissions (roles) ----------------
  // Apollo role-based access control: AppRole (Master), NamespaceRole
  // (ModifyNamespace / ReleaseNamespace) and ClusterNamespaceRole
  // (ModifyNamespacesInCluster / ReleaseNamespacesInCluster).
  // Grant sends the userId as a raw JSON string body; revoke uses the
  // `user` query param — matching apollo-portal's PermissionController.
  assignRole(
    appId: string,
    roleType: string,
    userId: string,
    opts?: { env?: string; cluster?: string; namespace?: string },
  ): Promise<void> {
    return this.instance
      .post(this.rolePath(appId, roleType, opts), JSON.stringify(userId))
      .then(() => undefined)
  }

  revokeRole(
    appId: string,
    roleType: string,
    userId: string,
    opts?: { env?: string; cluster?: string; namespace?: string },
  ): Promise<void> {
    return this.instance
      .delete(this.rolePath(appId, roleType, opts), { params: { user: userId } })
      .then(() => undefined)
  }

  listRoleUsers(
    appId: string,
    roleType: string,
    opts?: { env?: string; cluster?: string; namespace?: string },
  ): Promise<ApolloRoleUserDTO[]> {
    return this.instance.get(this.rolePath(appId, roleType, opts)).then((r) => r.data)
  }

  private rolePath(
    appId: string,
    roleType: string,
    opts?: { env?: string; cluster?: string; namespace?: string },
  ): string {
    const o = opts || {}
    if (o.cluster) {
      return `/apps/${appId}/envs/${o.env}/clusters/${o.cluster}/ns_roles/${roleType}`
    }
    if (o.namespace) {
      return o.env
        ? `/apps/${appId}/envs/${o.env}/namespaces/${o.namespace}/roles/${roleType}`
        : `/apps/${appId}/namespaces/${o.namespace}/roles/${roleType}`
    }
    return `/apps/${appId}/roles/${roleType}`
  }

  // ---------------- Audit ----------------
  listAudit(page = 0, size = 20): Promise<ApolloPage<ApolloAuditDTO>> {
    return this.instance.get('/apollo/audit', { params: { page, size } }).then((r) => r.data)
  }

  // ---------------- Instances ----------------
  listInstances(env: string, appId: string, clusterName: string): Promise<ApolloInstanceDTO[]> {
    return this.instance
      .get(`/envs/${env}/apps/${appId}/clusters/${clusterName}/instances`)
      .then((r) => r.data)
  }

  // Actually-loaded configurations of a single client instance (ConfigService).
  getInstanceConfigs(env: string, instanceId: number): Promise<Record<string, string>> {
    return this.instance.get(`/envs/${env}/instances/${instanceId}/configs`).then((r) => r.data)
  }

  // ---------------- Releases (extra) ----------------
  getRelease(env: string, releaseId: number): Promise<ApolloOpenRelease> {
    return this.instance.get(`/envs/${env}/releases/${releaseId}`).then((r) => r.data)
  }

  compareReleases(
    env: string,
    baseReleaseId: number,
    toReleaseId?: number,
  ): Promise<ApolloCompareResultDTO> {
    return this.instance
      .get(`/envs/${env}/releases/compare`, {
        params: { baseReleaseId, ...(toReleaseId ? { toReleaseId } : {}) },
      })
      .then((r) => r.data)
  }

  // ---------------- Gray / Branch rules & gray release ----------------
  getBranchRule(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    branchName: string,
  ): Promise<ApolloGrayReleaseRuleDTO> {
    return this.instance
      .get(
        `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/branches/${branchName}`,
      )
      .then((r) => r.data)
  }

  updateBranchRule(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    branchName: string,
    dto: { rules?: string; releaseId?: number; branchStatus?: number },
    op?: string,
  ): Promise<ApolloGrayReleaseRuleDTO> {
    return this.instance
      .put(
        `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/branches/${branchName}`,
        dto,
        { params: operator(op) },
      )
      .then((r) => r.data)
  }

  createGrayRelease(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    branchName: string,
    dto: {
      releaseTitle: string
      releaseComment?: string
      releasedBy: string
      isEmergencyPublish?: boolean
    },
  ): Promise<ApolloOpenRelease> {
    return this.instance
      .post(
        `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/branches/${branchName}/releases`,
        dto,
      )
      .then((r) => r.data)
  }

  // ---------------- Commits (change history) ----------------
  listCommits(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    page = 0,
    size = 50,
  ): Promise<ApolloPage<ApolloCommitDTO>> {
    return this.instance
      .get(
        `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/commits`,
        { params: { page, size } },
      )
      .then((r) => r.data)
  }

  createCommit(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    changeSets: ApolloItemChangeDTO[],
    op = 'admin',
  ): Promise<ApolloCommitDTO> {
    return this.instance
      .post(
        `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/commits`,
        { changeSets, operator: op },
      )
      .then((r) => r.data)
  }

  getCommit(commitId: number): Promise<ApolloCommitDTO> {
    return this.instance.get(`/commits/${commitId}`).then((r) => r.data)
  }

  // ---------------- Consumers (open platform) ----------------
  listConsumers(): Promise<ApolloConsumerDTO[]> {
    return this.instance.get('/consumers').then((r) => r.data)
  }

  getConsumer(appId: string): Promise<ApolloConsumerDTO> {
    return this.instance.get(`/consumers/${appId}`).then((r) => r.data)
  }

  // ---------------- Config export / import ----------------
  exportConfigs(appId: string, clusterName: string, namespaceName: string): Promise<string> {
    return this.instance
      .get(`/configs/${appId}/${clusterName}/${namespaceName}/export`, {
        responseType: 'text',
      })
      .then((r) => r.data as unknown as string)
  }

  importConfigs(dto: {
    appId: string
    clusterName: string
    namespaceName: string
    format?: string
    conflictAction?: string
    configs: string
  }): Promise<void> {
    return this.instance.post('/configs/import', dto).then(() => undefined)
  }

  // ---------------- Config sync ----------------
  // Apollo namespace config sync (NamespaceSyncModel): push selected items from
  // the current namespace to one or more target namespaces.
  syncNamespace(
    env: string,
    appId: string,
    clusterName: string,
    namespaceName: string,
    dto: {
      syncToNamespaces: { appId: string; env: string; clusterName: string; namespaceName: string }[]
      syncItems: { key: string; value: string; comment?: string; type?: number }[]
    },
  ): Promise<void> {
    return this.instance
      .post(
        `/envs/${env}/apps/${appId}/clusters/${clusterName}/namespaces/${namespaceName}/items/sync`,
        dto,
      )
      .then(() => undefined)
  }

  // ---------------- Users (portal user management) ----------------
  getCurrentUser(): Promise<ApolloUserDTO> {
    return this.instance.get('/user').then((r) => r.data)
  }

  listUsers(params?: {
    keyword?: string
    includeInactiveUsers?: boolean
    offset?: number
    limit?: number
  }): Promise<ApolloUserDTO[]> {
    return this.instance.get('/users', { params }).then((r) => r.data)
  }

  createUser(user: {
    userId: string
    name?: string
    email?: string
    password?: string
  }): Promise<void> {
    return this.instance.post('/users', user).then(() => undefined)
  }

  updateUserEnabled(username: string, enabled: boolean, password?: string): Promise<void> {
    return this.instance
      .put(`/users/${username}`, { userId: username, enabled, password })
      .then(() => undefined)
  }

  deleteUser(username: string): Promise<void> {
    return this.instance.delete(`/users/${username}`).then(() => undefined)
  }

  // ---------------- User tokens ----------------
  listUserTokens(): Promise<ApolloUserTokenDTO[]> {
    return this.instance.get('/user-tokens').then((r) => r.data)
  }

  createUserToken(dto: {
    name: string
    operations?: string[]
    appIds?: string[]
    envs?: string[]
    namespaces?: { appId: string; env: string; clusterName: string; namespaceName: string }[]
    rateLimit?: number
    expires?: string
  }): Promise<{ id: string; tokenValue: string }> {
    return this.instance.post('/user-tokens', dto).then((r) => r.data)
  }

  revokeUserToken(tokenId: string): Promise<void> {
    return this.instance.post(`/user-tokens/${tokenId}/revoke`).then(() => undefined)
  }

  rotateUserToken(tokenId: string): Promise<{ id: string; tokenValue: string }> {
    return this.instance.post(`/user-tokens/${tokenId}/rotate`).then((r) => r.data)
  }

  deleteUserToken(tokenId: string): Promise<void> {
    return this.instance.delete(`/user-tokens/${tokenId}`).then(() => undefined)
  }

  // ---------------- System info ----------------
  getSystemInfo(): Promise<ApolloSystemInfoDTO> {
    return this.instance.get('/system-info').then((r) => r.data)
  }

  // ---------------- Server config ----------------
  listPortalConfigs(): Promise<ApolloServerConfigDTO[]> {
    return this.instance.get('/server/portal-db/config/find-all-config').then((r) => r.data)
  }

  createPortalConfig(config: ApolloServerConfigDTO): Promise<ApolloServerConfigDTO> {
    return this.instance.post('/server/portal-db/config', config).then((r) => r.data)
  }

  deletePortalConfig(key: string): Promise<void> {
    return this.instance
      .delete('/server/portal-db/config', { params: { key } })
      .then(() => undefined)
  }

  listConfigDBConfigs(env: string): Promise<ApolloServerConfigDTO[]> {
    return this.instance
      .get(`/server/envs/${env}/config-db/config/find-all-config`)
      .then((r) => r.data)
  }

  createConfigDBConfig(env: string, config: ApolloServerConfigDTO): Promise<ApolloServerConfigDTO> {
    return this.instance.post(`/server/envs/${env}/config-db/config`, config).then((r) => r.data)
  }

  deleteConfigDBConfig(env: string, key: string, cluster?: string): Promise<void> {
    return this.instance
      .delete(`/server/envs/${env}/config-db/config`, {
        params: { key, ...(cluster ? { cluster } : {}) },
      })
      .then(() => undefined)
  }

  // ---------------- System permissions (super admin) ----------------
  getRootPermission(): Promise<{ hasPermission: boolean }> {
    return this.instance.get('/permissions/root').then((r) => r.data)
  }

  listCreateAppPermissionUsers(): Promise<string[]> {
    return this.instance.get('/system/role/createApplication').then((r) => r.data)
  }

  grantCreateAppPermission(userIds: string[]): Promise<void> {
    return this.instance.post('/system/role/createApplication', userIds).then(() => undefined)
  }

  revokeCreateAppPermission(userId: string): Promise<void> {
    return this.instance.delete(`/system/role/createApplication/${userId}`).then(() => undefined)
  }

  // ---------------- Global search / favorites / missing ----------------
  search(key?: string, value?: string): Promise<ApolloSearchResultDTO[]> {
    return this.instance
      .get('/global-search/item-info/by-key-or-value', {
        params: { ...(key ? { key } : {}), ...(value ? { value } : {}) },
      })
      .then((r) => r.data)
  }

  listFavorites(): Promise<ApolloFavoriteDTO[]> {
    return this.instance.get('/favorites').then((r) => r.data)
  }

  findMissingNamespaces(
    env: string,
    appId: string,
    clusterName: string,
  ): Promise<ApolloMissingNamespaceDTO[]> {
    return this.instance
      .get(`/apps/${appId}/envs/${env}/clusters/${clusterName}/missing-namespaces`)
      .then((r) => r.data)
  }

  createMissingNamespaces(
    env: string,
    appId: string,
    clusterName: string,
    namespaces: { namespaceName: string }[],
  ): Promise<void> {
    return this.instance
      .post(`/apps/${appId}/envs/${env}/clusters/${clusterName}/missing-namespaces`, namespaces)
      .then(() => undefined)
  }
}

export default new ApolloApi()

export type ApolloRoleUserDTO = {
  userId: string
  name?: string
  email?: string
  enabled?: boolean
}
