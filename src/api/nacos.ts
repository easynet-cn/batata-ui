import axios from 'axios'
import type { AxiosInstance, AxiosResponse } from 'axios'

// Nacos API响应接口
export interface NacosResponse<T = unknown> {
  code: number
  message: string
  data: T
}

// 服务实例接口
export interface ServiceInstance {
  instanceId: string
  ip: string
  port: number
  weight: number
  healthy: boolean
  enabled: boolean
  ephemeral: boolean
  clusterName: string
  serviceName: string
  metadata: Record<string, unknown>
}

// 服务信息接口
export interface ServiceInfo {
  name: string
  groupName: string
  clusterCount: number
  ipCount: number
  healthyInstanceCount: number
  triggerFlag: string
  metadata: Record<string, unknown>
}

// 配置项接口
export interface ConfigItem {
  dataId: string
  group: string
  tenant: string
  appName: string
  content: string
  md5: string
  type: string
  envs: string[]
  createTime: number
  modifyTime: number
}

// 命名空间接口
export interface Namespace {
  namespace: string
  namespaceShowName: string
  namespaceId: string
  quota: number
  configCount: number
  type: number
}

class NacosApi {
  private instance: AxiosInstance

  constructor(baseURL: string = 'http://localhost:8848/nacos/v1') {
    this.instance = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        // 可以在这里添加认证token
        const token = localStorage.getItem('nacos-token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      },
    )

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse<NacosResponse>) => {
        const { data } = response
        if (data.code !== 200 && data.code !== 0) {
          throw new Error(data.message || '请求失败')
        }
        return response
      },
      (error) => {
        console.error('API请求错误:', error)
        throw error
      },
    )
  }

  // 服务管理相关API
  async getServiceList(pageNo: number = 1, pageSize: number = 20, groupName?: string) {
    const params: Record<string, unknown> = { pageNo, pageSize }
    if (groupName) params.groupName = groupName

    return this.instance.get<NacosResponse<{ count: number; doms: ServiceInfo[] }>>(
      '/catalog/services',
      {
        params,
      },
    )
  }

  async getServiceDetail(serviceName: string, groupName?: string) {
    const params: Record<string, unknown> = { serviceName }
    if (groupName) params.groupName = groupName

    return this.instance.get<NacosResponse<ServiceInstance[]>>('/catalog/instances', {
      params,
    })
  }

  async createService(serviceName: string, groupName?: string, metadata?: Record<string, string>) {
    return this.instance.post<NacosResponse>('/catalog/services', {
      serviceName,
      groupName: groupName || 'DEFAULT_GROUP',
      metadata: metadata || {},
    })
  }

  async deleteService(serviceName: string, groupName?: string) {
    const params: Record<string, unknown> = { serviceName }
    if (groupName) params.groupName = groupName

    return this.instance.delete<NacosResponse>('/catalog/services', {
      params,
    })
  }

  // 配置管理相关API
  async getConfigList(
    pageNo: number = 1,
    pageSize: number = 20,
    dataId?: string,
    group?: string,
    tenant?: string,
  ) {
    const params: Record<string, unknown> = {
      pageNo,
      pageSize,
      search: 'accurate',
    }
    if (dataId) params.dataId = dataId
    if (group) params.group = group
    if (tenant) params.tenant = tenant

    return this.instance.get<NacosResponse<{ pageItems: ConfigItem[]; totalCount: number }>>(
      '/cs/configs',
      {
        params,
      },
    )
  }

  async getConfig(dataId: string, group: string, tenant?: string) {
    const params: Record<string, unknown> = { dataId, group }
    if (tenant) params.tenant = tenant

    return this.instance.get<string>('/cs/configs', { params })
  }

  async publishConfig(
    dataId: string,
    group: string,
    content: string,
    type?: string,
    tenant?: string,
  ) {
    const data: Record<string, unknown> = { dataId, group, content }
    if (type) data.type = type
    if (tenant) data.tenant = tenant

    return this.instance.post<NacosResponse>('/cs/configs', data)
  }

  async deleteConfig(dataId: string, group: string, tenant?: string) {
    const params: Record<string, unknown> = { dataId, group }
    if (tenant) params.tenant = tenant

    return this.instance.delete<NacosResponse>('/cs/configs', { params })
  }

  // 命名空间管理相关API
  async getNamespaceList() {
    return this.instance.get<NacosResponse<Namespace[]>>('/console/namespaces')
  }

  async createNamespace(namespaceId: string, namespaceName: string, namespaceDesc?: string) {
    const data: Record<string, unknown> = {
      namespaceId,
      namespaceName,
    }
    if (namespaceDesc) data.namespaceDesc = namespaceDesc

    return this.instance.post<NacosResponse>('/console/namespaces', data)
  }

  async deleteNamespace(namespaceId: string) {
    return this.instance.delete<NacosResponse>(`/console/namespaces/${namespaceId}`)
  }

  // 集群管理相关API
  async getClusterList() {
    return this.instance.get<NacosResponse<Record<string, unknown>>>('/cluster/list')
  }

  async getNodeList() {
    return this.instance.get<NacosResponse<Record<string, unknown>[]>>('/cluster/nodes')
  }

  // 用户认证相关API
  async login(username: string, password: string) {
    return this.instance.post<NacosResponse<{ accessToken: string; tokenTtl: number }>>(
      '/auth/login',
      {
        username,
        password,
      },
    )
  }

  async logout() {
    return this.instance.post<NacosResponse>('/auth/logout')
  }
}

export default new NacosApi()
