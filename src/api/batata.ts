import axios from 'axios'
import type { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios'
import { LRUCache } from 'lru-cache'
import type {
  ConfigInfo,
  ConfigHistoryInfo,
  ConfigListenerInfo,
  ConfigGrayInfo,
  ServiceInfo,
  ServiceDetail,
  InstanceInfo,
  SubscriberInfo,
  Namespace,
  NodeInfo,
  UserInfo,
  RoleInfo,
  PermissionInfo,
  McpServerInfo,
  AgentInfo,
  AgentPayload,
  McpServerPayload,
  McpServerImportPayload,
  PluginConfigPayload,
  AuditLogItem,
  AuditLogSearch,
  AuditStats,
  PageResult,
  LoginResponse,
  PluginInfo,
  SyncEnvironment,
  SyncHistory,
  SyncRequest,
} from '@/types'
import { config } from '@/config'
import { ApiError, AuthError, NetworkError } from '@/utils/error'
import { storage } from '@/composables/useStorage'

// Batata API response interface
export interface BatataResponse<T = unknown> {
  code: number
  message: string
  data: T
}

// 缓存配置
interface CacheOptions {
  ttl?: number
  key?: string
}

class BatataApi {
  private instance: AxiosInstance
  private cache: LRUCache<string, AxiosResponse>
  private pendingRequests: Map<string, Promise<AxiosResponse>>

  constructor(baseURL: string = `${config.api.baseUrl}/v3/console`) {
    // Initialize cache
    this.cache = new LRUCache<string, AxiosResponse>({
      max: config.cache.maxSize,
      ttl: config.cache.ttl,
    })
    this.pendingRequests = new Map()

    // Create axios instance
    this.instance = axios.create({
      baseURL,
      timeout: config.api.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // 请求拦截器
    this.instance.interceptors.request.use(
      (reqConfig) => {
        const token = storage.get(config.storage.tokenKey)
        if (token) {
          reqConfig.headers.accessToken = token
        }
        const username = storage.get(config.storage.usernameKey)
        if (username) {
          reqConfig.headers.username = username
        }
        return reqConfig
      },
      (error) => Promise.reject(error),
    )

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse<BatataResponse>) => {
        const { data } = response
        if (data.code !== 0 && data.code !== 200) {
          throw new ApiError(data.code, data.message || '请求失败')
        }
        return response
      },
      (error) => {
        if (!error.response) {
          throw new NetworkError()
        }
        if (error.response?.status === 401 || error.response?.status === 403) {
          storage.remove(config.storage.tokenKey)
          storage.remove(config.storage.usernameKey)
          window.location.href = '/login'
          throw new AuthError()
        }
        throw new ApiError(
          error.response?.status || 500,
          error.response?.data?.message || error.message,
        )
      },
    )
  }

  // 缓存请求方法
  private async cachedGet<T>(
    url: string,
    axiosConfig?: AxiosRequestConfig,
    cacheOptions?: CacheOptions,
  ): Promise<AxiosResponse<BatataResponse<T>>> {
    const cacheKey = cacheOptions?.key || `${url}:${JSON.stringify(axiosConfig?.params || {})}`

    // Check cache
    const cachedResponse = this.cache.get(cacheKey)
    if (cachedResponse) {
      return cachedResponse as AxiosResponse<BatataResponse<T>>
    }

    // Check pending requests (prevent duplicate requests)
    const pendingRequest = this.pendingRequests.get(cacheKey)
    if (pendingRequest) {
      return pendingRequest as Promise<AxiosResponse<BatataResponse<T>>>
    }

    // Make request
    const promise = this.instance
      .get<BatataResponse<T>>(url, axiosConfig)
      .then((response) => {
        this.cache.set(cacheKey, response, { ttl: cacheOptions?.ttl })
        this.pendingRequests.delete(cacheKey)
        return response
      })
      .catch((error) => {
        this.pendingRequests.delete(cacheKey)
        throw error
      })

    this.pendingRequests.set(cacheKey, promise)
    return promise
  }

  // 清除缓存
  clearCache(pattern?: string) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }

  // ============================================
  // Auth Instance (/v3/auth)
  // ============================================

  private authInstance: AxiosInstance | null = null

  private getAuthInstance(): AxiosInstance {
    if (!this.authInstance) {
      this.authInstance = axios.create({
        baseURL: `${config.api.baseUrl}/v3/auth`,
        timeout: config.api.timeout,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      this.authInstance.interceptors.request.use(
        (reqConfig) => {
          const token = storage.get(config.storage.tokenKey)
          if (token) {
            reqConfig.headers.accessToken = token
          }
          const username = storage.get(config.storage.usernameKey)
          if (username) {
            reqConfig.headers.username = username
          }
          return reqConfig
        },
        (error) => Promise.reject(error),
      )

      this.authInstance.interceptors.response.use(
        (response: AxiosResponse) => {
          const { data } = response
          // Some auth endpoints (e.g. login) return raw data without BatataResponse wrapper
          if (data.code !== undefined && data.code !== 0 && data.code !== 200) {
            throw new ApiError(data.code, data.message || 'Request failed')
          }
          return response
        },
        (error) => {
          if (!error.response) {
            throw new NetworkError()
          }
          if (error.response?.status === 401 || error.response?.status === 403) {
            storage.remove(config.storage.tokenKey)
            storage.remove(config.storage.usernameKey)
            window.location.href = '/login'
            throw new AuthError()
          }
          throw new ApiError(
            error.response?.status || 500,
            error.response?.data?.message || error.message,
          )
        },
      )
    }
    return this.authInstance
  }

  // ============================================
  // 认证相关 API
  // ============================================

  async login(username: string, password: string) {
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)

    return this.getAuthInstance().post<LoginResponse>('/user/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  }

  async logout() {
    return this.getAuthInstance().post<BatataResponse>('/user/logout')
  }

  // ============================================
  // 配置管理 API
  // ============================================

  async getConfigList(params: {
    pageNo?: number
    pageSize?: number
    dataId?: string
    groupName?: string
    appName?: string
    namespaceId?: string
    search?: 'accurate' | 'blur'
    configTags?: string
    type?: string
    content?: string
  }) {
    return this.instance.get<BatataResponse<PageResult<ConfigInfo>>>('/cs/config/list', { params })
  }

  async getConfig(dataId: string, groupName: string, namespaceId?: string) {
    return this.instance.get<BatataResponse<ConfigInfo>>('/cs/config', {
      params: { dataId, groupName, namespaceId },
    })
  }

  async publishConfig(data: {
    dataId: string
    groupName: string
    content: string
    type?: string
    namespaceId?: string
    appName?: string
    desc?: string
    configTags?: string
  }) {
    return this.instance.post<BatataResponse>('/cs/config', data)
  }

  async deleteConfig(dataId: string, groupName: string, tenant?: string) {
    return this.instance.delete<BatataResponse>('/cs/config', {
      params: { dataId, groupName, tenant },
    })
  }

  async batchDeleteConfig(ids: string[], namespaceId?: string) {
    return this.instance.delete<BatataResponse>('/cs/config/batchDelete', {
      params: { ids: ids.join(','), namespaceId },
    })
  }

  async cloneConfig(data: {
    ids: string
    targetNamespaceId: string
    policy: 'ABORT' | 'SKIP' | 'OVERWRITE'
  }) {
    return this.instance.post<BatataResponse>('/cs/config/clone', null, {
      params: data,
    })
  }

  async importConfig(file: File, namespaceId: string, policy: 'ABORT' | 'SKIP' | 'OVERWRITE') {
    const formData = new FormData()
    formData.append('file', file)

    return this.instance.post<BatataResponse>('/cs/config/import', formData, {
      params: { namespaceId, policy },
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  }

  async exportConfig(ids: string[], namespaceId?: string) {
    return this.instance.get('/cs/config/export', {
      params: { dataIds: ids.join(','), namespaceId },
      responseType: 'blob',
    })
  }

  // 配置历史
  async getConfigHistoryList(params: {
    dataId: string
    groupName: string
    namespaceId?: string
    pageNo?: number
    pageSize?: number
  }) {
    return this.instance.get<BatataResponse<PageResult<ConfigHistoryInfo>>>('/cs/history/list', {
      params,
    })
  }

  async getConfigHistory(nid: string, dataId: string, groupName: string, namespaceId?: string) {
    return this.instance.get<BatataResponse<ConfigHistoryInfo>>('/cs/history', {
      params: { nid, dataId, groupName, namespaceId },
    })
  }

  async rollbackConfig(nid: string, dataId: string, groupName: string, namespaceId?: string) {
    return this.instance.post<BatataResponse>('/cs/history/rollback', null, {
      params: { nid, dataId, groupName, namespaceId },
    })
  }

  // 配置监听
  async getConfigListeners(params: {
    dataId?: string
    groupName?: string
    namespaceId?: string
    ip?: string
    pageNo?: number
    pageSize?: number
  }) {
    return this.instance.get<BatataResponse<PageResult<ConfigListenerInfo>>>(
      '/cs/config/listener',
      { params },
    )
  }

  // ============================================
  // 服务管理 API
  // ============================================

  async getServiceList(params: {
    pageNo?: number
    pageSize?: number
    groupName?: string
    serviceName?: string
    namespaceId?: string
    hasIpCount?: boolean
  }) {
    return this.instance.get<BatataResponse<PageResult<ServiceInfo>>>('/ns/service/list', {
      params,
    })
  }

  async getServiceDetail(serviceName: string, groupName: string, namespaceId?: string) {
    return this.instance.get<BatataResponse<ServiceDetail>>('/ns/service', {
      params: { serviceName, groupName, namespaceId },
    })
  }

  async createService(data: {
    serviceName: string
    groupName?: string
    namespaceId?: string
    protectThreshold?: number
    metadata?: Record<string, string>
    selector?: { type: string; expression?: string }
  }) {
    return this.instance.post<BatataResponse>('/ns/service', data)
  }

  async updateService(data: {
    serviceName: string
    groupName?: string
    namespaceId?: string
    protectThreshold?: number
    metadata?: Record<string, string>
    selector?: { type: string; expression?: string }
  }) {
    return this.instance.put<BatataResponse>('/ns/service', data)
  }

  async deleteService(serviceName: string, groupName: string, namespaceId?: string) {
    return this.instance.delete<BatataResponse>('/ns/service', {
      params: { serviceName, groupName, namespaceId },
    })
  }

  // 实例管理
  async getInstanceList(serviceName: string, groupName: string, namespaceId?: string) {
    return this.instance.get<BatataResponse<{ hosts: InstanceInfo[] }>>('/ns/instance/list', {
      params: { serviceName, groupName, namespaceId },
    })
  }

  async updateInstance(data: {
    serviceName: string
    groupName?: string
    namespaceId?: string
    ip: string
    port: number
    weight?: number
    enabled?: boolean
    metadata?: Record<string, string>
    clusterName?: string
  }) {
    return this.instance.put<BatataResponse>('/ns/instance', data)
  }

  // 集群管理
  async updateCluster(data: {
    serviceName: string
    groupName?: string
    namespaceId?: string
    clusterName: string
    healthChecker: { type: string; path?: string; headers?: string }
    metadata?: Record<string, string>
  }) {
    return this.instance.put<BatataResponse>('/ns/service/cluster', data)
  }

  // 订阅者
  async getSubscriberList(params: {
    serviceName?: string
    groupName?: string
    namespaceId?: string
    pageNo?: number
    pageSize?: number
  }) {
    return this.instance.get<BatataResponse<{ count: number; subscribers: SubscriberInfo[] }>>(
      '/ns/subscriber/list',
      { params },
    )
  }

  // 服务路由类型
  async getSelectorTypes() {
    return this.instance.get<BatataResponse<string[]>>('/ns/service/selector/types')
  }

  // ============================================
  // 命名空间 API
  // ============================================

  async getNamespaceList() {
    return this.instance.get<BatataResponse<Namespace[]>>('/core/namespace/list')
  }

  async getNamespace(namespaceId: string) {
    return this.instance.get<BatataResponse<Namespace>>('/core/namespace', {
      params: { namespaceId },
    })
  }

  async createNamespace(data: {
    namespaceId?: string
    namespaceName: string
    namespaceDesc?: string
  }) {
    return this.instance.post<BatataResponse>('/core/namespace', data)
  }

  async updateNamespace(data: {
    namespaceId: string
    namespaceName: string
    namespaceDesc?: string
  }) {
    return this.instance.put<BatataResponse>('/core/namespace', data)
  }

  async deleteNamespace(namespaceId: string) {
    return this.instance.delete<BatataResponse>('/core/namespace', {
      params: { namespaceId },
    })
  }

  // ============================================
  // 集群管理 API
  // ============================================

  async getClusterNodes(params?: { keyword?: string }) {
    return this.instance.get<BatataResponse<NodeInfo[]>>('/core/cluster/nodes', { params })
  }

  async updateClusterNode(data: { address: string; metadata?: Record<string, string> }) {
    return this.instance.put<BatataResponse>('/core/cluster/nodes', data)
  }

  // ============================================
  // 用户管理 API
  // ============================================

  async getUserList(params?: { pageNo?: number; pageSize?: number; search?: string }) {
    return this.getAuthInstance().get<BatataResponse<PageResult<UserInfo>>>('/user/list', {
      params,
    })
  }

  async createUser(data: { username: string; password: string }) {
    return this.getAuthInstance().post<BatataResponse>('/user', data)
  }

  async updateUser(data: { username: string; newPassword: string }) {
    return this.getAuthInstance().put<BatataResponse>('/user', data)
  }

  async deleteUser(username: string) {
    return this.getAuthInstance().delete<BatataResponse>('/user', {
      params: { username },
    })
  }

  // ============================================
  // 角色管理 API
  // ============================================

  async getRoleList(params?: { pageNo?: number; pageSize?: number; search?: string }) {
    return this.getAuthInstance().get<BatataResponse<PageResult<RoleInfo>>>('/role/list', {
      params,
    })
  }

  async createRole(data: { role: string; username: string }) {
    return this.getAuthInstance().post<BatataResponse>('/role', data)
  }

  async deleteRole(role: string, username: string) {
    return this.getAuthInstance().delete<BatataResponse>('/role', {
      params: { role, username },
    })
  }

  // ============================================
  // 权限管理 API
  // ============================================

  async getPermissionList(params?: { pageNo?: number; pageSize?: number; role?: string }) {
    return this.getAuthInstance().get<BatataResponse<PageResult<PermissionInfo>>>(
      '/permission/list',
      { params },
    )
  }

  async createPermission(data: { role: string; resource: string; action: string }) {
    return this.getAuthInstance().post<BatataResponse>('/permission', data)
  }

  async deletePermission(role: string, resource: string, action: string) {
    return this.getAuthInstance().delete<BatataResponse>('/permission', {
      params: { role, resource, action },
    })
  }

  // ============================================
  // MCP Management API (/v3/console/ai/mcp)
  // ============================================

  async getMcpServerList(params?: {
    pageNo?: number
    pageSize?: number
    namespaceId?: string
    search?: string
  }) {
    return this.instance.get<BatataResponse<PageResult<McpServerInfo>>>('/ai/mcp/servers', {
      params: {
        page: params?.pageNo,
        pageSize: params?.pageSize,
        namespace: params?.namespaceId,
        namePattern: params?.search ? `*${params.search}*` : undefined,
      },
    })
  }

  async getMcpServerDetail(namespace: string, name: string) {
    return this.instance.get<BatataResponse<McpServerInfo>>(
      `/ai/mcp/servers/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`,
    )
  }

  async createMcpServer(data: McpServerPayload) {
    return this.instance.post<BatataResponse>('/ai/mcp/servers', data)
  }

  async updateMcpServer(namespace: string, name: string, data: Partial<McpServerPayload>) {
    return this.instance.put<BatataResponse>(
      `/ai/mcp/servers/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`,
      data,
    )
  }

  async deleteMcpServer(namespace: string, name: string) {
    return this.instance.delete<BatataResponse>(
      `/ai/mcp/servers/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`,
    )
  }

  async importMcpServers(data: McpServerImportPayload) {
    return this.instance.post<BatataResponse>('/ai/mcp/servers/import', data)
  }

  async getMcpStats() {
    return this.instance.get<BatataResponse>('/ai/mcp/servers/stats')
  }

  // ============================================
  // Agent (A2A) Management API (/v3/console/ai/a2a)
  // ============================================

  async getAgentList(params?: {
    pageNo?: number
    pageSize?: number
    namespaceId?: string
    name?: string
  }) {
    return this.instance.get<BatataResponse<PageResult<AgentInfo>>>('/ai/a2a/agents', {
      params: {
        page: params?.pageNo,
        pageSize: params?.pageSize,
        namespace: params?.namespaceId,
        namePattern: params?.name ? `*${params.name}*` : undefined,
      },
    })
  }

  async getAgentDetail(namespace: string, name: string) {
    return this.instance.get<BatataResponse<AgentInfo>>(
      `/ai/a2a/agents/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`,
    )
  }

  async createAgent(data: AgentPayload) {
    return this.instance.post<BatataResponse>('/ai/a2a/agents', data)
  }

  async updateAgent(namespace: string, name: string, data: Partial<AgentPayload>) {
    return this.instance.put<BatataResponse>(
      `/ai/a2a/agents/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`,
      data,
    )
  }

  async deleteAgent(namespace: string, name: string) {
    return this.instance.delete<BatataResponse>(
      `/ai/a2a/agents/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`,
    )
  }

  async findAgentsBySkill(skill: string) {
    return this.instance.get<BatataResponse<AgentInfo[]>>(
      `/ai/a2a/agents/by-skill/${encodeURIComponent(skill)}`,
    )
  }

  async getA2aStats() {
    return this.instance.get<BatataResponse>('/ai/a2a/agents/stats')
  }

  // ============================================
  // Audit Log API (V2)
  // ============================================

  private v2Instance: AxiosInstance | null = null

  private getV2Instance(): AxiosInstance {
    if (!this.v2Instance) {
      this.v2Instance = axios.create({
        baseURL: `${config.api.baseUrl}/v3/console`,
        timeout: config.api.timeout,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Request interceptor
      this.v2Instance.interceptors.request.use(
        (reqConfig) => {
          const token = storage.get(config.storage.tokenKey)
          if (token) {
            reqConfig.headers.accessToken = token
          }
          const username = storage.get(config.storage.usernameKey)
          if (username) {
            reqConfig.headers.username = username
          }
          return reqConfig
        },
        (error) => Promise.reject(error),
      )

      // Response interceptor
      this.v2Instance.interceptors.response.use(
        (response: AxiosResponse<BatataResponse>) => {
          const { data } = response
          if (data.code !== 0 && data.code !== 200) {
            throw new ApiError(data.code, data.message || 'Request failed')
          }
          return response
        },
        (error) => {
          if (!error.response) {
            throw new NetworkError()
          }
          if (error.response?.status === 401 || error.response?.status === 403) {
            storage.remove(config.storage.tokenKey)
            storage.remove(config.storage.usernameKey)
            window.location.href = '/login'
            throw new AuthError()
          }
          throw new ApiError(
            error.response?.status || 500,
            error.response?.data?.message || error.message,
          )
        },
      )
    }
    return this.v2Instance
  }

  async getAuditLogList(params: AuditLogSearch) {
    return this.getV2Instance().get<BatataResponse<PageResult<AuditLogItem>>>('/audit/list', {
      params,
    })
  }

  async getAuditLog(id: number) {
    return this.getV2Instance().get<BatataResponse<AuditLogItem>>('/audit', {
      params: { id },
    })
  }

  async getAuditStats(params?: { tenantId?: string; startTime?: string; endTime?: string }) {
    return this.getV2Instance().get<BatataResponse<AuditStats>>('/audit/stats', {
      params,
    })
  }

  // ============================================
  // Beta/Gray Config API
  // ============================================

  async getBetaConfig(dataId: string, groupName: string, namespaceId?: string) {
    return this.instance.get<BatataResponse<ConfigGrayInfo>>('/cs/config/beta', {
      params: { dataId, groupName, namespaceId: namespaceId || '' },
    })
  }

  async publishBetaConfig(data: {
    dataId: string
    groupName: string
    content: string
    namespaceId?: string
    betaIps?: string
  }) {
    return this.instance.post<BatataResponse>('/cs/config/beta', {
      dataId: data.dataId,
      groupName: data.groupName,
      namespaceId: data.namespaceId || '',
      content: data.content,
      grayName: 'beta',
      grayRule: data.betaIps || '',
    })
  }

  async deleteBetaConfig(dataId: string, groupName: string, namespaceId?: string) {
    return this.instance.delete<BatataResponse>('/cs/config/beta', {
      params: { dataId, groupName, namespaceId: namespaceId || '' },
    })
  }

  async promoteBetaConfig(dataId: string, groupName: string, namespaceId?: string) {
    // Get beta config content first, then publish as stable
    const betaResponse = await this.getBetaConfig(dataId, groupName, namespaceId)
    const betaConfig = betaResponse.data.data
    if (!betaConfig || !betaConfig.content) {
      throw new ApiError(404, 'Beta config not found')
    }

    // Publish as stable config
    await this.publishConfig({
      dataId,
      groupName,
      content: betaConfig.content,
      namespaceId,
    })

    // Delete beta config
    await this.deleteBetaConfig(dataId, groupName, namespaceId)

    return { success: true }
  }

  // ============================================
  // User Registration API
  // ============================================

  async register(data: { username: string; password: string }) {
    return this.getAuthInstance().post<BatataResponse>('/user', data)
  }

  // ============================================
  // Plugin Management API
  // ============================================

  async getPluginList() {
    return this.instance.get<BatataResponse<PluginInfo[]>>('/core/plugin/list')
  }

  async getPluginDetail(name: string) {
    return this.instance.get<BatataResponse<PluginInfo>>('/core/plugin', {
      params: { name },
    })
  }

  async updatePluginStatus(name: string, enabled: boolean) {
    return this.instance.put<BatataResponse>('/core/plugin/status', {
      name,
      enabled,
    })
  }

  async updatePluginConfig(name: string, pluginConfig: PluginConfigPayload) {
    return this.instance.put<BatataResponse>('/core/plugin/config', {
      name,
      config: pluginConfig,
    })
  }

  // ============================================
  // Config Sync API
  // ============================================

  async getSyncEnvironments() {
    return this.instance.get<BatataResponse<SyncEnvironment[]>>('/cs/config/sync/environments')
  }

  async getSyncHistory(tenant?: string) {
    return this.instance.get<BatataResponse<SyncHistory[]>>('/cs/config/sync/history', {
      params: { tenant },
    })
  }

  async syncConfigs(data: SyncRequest) {
    return this.instance.post<BatataResponse>('/cs/config/sync', data)
  }

  async addSyncEnvironment(data: { name: string; endpoint: string; accessToken?: string }) {
    return this.instance.post<BatataResponse>('/cs/config/sync/environment', data)
  }

  async deleteSyncEnvironment(id: string) {
    return this.instance.delete<BatataResponse>('/cs/config/sync/environment', {
      params: { id },
    })
  }
}

export default new BatataApi()
