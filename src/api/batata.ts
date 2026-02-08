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
  ServerState,
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
    // Backend has no logout endpoint; clear local tokens only
    storage.remove(config.storage.tokenKey)
    storage.remove(config.storage.usernameKey)
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
    const formData = new URLSearchParams()
    formData.append('dataId', data.dataId)
    formData.append('groupName', data.groupName)
    formData.append('content', data.content)
    if (data.type) formData.append('type', data.type)
    if (data.namespaceId) formData.append('namespaceId', data.namespaceId)
    if (data.appName) formData.append('appName', data.appName)
    if (data.desc) formData.append('desc', data.desc)
    if (data.configTags) formData.append('configTags', data.configTags)
    return this.instance.post<BatataResponse>('/cs/config', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  }

  async deleteConfig(dataId: string, groupName: string, tenant?: string) {
    return this.instance.delete<BatataResponse>('/cs/config', {
      params: { dataId, groupName, tenant },
    })
  }

  // TODO: Backend does not yet support batch delete - delete one by one
  async batchDeleteConfig(_ids: string[], _namespaceId?: string): Promise<never> {
    throw new ApiError(501, 'Batch delete is not supported by the server')
  }

  // TODO: Backend does not yet support clone
  async cloneConfig(_data: {
    ids: string
    targetNamespaceId: string
    policy: 'ABORT' | 'SKIP' | 'OVERWRITE'
  }): Promise<never> {
    throw new ApiError(501, 'Clone config is not supported by the server')
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
    // Backend returns { count, serviceList } instead of PageResult
    const response = await this.instance.get<
      BatataResponse<{ count: number; serviceList: ServiceInfo[] }>
    >('/ns/service/list', { params })

    // Transform to PageResult format expected by views
    const raw = response.data.data
    const pageNo = params.pageNo ?? 1
    const pageSize = params.pageSize ?? 20
    const transformed: PageResult<ServiceInfo> = {
      totalCount: raw.count,
      pageNumber: pageNo,
      pagesAvailable: Math.ceil(raw.count / pageSize),
      pageItems: raw.serviceList || [],
    }
    response.data.data = transformed as never

    return response as unknown as import('axios').AxiosResponse<
      BatataResponse<PageResult<ServiceInfo>>
    >
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
    const formData = new URLSearchParams()
    if (data.namespaceId) formData.append('customNamespaceId', data.namespaceId)
    formData.append('namespaceName', data.namespaceName)
    if (data.namespaceDesc) formData.append('namespaceDesc', data.namespaceDesc)
    return this.instance.post<BatataResponse>('/core/namespace', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  }

  async updateNamespace(data: {
    namespaceId: string
    namespaceName: string
    namespaceDesc?: string
  }) {
    const formData = new URLSearchParams()
    formData.append('namespaceId', data.namespaceId)
    formData.append('namespaceName', data.namespaceName)
    if (data.namespaceDesc) formData.append('namespaceDesc', data.namespaceDesc)
    return this.instance.put<BatataResponse>('/core/namespace', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  }

  async deleteNamespace(namespaceId: string) {
    return this.instance.delete<BatataResponse>('/core/namespace', {
      params: { namespaceId },
    })
  }

  // ============================================
  // Server State API
  // ============================================

  // Server state returns a flat object without BatataResponse wrapper,
  // so we use a raw axios call to bypass the response interceptor.
  async getServerState() {
    const headers: Record<string, string> = {}
    const token = storage.get(config.storage.tokenKey)
    if (token) headers.accessToken = token
    const username = storage.get(config.storage.usernameKey)
    if (username) headers.username = username

    return axios.get<ServerState>(`${config.api.baseUrl}/v3/console/server/state`, {
      headers,
      timeout: config.api.timeout,
    })
  }

  // ============================================
  // 集群管理 API
  // ============================================

  async getClusterNodes(params?: { keyword?: string }) {
    return this.instance.get<BatataResponse<NodeInfo[]>>('/core/cluster/nodes', { params })
  }

  // TODO: Backend does not yet support updating cluster nodes directly
  async updateClusterNode(_data: {
    address: string
    metadata?: Record<string, string>
  }): Promise<never> {
    throw new ApiError(501, 'Update cluster node is not supported by the server')
  }

  // ============================================
  // 用户管理 API
  // ============================================

  async getUserList(params?: {
    pageNo?: number
    pageSize?: number
    username?: string
    search?: 'accurate' | 'blur'
  }) {
    return this.getAuthInstance().get<BatataResponse<PageResult<UserInfo>>>('/user/list', {
      params,
    })
  }

  async searchUsers(username: string) {
    return this.getAuthInstance().get<BatataResponse<string[]>>('/user/search', {
      params: { username },
    })
  }

  async createUser(data: { username: string; password: string }) {
    const formData = new URLSearchParams()
    formData.append('username', data.username)
    formData.append('password', data.password)
    return this.getAuthInstance().post<BatataResponse>('/user', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  }

  async updateUser(data: { username: string; newPassword: string }) {
    const formData = new URLSearchParams()
    formData.append('username', data.username)
    formData.append('newPassword', data.newPassword)
    return this.getAuthInstance().put<BatataResponse>('/user', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  }

  async deleteUser(username: string) {
    return this.getAuthInstance().delete<BatataResponse>('/user', {
      params: { username },
    })
  }

  // ============================================
  // 角色管理 API
  // ============================================

  async getRoleList(params?: {
    pageNo?: number
    pageSize?: number
    username?: string
    role?: string
    search?: 'accurate' | 'blur'
  }) {
    return this.getAuthInstance().get<BatataResponse<PageResult<RoleInfo>>>('/role/list', {
      params,
    })
  }

  async searchRoles(role: string) {
    return this.getAuthInstance().get<BatataResponse<string[]>>('/role/search', {
      params: { role },
    })
  }

  async createRole(data: { role: string; username: string }) {
    const formData = new URLSearchParams()
    formData.append('role', data.role)
    formData.append('username', data.username)
    return this.getAuthInstance().post<BatataResponse>('/role', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  }

  async deleteRole(role: string, username: string) {
    return this.getAuthInstance().delete<BatataResponse>('/role', {
      params: { role, username },
    })
  }

  // ============================================
  // 权限管理 API
  // ============================================

  async getPermissionList(params?: {
    pageNo?: number
    pageSize?: number
    role?: string
    search?: 'accurate' | 'blur'
  }) {
    return this.getAuthInstance().get<BatataResponse<PageResult<PermissionInfo>>>(
      '/permission/list',
      { params },
    )
  }

  async createPermission(data: { role: string; resource: string; action: string }) {
    const formData = new URLSearchParams()
    formData.append('role', data.role)
    formData.append('resource', data.resource)
    formData.append('action', data.action)
    return this.getAuthInstance().post<BatataResponse>('/permission', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
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
  // Audit Log API
  // ============================================

  // TODO: Audit endpoints are not available in v3 console yet
  async getAuditLogList(
    _params: AuditLogSearch,
  ): Promise<AxiosResponse<BatataResponse<PageResult<AuditLogItem>>>> {
    throw new ApiError(501, 'Audit log is not supported by the server')
  }

  async getAuditLog(_id: number): Promise<AxiosResponse<BatataResponse<AuditLogItem>>> {
    throw new ApiError(501, 'Audit log is not supported by the server')
  }

  async getAuditStats(_params?: {
    tenantId?: string
    startTime?: string
    endTime?: string
  }): Promise<AxiosResponse<BatataResponse<unknown>>> {
    throw new ApiError(501, 'Audit stats is not supported by the server')
  }

  // ============================================
  // Beta/Gray Config API
  // ============================================

  async getBetaConfig(dataId: string, groupName: string, namespaceId?: string) {
    return this.instance.get<BatataResponse<ConfigGrayInfo>>('/cs/config/beta', {
      params: { dataId, groupName, namespaceId: namespaceId || '' },
    })
  }

  // TODO: Backend does not yet support publishing beta config
  async publishBetaConfig(_data: {
    dataId: string
    groupName: string
    content: string
    namespaceId?: string
    betaIps?: string
  }): Promise<never> {
    throw new ApiError(501, 'Publish beta config is not supported by the server')
  }

  // TODO: Backend does not yet support deleting beta config
  async deleteBetaConfig(
    _dataId: string,
    _groupName: string,
    _namespaceId?: string,
  ): Promise<never> {
    throw new ApiError(501, 'Delete beta config is not supported by the server')
  }

  // TODO: Backend does not yet support promoting beta config
  async promoteBetaConfig(
    _dataId: string,
    _groupName: string,
    _namespaceId?: string,
  ): Promise<never> {
    throw new ApiError(501, 'Promote beta config is not supported by the server')
  }

  // ============================================
  // User Registration API
  // ============================================

  async register(data: { username: string; password: string }) {
    const formData = new URLSearchParams()
    formData.append('username', data.username)
    formData.append('password', data.password)
    return this.getAuthInstance().post<BatataResponse>('/user', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
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

  // TODO: Backend does not yet support updating plugin status
  async updatePluginStatus(_name: string, _enabled: boolean): Promise<never> {
    throw new ApiError(501, 'Update plugin status is not supported by the server')
  }

  // TODO: Backend does not yet support updating plugin config
  async updatePluginConfig(_name: string, _pluginConfig: PluginConfigPayload): Promise<never> {
    throw new ApiError(501, 'Update plugin config is not supported by the server')
  }

  // ============================================
  // Config Sync API
  // ============================================

  // TODO: Config sync endpoints are not available in the server yet
  async getSyncEnvironments(): Promise<AxiosResponse<BatataResponse<SyncEnvironment[]>>> {
    throw new ApiError(501, 'Config sync is not supported by the server')
  }

  async getSyncHistory(_tenant?: string): Promise<AxiosResponse<BatataResponse<SyncHistory[]>>> {
    throw new ApiError(501, 'Config sync is not supported by the server')
  }

  async syncConfigs(_data: SyncRequest): Promise<never> {
    throw new ApiError(501, 'Config sync is not supported by the server')
  }

  async addSyncEnvironment(_data: {
    name: string
    endpoint: string
    accessToken?: string
  }): Promise<never> {
    throw new ApiError(501, 'Config sync is not supported by the server')
  }

  async deleteSyncEnvironment(_id: string): Promise<never> {
    throw new ApiError(501, 'Config sync is not supported by the server')
  }
}

export default new BatataApi()
