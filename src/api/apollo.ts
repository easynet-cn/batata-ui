import axios from 'axios'
import type { AxiosInstance } from 'axios'
import { config } from '@/config'
import { storage } from '@/composables/useStorage'
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
