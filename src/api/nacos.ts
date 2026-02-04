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

// Nacos API 响应接口
export interface NacosResponse<T = unknown> {
  code: number
  message: string
  data: T
}

// 缓存配置
interface CacheOptions {
  ttl?: number
  key?: string
}

class NacosApi {
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
        const token = localStorage.getItem(config.storage.tokenKey)
        if (token) {
          reqConfig.headers.accessToken = token
        }
        const username = localStorage.getItem(config.storage.usernameKey)
        if (username) {
          reqConfig.headers.username = username
        }
        return reqConfig
      },
      (error) => Promise.reject(error),
    )

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse<NacosResponse>) => {
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
          localStorage.removeItem(config.storage.tokenKey)
          localStorage.removeItem(config.storage.usernameKey)
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
  ): Promise<AxiosResponse<NacosResponse<T>>> {
    const cacheKey = cacheOptions?.key || `${url}:${JSON.stringify(axiosConfig?.params || {})}`

    // Check cache
    const cachedResponse = this.cache.get(cacheKey)
    if (cachedResponse) {
      return cachedResponse as AxiosResponse<NacosResponse<T>>
    }

    // Check pending requests (prevent duplicate requests)
    const pendingRequest = this.pendingRequests.get(cacheKey)
    if (pendingRequest) {
      return pendingRequest as Promise<AxiosResponse<NacosResponse<T>>>
    }

    // Make request
    const promise = this.instance
      .get<NacosResponse<T>>(url, axiosConfig)
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
  // 认证相关 API
  // ============================================

  async login(username: string, password: string) {
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)

    return this.instance.post<NacosResponse<LoginResponse>>('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  }

  async logout() {
    return this.instance.post<NacosResponse>('/auth/logout')
  }

  // ============================================
  // 配置管理 API
  // ============================================

  async getConfigList(params: {
    pageNo?: number
    pageSize?: number
    dataId?: string
    group?: string
    appName?: string
    tenant?: string
    search?: 'accurate' | 'blur'
    tags?: string
    types?: string
    configDetail?: string
  }) {
    return this.instance.get<NacosResponse<PageResult<ConfigInfo>>>('/cs/config/list', { params })
  }

  async getConfig(dataId: string, group: string, tenant?: string) {
    return this.instance.get<NacosResponse<ConfigInfo>>('/cs/config', {
      params: { dataId, group, tenant },
    })
  }

  async publishConfig(data: {
    dataId: string
    group: string
    content: string
    type?: string
    tenant?: string
    appName?: string
    desc?: string
    tags?: string
    configTags?: string
  }) {
    return this.instance.post<NacosResponse>('/cs/config', data)
  }

  async deleteConfig(dataId: string, group: string, tenant?: string) {
    return this.instance.delete<NacosResponse>('/cs/config', {
      params: { dataId, group, tenant },
    })
  }

  async batchDeleteConfig(ids: string[]) {
    return this.instance.delete<NacosResponse>('/cs/config/batch', {
      data: { ids },
    })
  }

  async cloneConfig(data: {
    ids: string[]
    targetTenant: string
    policy: 'ABORT' | 'SKIP' | 'OVERWRITE'
  }) {
    return this.instance.post<NacosResponse>('/cs/config/clone', data)
  }

  async importConfig(file: File, tenant: string, policy: 'ABORT' | 'SKIP' | 'OVERWRITE') {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('tenant', tenant)
    formData.append('policy', policy)

    return this.instance.post<NacosResponse>('/cs/config/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  }

  async exportConfig(ids: string[]) {
    return this.instance.get('/cs/config/export', {
      params: { ids: ids.join(',') },
      responseType: 'blob',
    })
  }

  // 配置历史
  async getConfigHistoryList(params: {
    dataId: string
    group: string
    tenant?: string
    pageNo?: number
    pageSize?: number
  }) {
    return this.instance.get<NacosResponse<PageResult<ConfigHistoryInfo>>>('/cs/history/list', {
      params,
    })
  }

  async getConfigHistory(nid: string, dataId: string, group: string, tenant?: string) {
    return this.instance.get<NacosResponse<ConfigHistoryInfo>>('/cs/history', {
      params: { nid, dataId, group, tenant },
    })
  }

  async rollbackConfig(nid: string, dataId: string, group: string, tenant?: string) {
    return this.instance.post<NacosResponse>('/cs/history/rollback', null, {
      params: { nid, dataId, group, tenant },
    })
  }

  // 配置监听
  async getConfigListeners(params: {
    dataId?: string
    group?: string
    tenant?: string
    ip?: string
    pageNo?: number
    pageSize?: number
  }) {
    return this.instance.get<NacosResponse<PageResult<ConfigListenerInfo>>>(
      '/cs/config/listener/list',
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
    return this.instance.get<NacosResponse<{ count: number; serviceList: ServiceInfo[] }>>(
      '/ns/service/list',
      { params },
    )
  }

  async getServiceDetail(serviceName: string, groupName: string, namespaceId?: string) {
    return this.instance.get<NacosResponse<ServiceDetail>>('/ns/service', {
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
    return this.instance.post<NacosResponse>('/ns/service', data)
  }

  async updateService(data: {
    serviceName: string
    groupName?: string
    namespaceId?: string
    protectThreshold?: number
    metadata?: Record<string, string>
    selector?: { type: string; expression?: string }
  }) {
    return this.instance.put<NacosResponse>('/ns/service', data)
  }

  async deleteService(serviceName: string, groupName: string, namespaceId?: string) {
    return this.instance.delete<NacosResponse>('/ns/service', {
      params: { serviceName, groupName, namespaceId },
    })
  }

  // 实例管理
  async getInstanceList(serviceName: string, groupName: string, namespaceId?: string) {
    return this.instance.get<NacosResponse<{ hosts: InstanceInfo[] }>>('/ns/instance/list', {
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
    return this.instance.put<NacosResponse>('/ns/instance', data)
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
    return this.instance.put<NacosResponse>('/ns/service/cluster', data)
  }

  // 订阅者
  async getSubscriberList(params: {
    serviceName?: string
    groupName?: string
    namespaceId?: string
    pageNo?: number
    pageSize?: number
  }) {
    return this.instance.get<NacosResponse<{ count: number; subscribers: SubscriberInfo[] }>>(
      '/ns/subscriber/list',
      { params },
    )
  }

  // 服务路由类型
  async getSelectorTypes() {
    return this.instance.get<NacosResponse<string[]>>('/ns/service/selector/types')
  }

  // ============================================
  // 命名空间 API
  // ============================================

  async getNamespaceList() {
    return this.instance.get<NacosResponse<Namespace[]>>('/core/namespace/list')
  }

  async getNamespace(namespaceId: string) {
    return this.instance.get<NacosResponse<Namespace>>('/core/namespace', {
      params: { namespaceId },
    })
  }

  async createNamespace(data: {
    namespaceId?: string
    namespaceName: string
    namespaceDesc?: string
  }) {
    return this.instance.post<NacosResponse>('/core/namespace', data)
  }

  async updateNamespace(data: {
    namespaceId: string
    namespaceName: string
    namespaceDesc?: string
  }) {
    return this.instance.put<NacosResponse>('/core/namespace', data)
  }

  async deleteNamespace(namespaceId: string) {
    return this.instance.delete<NacosResponse>('/core/namespace', {
      params: { namespaceId },
    })
  }

  // ============================================
  // 集群管理 API
  // ============================================

  async getClusterNodes(params?: { keyword?: string }) {
    return this.instance.get<NacosResponse<NodeInfo[]>>('/core/cluster/nodes', { params })
  }

  async updateClusterNode(data: { address: string; metadata?: Record<string, string> }) {
    return this.instance.put<NacosResponse>('/core/cluster/nodes', data)
  }

  // ============================================
  // 用户管理 API
  // ============================================

  async getUserList(params?: { pageNo?: number; pageSize?: number; search?: string }) {
    return this.instance.get<NacosResponse<PageResult<UserInfo>>>('/uc/user/list', { params })
  }

  async createUser(data: { username: string; password: string }) {
    return this.instance.post<NacosResponse>('/uc/user', data)
  }

  async updateUser(data: { username: string; newPassword: string }) {
    return this.instance.put<NacosResponse>('/uc/user', data)
  }

  async deleteUser(username: string) {
    return this.instance.delete<NacosResponse>('/uc/user', {
      params: { username },
    })
  }

  // ============================================
  // 角色管理 API
  // ============================================

  async getRoleList(params?: { pageNo?: number; pageSize?: number; search?: string }) {
    return this.instance.get<NacosResponse<PageResult<RoleInfo>>>('/uc/role/list', { params })
  }

  async createRole(data: { role: string; username: string }) {
    return this.instance.post<NacosResponse>('/uc/role', data)
  }

  async deleteRole(role: string, username: string) {
    return this.instance.delete<NacosResponse>('/uc/role', {
      params: { role, username },
    })
  }

  // ============================================
  // 权限管理 API
  // ============================================

  async getPermissionList(params?: { pageNo?: number; pageSize?: number; role?: string }) {
    return this.instance.get<NacosResponse<PageResult<PermissionInfo>>>('/uc/permission/list', {
      params,
    })
  }

  async createPermission(data: { role: string; resource: string; action: string }) {
    return this.instance.post<NacosResponse>('/uc/permission', data)
  }

  async deletePermission(role: string, resource: string, action: string) {
    return this.instance.delete<NacosResponse>('/uc/permission', {
      params: { role, resource, action },
    })
  }

  // ============================================
  // MCP 管理 API
  // ============================================

  async getMcpServerList(params?: {
    pageNo?: number
    pageSize?: number
    namespaceId?: string
    search?: string
  }) {
    return this.instance.get<NacosResponse<PageResult<McpServerInfo>>>('/ai/mcp/list', { params })
  }

  async getMcpServerDetail(id: string) {
    return this.instance.get<NacosResponse<McpServerInfo>>('/ai/mcp', {
      params: { id },
    })
  }

  async getMcpServerTools(id: string) {
    return this.instance.get<
      NacosResponse<
        Array<{ name: string; description?: string; inputSchema?: Record<string, unknown> }>
      >
    >('/ai/mcp/tools', {
      params: { id },
    })
  }

  async createMcpServer(data: Record<string, unknown>) {
    return this.instance.post<NacosResponse>('/ai/mcp', data)
  }

  async updateMcpServer(data: Record<string, unknown>) {
    return this.instance.put<NacosResponse>('/ai/mcp', data)
  }

  async deleteMcpServer(id: string) {
    return this.instance.delete<NacosResponse>('/ai/mcp', {
      params: { id },
    })
  }

  async validateMcpImport(data: unknown) {
    return this.instance.post<NacosResponse>('/ai/mcp/import/validate', data)
  }

  async executeMcpImport(data: unknown) {
    return this.instance.post<NacosResponse>('/ai/mcp/import/execute', data)
  }

  // ============================================
  // Agent 管理 API
  // ============================================

  async getAgentList(params?: {
    pageNo?: number
    pageSize?: number
    namespaceId?: string
    name?: string
  }) {
    return this.instance.get<NacosResponse<PageResult<AgentInfo>>>('/ai/a2a/list', { params })
  }

  async getAgentDetail(id: string) {
    return this.instance.get<NacosResponse<AgentInfo>>('/ai/a2a', {
      params: { id },
    })
  }

  async createAgent(data: Partial<AgentInfo>) {
    return this.instance.post<NacosResponse>('/ai/a2a', data)
  }

  async updateAgent(data: Partial<AgentInfo>) {
    return this.instance.put<NacosResponse>('/ai/a2a', data)
  }

  async deleteAgent(id: string) {
    return this.instance.delete<NacosResponse>('/ai/a2a', {
      params: { id },
    })
  }

  async batchDeleteAgents(ids: string[]) {
    return this.instance.delete<NacosResponse>('/ai/a2a/batch', {
      data: { ids },
    })
  }

  async getAgentVersions(id: string) {
    return this.instance.get<NacosResponse<AgentInfo[]>>('/ai/a2a/version/list', {
      params: { id },
    })
  }

  // ============================================
  // Audit Log API (V2)
  // ============================================

  private v2Instance: AxiosInstance | null = null

  private getV2Instance(): AxiosInstance {
    if (!this.v2Instance) {
      this.v2Instance = axios.create({
        baseURL: `${config.api.baseUrl}/nacos/v2/console`,
        timeout: config.api.timeout,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Request interceptor
      this.v2Instance.interceptors.request.use(
        (reqConfig) => {
          const token = localStorage.getItem(config.storage.tokenKey)
          if (token) {
            reqConfig.headers.accessToken = token
          }
          const username = localStorage.getItem(config.storage.usernameKey)
          if (username) {
            reqConfig.headers.username = username
          }
          return reqConfig
        },
        (error) => Promise.reject(error),
      )

      // Response interceptor
      this.v2Instance.interceptors.response.use(
        (response: AxiosResponse<NacosResponse>) => {
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
            localStorage.removeItem(config.storage.tokenKey)
            localStorage.removeItem(config.storage.usernameKey)
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
    return this.getV2Instance().get<NacosResponse<PageResult<AuditLogItem>>>('/audit/list', {
      params,
    })
  }

  async getAuditLog(id: number) {
    return this.getV2Instance().get<NacosResponse<AuditLogItem>>('/audit', {
      params: { id },
    })
  }

  async getAuditStats(params?: { tenantId?: string; startTime?: string; endTime?: string }) {
    return this.getV2Instance().get<NacosResponse<AuditStats>>('/audit/stats', {
      params,
    })
  }

  // ============================================
  // Beta/Gray Config API
  // ============================================

  async getBetaConfig(dataId: string, group: string, tenant?: string) {
    return this.instance.get<NacosResponse<ConfigGrayInfo>>('/cs/config/beta', {
      params: { dataId, groupName: group, namespaceId: tenant || '' },
    })
  }

  async publishBetaConfig(data: {
    dataId: string
    group: string
    content: string
    tenant?: string
    betaIps?: string
  }) {
    return this.instance.post<NacosResponse>('/cs/config/beta', {
      dataId: data.dataId,
      groupName: data.group,
      namespaceId: data.tenant || '',
      content: data.content,
      grayName: 'beta',
      grayRule: data.betaIps || '',
    })
  }

  async deleteBetaConfig(dataId: string, group: string, tenant?: string) {
    return this.instance.delete<NacosResponse>('/cs/config/beta', {
      params: { dataId, groupName: group, namespaceId: tenant || '' },
    })
  }

  async promoteBetaConfig(dataId: string, group: string, tenant?: string) {
    // Get beta config content first, then publish as stable
    const betaResponse = await this.getBetaConfig(dataId, group, tenant)
    const betaConfig = betaResponse.data.data
    if (!betaConfig || !betaConfig.content) {
      throw new ApiError(404, 'Beta config not found')
    }

    // Publish as stable config
    await this.publishConfig({
      dataId,
      group,
      content: betaConfig.content,
      tenant,
    })

    // Delete beta config
    await this.deleteBetaConfig(dataId, group, tenant)

    return { success: true }
  }

  // ============================================
  // User Registration API
  // ============================================

  async register(data: { username: string; password: string }) {
    return this.instance.post<NacosResponse>('/uc/user/register', data)
  }

  // ============================================
  // Plugin Management API
  // ============================================

  async getPluginList() {
    return this.instance.get<NacosResponse<PluginInfo[]>>('/core/plugin/list')
  }

  async getPluginDetail(name: string) {
    return this.instance.get<NacosResponse<PluginInfo>>('/core/plugin', {
      params: { name },
    })
  }

  async updatePluginStatus(name: string, enabled: boolean) {
    return this.instance.put<NacosResponse>('/core/plugin/status', {
      name,
      enabled,
    })
  }

  async updatePluginConfig(name: string, config: Record<string, unknown>) {
    return this.instance.put<NacosResponse>('/core/plugin/config', {
      name,
      config,
    })
  }

  // ============================================
  // Config Sync API
  // ============================================

  async getSyncEnvironments() {
    return this.instance.get<NacosResponse<SyncEnvironment[]>>('/cs/config/sync/environments')
  }

  async getSyncHistory(tenant?: string) {
    return this.instance.get<NacosResponse<SyncHistory[]>>('/cs/config/sync/history', {
      params: { tenant },
    })
  }

  async syncConfigs(data: SyncRequest) {
    return this.instance.post<NacosResponse>('/cs/config/sync', data)
  }

  async addSyncEnvironment(data: { name: string; endpoint: string; accessToken?: string }) {
    return this.instance.post<NacosResponse>('/cs/config/sync/environment', data)
  }

  async deleteSyncEnvironment(id: string) {
    return this.instance.delete<NacosResponse>('/cs/config/sync/environment', {
      params: { id },
    })
  }
}

export default new NacosApi()
