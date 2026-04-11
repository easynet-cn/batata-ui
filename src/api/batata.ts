import axios from 'axios'
import type { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios'
import { LRUCache } from 'lru-cache'
import type {
  ConfigInfo,
  ConfigBasicInfo,
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
  PluginBackendInfo,
  PluginBackendDetail,
  AuditLogItem,
  AuditLogSearch,
  PageResult,
  LoginResponse,
  SyncEnvironment,
  SyncHistory,
  SyncRequest,
  SkillListItem,
  SkillAdminDetail,
  SkillDocument,
  AgentSpecListItem,
  AgentSpecDetail,
  AgentSpecDocument,
  PromptMetaSummary,
  PromptMetaInfo,
  PromptGovernanceDetail,
  PromptVersionInfo,
  PromptVersionSummary,
  PromptPublishData,
  PromptLabelBindData,
} from '@/types'
import { config } from '@/config'
import { ApiError, AuthError, NetworkError, TimeoutError, ValidationError } from '@/utils/error'
import { setupRetryInterceptor } from '@/utils/retry'
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
  private activeControllers: Set<AbortController>

  constructor(baseURL: string = `${config.api.baseUrl}/v3/console`) {
    // Initialize cache
    this.cache = new LRUCache<string, AxiosResponse>({
      max: config.cache.maxSize,
      ttl: config.cache.ttl,
    })
    this.pendingRequests = new Map()
    this.activeControllers = new Set()

    // Create axios instance
    this.instance = axios.create({
      baseURL,
      timeout: config.api.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Retry interceptor (must be added before error classification)
    setupRetryInterceptor(this.instance, config.api.retryCount)

    // Request interceptor
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

        // Track AbortController if a signal is provided
        if (reqConfig.signal && (reqConfig.signal as AbortSignal).aborted === false) {
          const controller = (reqConfig as AxiosRequestConfig & { __controller?: AbortController })
            .__controller
          if (controller) {
            this.activeControllers.add(controller)
          }
        }

        return reqConfig
      },
      (error) => Promise.reject(error),
    )

    // Response interceptor
    this.instance.interceptors.response.use(
      (response: AxiosResponse<BatataResponse>) => {
        // Clean up tracked AbortController
        this.cleanupController(response.config)

        const { data } = response
        if (data.code !== 0 && data.code !== 200) {
          throw new ApiError(data.code, data.message || 'Request failed')
        }
        return response
      },
      (error) => {
        // Clean up tracked AbortController
        if (error.config) {
          this.cleanupController(error.config)
        }

        // Timeout detection (axios sets code to ECONNABORTED for timeouts)
        if (error.code === 'ECONNABORTED') {
          throw new TimeoutError()
        }

        // Cancelled requests should not throw visible errors
        if (axios.isCancel(error)) {
          throw error
        }

        if (!error.response) {
          throw new NetworkError()
        }
        const status = error.response?.status
        const respData = error.response?.data
        const message =
          typeof respData === 'string' ? respData : respData?.message || error.message || ''

        // 401 Unauthorized - token missing/expired → clear + redirect
        if (status === 401) {
          storage.remove(config.storage.tokenKey)
          storage.remove(config.storage.usernameKey)
          storage.remove(config.storage.userKey)

          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login'
          }

          throw new AuthError(message || 'Session expired. Please log in again.')
        }

        // 403 Forbidden - authenticated but lacking permission → surface error, do NOT clear token
        if (status === 403) {
          throw new ApiError(403, message || 'You do not have permission to perform this action.')
        }

        // 422 Unprocessable Entity - validation errors
        if (status === 422) {
          const fields: Record<string, string[]> =
            typeof respData === 'object' && respData?.errors ? respData.errors : {}
          throw new ValidationError(message || 'Validation failed', fields)
        }

        // 503 Service Unavailable - server is in maintenance/draining mode
        if (status === 503) {
          throw new ApiError(503, 'Server is under maintenance. Please try again later.')
        }

        // 502 Bad Gateway - server may be restarting
        if (status === 502) {
          throw new ApiError(502, 'Server is temporarily unavailable. It may be restarting.')
        }

        throw new ApiError(respData?.code || status || 500, message)
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

  // Remove a controller from tracking after request completes
  private cleanupController(reqConfig: AxiosRequestConfig) {
    const controller = (reqConfig as AxiosRequestConfig & { __controller?: AbortController })
      .__controller
    if (controller) {
      this.activeControllers.delete(controller)
    }
  }

  // Create an AbortController tracked by this API instance.
  // Pass the returned signal into request options to enable cancellation.
  createAbortController(): AbortController {
    const controller = new AbortController()
    this.activeControllers.add(controller)
    return controller
  }

  // Cancel all in-flight requests that were created via createAbortController()
  cancelPendingRequests() {
    for (const controller of this.activeControllers) {
      controller.abort()
    }
    this.activeControllers.clear()
  }

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

      // Retry interceptor (must be added before error classification)
      setupRetryInterceptor(this.authInstance, config.api.retryCount)

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
          const status = error.response?.status
          const respData = error.response?.data
          const message =
            typeof respData === 'string' ? respData : respData?.message || error.message || ''

          // 401 Unauthorized - token missing/expired → clear + redirect
          if (status === 401) {
            storage.remove(config.storage.tokenKey)
            storage.remove(config.storage.usernameKey)
            storage.remove(config.storage.userKey)

            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login'
            }

            throw new AuthError(message || 'Session expired. Please log in again.')
          }

          // 403 Forbidden - authenticated but lacking permission
          if (status === 403) {
            throw new ApiError(403, message || 'You do not have permission to perform this action.')
          }

          // 503 Service Unavailable - server is in maintenance/draining mode
          if (status === 503) {
            throw new ApiError(503, 'Server is under maintenance. Please try again later.')
          }

          // 502 Bad Gateway - server may be restarting
          if (status === 502) {
            throw new ApiError(502, 'Server is temporarily unavailable. It may be restarting.')
          }

          throw new ApiError(respData?.code || status || 500, message)
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

  async initAdmin(password: string) {
    const formData = new URLSearchParams()
    formData.append('username', 'batata')
    formData.append('password', password)
    return this.getAuthInstance().post<LoginResponse>('/user/admin', formData, {
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

  async deleteConfig(dataId: string, groupName: string, namespaceId?: string) {
    return this.instance.delete<BatataResponse>('/cs/config', {
      params: { dataId, groupName, namespaceId },
    })
  }

  async batchDeleteConfig(ids: string[], namespaceId?: string) {
    return this.instance.delete<BatataResponse>('/cs/config/batchDelete', {
      params: { ids: ids.join(','), namespaceId },
    })
  }

  async cloneConfig(data: {
    configBeans: Array<{ cfgId: number; dataId: string; group: string }>
    targetNamespaceId: string
    policy: 'ABORT' | 'SKIP' | 'OVERWRITE'
  }) {
    return this.instance.post<BatataResponse>('/cs/config/clone', data.configBeans, {
      params: { targetNamespaceId: data.targetNamespaceId, policy: data.policy },
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
    return this.instance.get('/cs/config/export2', {
      params: { dataIds: ids.join(','), namespaceId },
      responseType: 'blob',
    })
  }

  // Configs that have history records
  async getHistoryConfigs(namespaceId?: string) {
    return this.instance.get<BatataResponse<ConfigBasicInfo[]>>('/cs/history/configs', {
      params: { namespaceId },
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

  async getHistoryPrevious(params: {
    dataId: string
    groupName: string
    namespaceId?: string
    id: string | number
  }) {
    return this.instance.get<BatataResponse<ConfigHistoryInfo>>('/cs/history/previous', { params })
  }

  async rollbackConfig(nid: string, dataId: string, groupName: string, namespaceId?: string) {
    return this.instance.post<BatataResponse>('/cs/history/rollback', null, {
      params: { nid, dataId, groupName, namespaceId },
    })
  }

  // 配置监听
  async getConfigListeners(params: { dataId?: string; groupName?: string; namespaceId?: string }) {
    return this.instance.get<BatataResponse<ConfigListenerInfo | null>>('/cs/config/listener', {
      params,
    })
  }

  async getConfigListenersByIp(params: { ip: string; namespaceId?: string; all?: boolean }) {
    return this.instance.get<BatataResponse<ConfigListenerInfo>>('/cs/config/listener/ip', {
      params,
    })
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
    search?: 'accurate' | 'blur'
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
  async getInstanceList(
    serviceName: string,
    groupName: string,
    namespaceId?: string,
    pageNo = 1,
    pageSize = 100,
  ) {
    return this.instance.get<
      BatataResponse<{
        totalCount: number
        pageNumber: number
        pagesAvailable: number
        list: InstanceInfo[]
      }>
    >('/ns/instance/list', {
      params: { serviceName, groupName, namespaceId, pageNo, pageSize },
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

  async deleteInstance(params: {
    serviceName: string
    groupName?: string
    namespaceId?: string
    ip: string
    port: number
    clusterName?: string
  }) {
    return this.instance.delete<BatataResponse>('/ns/instance', { params })
  }

  // 集群管理
  async updateCluster(data: {
    serviceName: string
    groupName?: string
    namespaceId?: string
    clusterName: string
    healthChecker: { type: string; path?: string; headers?: string }
    healthyCheckPort?: number
    useInstancePortForCheck?: boolean
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
    const response = await this.instance.get<
      BatataResponse<{ count: number; subscribers: SubscriberInfo[] }>
    >('/ns/service/subscribers', { params })

    // Transform to PageResult format expected by views
    const raw = response.data.data
    const pageNo = params.pageNo ?? 1
    const pageSize = params.pageSize ?? 20
    const transformed: PageResult<SubscriberInfo> = {
      totalCount: raw.count,
      pageNumber: pageNo,
      pagesAvailable: Math.ceil(raw.count / pageSize),
      pageItems: raw.subscribers || [],
    }
    response.data.data = transformed as never

    return response as unknown as import('axios').AxiosResponse<
      BatataResponse<PageResult<SubscriberInfo>>
    >
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

  // Nacos V1/V2 defined leave/delete but returns 405 "not allow to use temporarily"; V3 removed it entirely
  async leaveClusterNode(_address: string): Promise<never> {
    throw new ApiError(501, 'Leave cluster node is not supported by the server')
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
  // Aligned with Nacos V3 Console API
  // ============================================

  async getMcpServerList(params?: {
    pageNo?: number
    pageSize?: number
    namespaceId?: string
    search?: string
  }) {
    return this.instance.get<BatataResponse<PageResult<McpServerInfo>>>('/ai/mcp/list', {
      params: {
        pageNo: params?.pageNo,
        pageSize: params?.pageSize,
        namespaceId: params?.namespaceId,
        mcpName: params?.search || undefined,
        search: params?.search ? 'blur' : undefined,
      },
    })
  }

  async getMcpServerDetail(namespace: string, name: string) {
    return this.instance.get<BatataResponse<McpServerInfo>>('/ai/mcp', {
      params: {
        namespaceId: namespace,
        mcpName: name,
      },
    })
  }

  async createMcpServer(data: McpServerPayload) {
    return this.instance.post<BatataResponse>('/ai/mcp', data)
  }

  async updateMcpServer(namespace: string, name: string, data: Partial<McpServerPayload>) {
    return this.instance.put<BatataResponse>('/ai/mcp', data, {
      params: {
        namespaceId: namespace,
        mcpName: name,
      },
    })
  }

  async deleteMcpServer(namespace: string, name: string) {
    return this.instance.delete<BatataResponse>('/ai/mcp', {
      params: {
        namespaceId: namespace,
        mcpName: name,
      },
    })
  }

  async importMcpServers(data: McpServerImportPayload) {
    return this.instance.post<BatataResponse>('/ai/mcp/import', data)
  }

  async importToolsFromMcp(params: {
    transportType: string
    baseUrl: string
    endpoint: string
    authToken?: string
  }) {
    return this.instance.get<BatataResponse>('/ai/mcp/importToolsFromMcp', { params })
  }

  async validateMcpImport(data: { content: string }) {
    return this.instance.post<BatataResponse>('/ai/mcp/import/validate', data)
  }

  async executeMcpImport(data: { content: string; namespace?: string; overwrite?: boolean }) {
    return this.instance.post<BatataResponse>('/ai/mcp/import/execute', data)
  }

  async validateOpenApiSpec(data: { content: string; format?: string }) {
    return this.instance.post<
      BatataResponse<{
        tools: Array<{ name: string; description: string; inputSchema?: Record<string, unknown> }>
      }>
    >('/ai/mcp/openapi/validate', data)
  }

  async importOpenApiTools(data: {
    mcpServerName?: string
    content: string
    format?: string
    selectedTools?: string[]
  }) {
    return this.instance.post<BatataResponse>('/ai/mcp/openapi/import', data)
  }

  // ============================================
  // Agent (A2A) Management API (/v3/console/ai/a2a)
  // Aligned with Nacos V3 Console API
  // ============================================

  async getAgentList(params?: {
    pageNo?: number
    pageSize?: number
    namespaceId?: string
    name?: string
  }) {
    return this.instance.get<BatataResponse<PageResult<AgentInfo>>>('/ai/a2a/list', {
      params: {
        pageNo: params?.pageNo,
        pageSize: params?.pageSize,
        namespaceId: params?.namespaceId,
        agentName: params?.name || undefined,
        search: params?.name ? 'blur' : undefined,
      },
    })
  }

  async getAgentDetail(namespace: string, name: string) {
    return this.instance.get<BatataResponse<AgentInfo>>('/ai/a2a', {
      params: {
        namespaceId: namespace,
        agentName: name,
      },
    })
  }

  async createAgent(data: AgentPayload) {
    return this.instance.post<BatataResponse>('/ai/a2a', data)
  }

  async updateAgent(namespace: string, name: string, data: Partial<AgentPayload>) {
    return this.instance.put<BatataResponse>('/ai/a2a', data, {
      params: {
        namespaceId: namespace,
        agentName: name,
      },
    })
  }

  async deleteAgent(namespace: string, name: string) {
    return this.instance.delete<BatataResponse>('/ai/a2a', {
      params: {
        namespaceId: namespace,
        agentName: name,
      },
    })
  }

  async getAgentVersionList(params: { namespaceId?: string; agentName?: string }) {
    return this.instance.get<BatataResponse>('/ai/a2a/version/list', { params })
  }

  // ============================================
  // Audit Log API
  // ============================================

  async getAuditLogList(params: AuditLogSearch) {
    return this.instance.get<BatataResponse<PageResult<AuditLogItem>>>('/audit/logs', { params })
  }

  async getAuditLog(id: number) {
    return this.instance.get<BatataResponse<AuditLogItem>>(`/audit/logs/${id}`)
  }

  async getAuditStats(params?: { tenantId?: string; startTime?: string; endTime?: string }) {
    return this.instance.get<BatataResponse<unknown>>('/audit/stats', { params })
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
    grayName?: string
    grayRule?: string
    betaIps?: string
    appName?: string
  }) {
    const formData = new URLSearchParams()
    formData.append('dataId', data.dataId)
    formData.append('groupName', data.groupName)
    formData.append('content', data.content)
    if (data.namespaceId) formData.append('namespaceId', data.namespaceId)
    if (data.betaIps) formData.append('betaIps', data.betaIps)
    if (data.appName) formData.append('appName', data.appName)
    return this.instance.post<BatataResponse>('/cs/config/beta', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  }

  async deleteBetaConfig(dataId: string, groupName: string, namespaceId?: string) {
    return this.instance.delete<BatataResponse>('/cs/config/beta', {
      params: { dataId, groupName, namespaceId },
    })
  }

  async promoteBetaConfig(dataId: string, groupName: string, namespaceId?: string) {
    // Nacos "stopBeta" = get beta content, publish as formal config, then delete beta
    const betaResponse = await this.getBetaConfig(dataId, groupName, namespaceId)
    const betaConfig = betaResponse.data.data
    if (betaConfig && betaConfig.content) {
      await this.publishConfig({
        dataId,
        groupName,
        content: betaConfig.content,
        namespaceId,
      })
    }
    return this.deleteBetaConfig(dataId, groupName, namespaceId)
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
  // Plugin Management API (/v3/console/plugin)
  // ============================================

  async getPluginList(pluginType?: string) {
    return this.instance.get<BatataResponse<PluginBackendInfo[]>>('/plugin/list', {
      params: pluginType ? { pluginType } : undefined,
    })
  }

  async getPluginDetail(pluginType: string, pluginName: string) {
    return this.instance.get<BatataResponse<PluginBackendDetail>>('/plugin', {
      params: { pluginType, pluginName },
    })
  }

  async updatePluginStatus(pluginType: string, pluginName: string, enabled: boolean) {
    return this.instance.put<BatataResponse>('/plugin/status', null, {
      params: { pluginType, pluginName, enabled },
    })
  }

  async updatePluginConfig(
    pluginType: string,
    pluginName: string,
    pluginConfig: PluginConfigPayload,
  ) {
    return this.instance.put<BatataResponse>('/plugin/config', {
      pluginType,
      pluginName,
      config: pluginConfig,
    })
  }

  async getPluginAvailability(pluginType: string, pluginName: string) {
    return this.instance.get<BatataResponse<Record<string, boolean>>>('/plugin/availability', {
      params: { pluginType, pluginName },
    })
  }

  // ============================================
  // Config Sync API
  // ============================================

  async getSyncEnvironments() {
    return this.instance.get<BatataResponse<SyncEnvironment[]>>('/sync/environments')
  }

  async getSyncHistory(tenant?: string) {
    return this.instance.get<BatataResponse<SyncHistory[]>>('/sync/history', {
      params: { tenant },
    })
  }

  async syncConfigs(data: SyncRequest) {
    return this.instance.post<BatataResponse>('/sync/configs', data)
  }

  async getTraceList(params: {
    serviceName?: string
    operationName?: string
    traceId?: string
    timeRange?: string
    minDuration?: number
    maxDuration?: number
    errorsOnly?: boolean
    rootSpansOnly?: boolean
    page?: number
    pageSize?: number
  }) {
    return this.instance.get<BatataResponse<PageResult<unknown>>>('/trace/list', { params })
  }

  async getTraceServices() {
    return this.instance.get<BatataResponse<string[]>>('/trace/services')
  }

  // ============================================
  // Skill Management API (/v3/console/ai/skills)
  // ============================================

  async getSkillList(params?: {
    pageNo?: number
    pageSize?: number
    namespaceId?: string
    skillName?: string
    search?: string
    orderBy?: string
  }) {
    return this.instance.get<BatataResponse<PageResult<SkillListItem>>>('/ai/skills/list', {
      params,
    })
  }

  async getSkillDetail(namespaceId: string, skillName: string) {
    return this.instance.get<BatataResponse<SkillAdminDetail>>('/ai/skills', {
      params: { namespaceId, skillName },
    })
  }

  async getSkillVersion(namespaceId: string, skillName: string, version: string) {
    return this.instance.get<BatataResponse<SkillDocument>>('/ai/skills/version', {
      params: { namespaceId, skillName, version },
    })
  }

  async downloadSkillVersion(namespaceId: string, skillName: string, version: string) {
    return this.instance.get<Blob>('/ai/skills/version/download', {
      params: { namespaceId, skillName, version },
      responseType: 'blob',
    })
  }

  async uploadSkill(formData: FormData) {
    return this.instance.post<BatataResponse<string>>('/ai/skills/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  }

  async deleteSkill(namespaceId: string, skillName: string) {
    return this.instance.delete<BatataResponse<string>>('/ai/skills', {
      params: { namespaceId, skillName },
    })
  }

  async createSkillDraft(data: {
    namespaceId?: string
    skillName: string
    basedOnVersion?: string
    targetVersion?: string
    skillCard?: string
  }) {
    return this.instance.post<BatataResponse<string>>('/ai/skills/draft', data)
  }

  async updateSkillDraft(data: {
    namespaceId?: string
    skillCard: SkillDocument
    setAsLatest?: boolean
  }) {
    return this.instance.put<BatataResponse<string>>('/ai/skills/draft', data)
  }

  async deleteSkillDraft(namespaceId: string, skillName: string) {
    return this.instance.delete<BatataResponse<string>>('/ai/skills/draft', {
      params: { namespaceId, skillName },
    })
  }

  async submitSkill(namespaceId: string, skillName: string, version?: string) {
    return this.instance.post<BatataResponse<string>>('/ai/skills/submit', null, {
      params: { namespaceId, skillName, version },
    })
  }

  async publishSkill(data: {
    namespaceId?: string
    skillName: string
    version: string
    updateLatestLabel?: boolean
  }) {
    return this.instance.post<BatataResponse<string>>('/ai/skills/publish', null, { params: data })
  }

  async forcePublishSkill(data: {
    namespaceId?: string
    skillName: string
    version: string
    updateLatestLabel?: boolean
  }) {
    return this.instance.post<BatataResponse<string>>('/ai/skills/force-publish', null, {
      params: data,
    })
  }

  async updateSkillLabels(namespaceId: string, skillName: string, labels: Record<string, string>) {
    return this.instance.put<BatataResponse<string>>(
      '/ai/skills/labels',
      { labels },
      {
        params: { namespaceId, skillName },
      },
    )
  }

  async updateSkillBizTags(namespaceId: string, skillName: string, bizTags: string) {
    return this.instance.put<BatataResponse<string>>('/ai/skills/biz-tags', null, {
      params: { namespaceId, skillName, bizTags },
    })
  }

  async onlineSkill(params: {
    namespaceId?: string
    skillName: string
    scope?: string
    version?: string
  }) {
    return this.instance.post<BatataResponse<string>>('/ai/skills/online', null, { params })
  }

  async offlineSkill(params: {
    namespaceId?: string
    skillName: string
    scope?: string
    version?: string
  }) {
    return this.instance.post<BatataResponse<string>>('/ai/skills/offline', null, { params })
  }

  async updateSkillScope(namespaceId: string, skillName: string, scope: string) {
    return this.instance.put<BatataResponse<string>>('/ai/skills/scope', null, {
      params: { namespaceId, skillName, scope },
    })
  }

  // ============================================
  // AgentSpec Management API (/v3/console/ai/agentspecs)
  // ============================================

  async getAgentSpecList(params?: {
    pageNo?: number
    pageSize?: number
    namespaceId?: string
    agentSpecName?: string
    search?: string
    orderBy?: string
  }) {
    return this.instance.get<BatataResponse<PageResult<AgentSpecListItem>>>('/ai/agentspecs/list', {
      params,
    })
  }

  async getAgentSpecDetail(namespaceId: string, agentSpecName: string) {
    return this.instance.get<BatataResponse<AgentSpecDetail>>('/ai/agentspecs', {
      params: { namespaceId, agentSpecName },
    })
  }

  async getAgentSpecVersion(namespaceId: string, agentSpecName: string, version: string) {
    return this.instance.get<BatataResponse<AgentSpecDocument>>('/ai/agentspecs/version', {
      params: { namespaceId, agentSpecName, version },
    })
  }

  async deleteAgentSpec(namespaceId: string, agentSpecName: string) {
    return this.instance.delete<BatataResponse<string>>('/ai/agentspecs', {
      params: { namespaceId, agentSpecName },
    })
  }

  async uploadAgentSpec(formData: FormData) {
    return this.instance.post<BatataResponse<string>>('/ai/agentspecs/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  }

  async createAgentSpecDraft(data: {
    namespaceId?: string
    agentSpecName: string
    basedOnVersion?: string
  }) {
    return this.instance.post<BatataResponse<string>>('/ai/agentspecs/draft', null, {
      params: data,
    })
  }

  async updateAgentSpecDraft(data: {
    namespaceId?: string
    agentSpecCard: AgentSpecDocument
    setAsLatest?: boolean
  }) {
    return this.instance.put<BatataResponse<string>>('/ai/agentspecs/draft', data)
  }

  async deleteAgentSpecDraft(namespaceId: string, agentSpecName: string) {
    return this.instance.delete<BatataResponse<string>>('/ai/agentspecs/draft', {
      params: { namespaceId, agentSpecName },
    })
  }

  async submitAgentSpec(namespaceId: string, agentSpecName: string, version: string) {
    return this.instance.post<BatataResponse<string>>('/ai/agentspecs/submit', null, {
      params: { namespaceId, agentSpecName, version },
    })
  }

  async publishAgentSpec(data: {
    namespaceId?: string
    agentSpecName: string
    version: string
    updateLatestLabel?: boolean
  }) {
    return this.instance.post<BatataResponse<string>>('/ai/agentspecs/publish', null, {
      params: data,
    })
  }

  async forcePublishAgentSpec(data: {
    namespaceId?: string
    agentSpecName: string
    version: string
    updateLatestLabel?: boolean
  }) {
    return this.instance.post<BatataResponse<string>>('/ai/agentspecs/force-publish', null, {
      params: data,
    })
  }

  async downloadAgentSpecVersion(namespaceId: string, agentSpecName: string, version: string) {
    return this.instance.get<Blob>('/ai/agentspecs/version/download', {
      params: { namespaceId, agentSpecName, version },
      responseType: 'blob',
    })
  }

  async updateAgentSpecLabels(
    namespaceId: string,
    agentSpecName: string,
    labels: Record<string, string>,
  ) {
    return this.instance.put<BatataResponse<string>>(
      '/ai/agentspecs/labels',
      { labels },
      {
        params: { namespaceId, agentSpecName },
      },
    )
  }

  async updateAgentSpecBizTags(namespaceId: string, agentSpecName: string, bizTags: string) {
    return this.instance.put<BatataResponse<string>>('/ai/agentspecs/biz-tags', null, {
      params: { namespaceId, agentSpecName, bizTags },
    })
  }

  async updateAgentSpecScope(namespaceId: string, agentSpecName: string, scope: string) {
    return this.instance.put<BatataResponse<string>>('/ai/agentspecs/scope', null, {
      params: { namespaceId, agentSpecName, scope },
    })
  }

  async onlineAgentSpec(params: {
    namespaceId?: string
    agentSpecName: string
    scope?: string
    version?: string
  }) {
    return this.instance.post<BatataResponse<string>>('/ai/agentspecs/online', null, { params })
  }

  async offlineAgentSpec(params: {
    namespaceId?: string
    agentSpecName: string
    scope?: string
    version?: string
  }) {
    return this.instance.post<BatataResponse<string>>('/ai/agentspecs/offline', null, { params })
  }

  // ============================================
  // Prompt Management API (/v3/console/ai/prompt)
  // ============================================

  async getPromptList(params?: {
    promptKey?: string
    namespaceId?: string
    search?: PromptMetaSummary extends { bizTags: string[] } ? 'accurate' | 'blur' : string
    pageNo?: number
    pageSize?: number
  }) {
    return this.instance.get<BatataResponse<PageResult<PromptMetaSummary>>>('/ai/prompt/list', {
      params,
    })
  }

  async getPromptMetadata(promptKey: string, namespaceId?: string) {
    return this.instance.get<BatataResponse<PromptMetaInfo>>('/ai/prompt/metadata', {
      params: { promptKey, namespaceId },
    })
  }

  async getPromptDetail(params: {
    promptKey: string
    version?: string
    label?: string
    namespaceId?: string
  }) {
    return this.instance.get<BatataResponse<PromptVersionInfo>>('/ai/prompt/detail', { params })
  }

  async getPromptVersions(params: {
    promptKey: string
    namespaceId?: string
    pageNo?: number
    pageSize?: number
  }) {
    return this.instance.get<BatataResponse<PageResult<PromptVersionSummary>>>(
      '/ai/prompt/versions',
      { params },
    )
  }

  async publishPrompt(data: PromptPublishData) {
    const formData = new URLSearchParams()
    formData.append('promptKey', data.promptKey)
    formData.append('version', data.version)
    formData.append('template', data.template)
    if (data.commitMsg) formData.append('commitMsg', data.commitMsg)
    if (data.description) formData.append('description', data.description)
    if (data.bizTags) formData.append('bizTags', data.bizTags)
    if (data.variables) formData.append('variables', data.variables)
    if (data.namespaceId) formData.append('namespaceId', data.namespaceId)
    return this.instance.post<BatataResponse<boolean>>('/ai/prompt', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  }

  async updatePromptMetadata(data: {
    promptKey: string
    description?: string
    bizTags?: string
    namespaceId?: string
  }) {
    const formData = new URLSearchParams()
    formData.append('promptKey', data.promptKey)
    if (data.description) formData.append('description', data.description)
    if (data.bizTags) formData.append('bizTags', data.bizTags)
    if (data.namespaceId) formData.append('namespaceId', data.namespaceId)
    return this.instance.put<BatataResponse<boolean>>('/ai/prompt/metadata', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  }

  async bindPromptLabel(data: PromptLabelBindData) {
    const formData = new URLSearchParams()
    formData.append('promptKey', data.promptKey)
    formData.append('label', data.label)
    formData.append('version', data.version)
    if (data.namespaceId) formData.append('namespaceId', data.namespaceId)
    return this.instance.put<BatataResponse<boolean>>('/ai/prompt/label', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  }

  async unbindPromptLabel(promptKey: string, label: string, namespaceId?: string) {
    return this.instance.delete<BatataResponse<boolean>>('/ai/prompt/label', {
      params: { promptKey, label, namespaceId },
    })
  }

  async deletePrompt(promptKey: string, namespaceId?: string) {
    return this.instance.delete<BatataResponse<boolean>>('/ai/prompt', {
      params: { promptKey, namespaceId },
    })
  }

  // Prompt governance detail (with version lifecycle info)
  async getPromptGovernance(promptKey: string, namespaceId?: string) {
    return this.instance.get<BatataResponse<PromptGovernanceDetail>>('/ai/prompt/governance', {
      params: { promptKey, namespaceId },
    })
  }

  // Prompt draft lifecycle
  async createPromptDraft(data: {
    promptKey: string
    template: string
    commitMsg?: string
    description?: string
    bizTags?: string
    variables?: string
    namespaceId?: string
  }) {
    const formData = new URLSearchParams()
    formData.append('promptKey', data.promptKey)
    formData.append('template', data.template)
    if (data.commitMsg) formData.append('commitMsg', data.commitMsg)
    if (data.description) formData.append('description', data.description)
    if (data.bizTags) formData.append('bizTags', data.bizTags)
    if (data.variables) formData.append('variables', data.variables)
    if (data.namespaceId) formData.append('namespaceId', data.namespaceId)
    return this.instance.post<BatataResponse<boolean>>('/ai/prompt/draft', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  }

  async updatePromptDraft(data: {
    promptKey: string
    template: string
    commitMsg?: string
    variables?: string
    namespaceId?: string
  }) {
    const formData = new URLSearchParams()
    formData.append('promptKey', data.promptKey)
    formData.append('template', data.template)
    if (data.commitMsg) formData.append('commitMsg', data.commitMsg)
    if (data.variables) formData.append('variables', data.variables)
    if (data.namespaceId) formData.append('namespaceId', data.namespaceId)
    return this.instance.put<BatataResponse<boolean>>('/ai/prompt/draft', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  }

  async deletePromptDraft(promptKey: string, namespaceId?: string) {
    return this.instance.delete<BatataResponse<boolean>>('/ai/prompt/draft', {
      params: { promptKey, namespaceId },
    })
  }

  async submitPrompt(promptKey: string, namespaceId?: string) {
    return this.instance.post<BatataResponse<boolean>>('/ai/prompt/submit', null, {
      params: { promptKey, namespaceId },
    })
  }

  async forcePublishPrompt(data: { promptKey: string; version?: string; namespaceId?: string }) {
    return this.instance.post<BatataResponse<boolean>>('/ai/prompt/force-publish', null, {
      params: data,
    })
  }

  async onlinePrompt(params: { promptKey: string; version?: string; namespaceId?: string }) {
    return this.instance.post<BatataResponse<boolean>>('/ai/prompt/online', null, { params })
  }

  async offlinePrompt(params: { promptKey: string; version?: string; namespaceId?: string }) {
    return this.instance.post<BatataResponse<boolean>>('/ai/prompt/offline', null, { params })
  }

  async updatePromptDescription(data: {
    promptKey: string
    description: string
    namespaceId?: string
  }) {
    const formData = new URLSearchParams()
    formData.append('promptKey', data.promptKey)
    formData.append('description', data.description)
    if (data.namespaceId) formData.append('namespaceId', data.namespaceId)
    return this.instance.put<BatataResponse<boolean>>('/ai/prompt/description', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  }

  async updatePromptBizTags(data: { promptKey: string; bizTags: string; namespaceId?: string }) {
    return this.instance.put<BatataResponse<boolean>>('/ai/prompt/biz-tags', null, {
      params: data,
    })
  }

  async updatePromptLabels(data: {
    promptKey: string
    labels: Record<string, string>
    namespaceId?: string
  }) {
    return this.instance.put<BatataResponse<boolean>>(
      '/ai/prompt/labels',
      { labels: data.labels },
      { params: { promptKey: data.promptKey, namespaceId: data.namespaceId } },
    )
  }

  // ============================================
  // Config History Detail API
  // ============================================

  async getConfigHistoryDetail(nid: string, dataId: string, groupName: string) {
    return this.instance.get<BatataResponse<ConfigHistoryInfo>>('/cs/history', {
      params: { nid, dataId, groupName },
    })
  }
  // ============================================
  // Copilot API
  // ============================================

  /**
   * Get Copilot configuration
   */
  async getCopilotConfig() {
    return this.instance.get<BatataResponse<import('@/types/copilot').CopilotConfig>>(
      '/copilot/config',
    )
  }

  /**
   * Save Copilot configuration
   */
  async saveCopilotConfig(config: import('@/types/copilot').CopilotConfigUpdate) {
    return this.instance.post<BatataResponse<boolean>>('/copilot/config', config)
  }

  // Note: Copilot streaming endpoints (skill/optimize, skill/generate,
  // prompt/optimize, prompt/debug) use SSE via fetch API directly,
  // not through axios. See @/utils/sse.ts for the streaming utility.
  // Full paths:
  //   POST /v3/console/copilot/skill/optimize  (SSE)
  //   POST /v3/console/copilot/skill/generate  (SSE)
  //   POST /v3/console/copilot/prompt/optimize (SSE)
  //   POST /v3/console/copilot/prompt/debug    (SSE)

  // ============================================
  // Pipeline API
  // ============================================

  /**
   * Get pipeline execution by ID
   */
  async getPipelineExecution(executionId: string) {
    return this.instance.get<BatataResponse<import('@/types/copilot').StreamChunk>>(
      `/ai/pipelines/${executionId}`,
    )
  }

  /**
   * List pipeline executions
   */
  async listPipelineExecutions(params: {
    resourceType: string
    resourceName?: string
    namespaceId?: string
    version?: string
    pageNo?: number
    pageSize?: number
  }) {
    return this.instance.get<BatataResponse<unknown>>('/ai/pipelines', { params })
  }
}

export default new BatataApi()
