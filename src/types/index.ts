// ============================================
// 通用类型
// ============================================

export interface PageResult<T> {
  totalCount: number
  pageNumber: number
  pagesAvailable: number
  pageItems: T[]
}

export interface ListResult<T> {
  count: number
  data: T[]
}

// ============================================
// 配置管理类型
// ============================================

export type ConfigType = 'text' | 'json' | 'xml' | 'yaml' | 'html' | 'properties' | 'toml'

export interface ConfigInfo {
  id: string
  dataId: string
  group: string
  appName: string
  content: string
  type: ConfigType
  md5: string
  tenant: string
  desc?: string
  createTime: number
  modifyTime: number
  encryptedDataKey?: string
}

export interface ConfigHistoryInfo {
  id: string
  dataId: string
  group: string
  tenant: string
  appName: string
  md5: string
  content: string
  srcIp: string
  srcUser: string
  opType: string
  createdTime: string
  lastModifiedTime: string
}

export interface ConfigListenerInfo {
  dataId: string
  group: string
  lisentersGroupkeyStatus: string
  md5: string
  listeningIp?: string
}

// ============================================
// 服务管理类型
// ============================================

export interface ServiceInfo {
  name: string
  groupName: string
  clusterCount: number
  ipCount: number
  healthyInstanceCount: number
  triggerFlag?: string
  protectThreshold?: number
  metadata?: Record<string, string>
  selector?: {
    type: string
    expression?: string
  }
}

export interface ServiceDetail extends ServiceInfo {
  clusters: ClusterInfo[]
}

export interface ClusterInfo {
  name: string
  healthChecker: {
    type: 'TCP' | 'HTTP' | 'MYSQL' | 'NONE'
    path?: string
    headers?: string
  }
  metadata?: Record<string, string>
  instances?: InstanceInfo[]
}

export interface InstanceInfo {
  instanceId: string
  ip: string
  port: number
  weight: number
  healthy: boolean
  enabled: boolean
  ephemeral: boolean
  clusterName: string
  serviceName: string
  metadata: Record<string, string>
}

export interface SubscriberInfo {
  addrStr: string
  agent: string
  app: string
  namespaceId?: string
  serviceName?: string
  groupName?: string
}

// ============================================
// 命名空间类型
// ============================================

export interface Namespace {
  namespace: string
  namespaceId?: string
  namespaceShowName: string
  namespaceDesc?: string
  type: number // 0: global, 1: default, 2: custom
  quota: number
  configCount: number
  serviceCount?: number
}

// ============================================
// 集群管理类型
// ============================================

export interface NodeInfo {
  ip: string
  port: number
  state: 'UP' | 'DOWN' | 'SUSPICIOUS'
  address: string
  failAccessCnt?: number
  abilities?: {
    remoteAbility?: {
      supportRemoteConnection: boolean
    }
    configAbility?: {
      supportRemoteMetrics: boolean
    }
    namingAbility?: {
      supportDeltaPush: boolean
      supportJraft: boolean
    }
  }
  extendInfo?: Record<string, unknown>
  metadata?: Record<string, string>
}

// ============================================
// 权限控制类型
// ============================================

export interface UserInfo {
  username: string
  password?: string
  enabled?: boolean
}

export interface RoleInfo {
  role: string
  username: string
}

export interface PermissionInfo {
  role: string
  resource: string
  action: 'r' | 'w' | 'rw'
}

// ============================================
// AI/MCP 管理类型
// ============================================

export interface McpServerInfo {
  id: string
  name: string
  type: 'stdio' | 'sse' | 'http'
  enabled: boolean
  description?: string
  // stdio type fields
  command?: string
  args?: string[]
  env?: Record<string, string>
  // sse/http type fields
  url?: string
  headers?: Record<string, string>
  // tools
  autoDiscoverTools?: boolean
  allowedTools?: string[]
  tools?: McpToolInfo[]
  toolCount?: number
  // metadata
  metadata?: Record<string, string>
  createTime?: number
  modifyTime?: number
}

export interface McpToolInfo {
  name: string
  description?: string
  inputSchema?: Record<string, unknown>
  enabled?: boolean
  metadata?: Record<string, string>
}

export interface AgentInfo {
  id: string
  name: string
  enabled: boolean
  description?: string
  model?: string
  systemPrompt?: string
  mcpServers?: string[]
  tools?: string[]
  temperature?: number
  maxTokens?: number
  maxIterations?: number
  metadata?: Record<string, string>
  createTime?: number
  modifyTime?: number
}

// ============================================
// 设置类型
// ============================================

export type ThemeMode = 'light' | 'dark' | 'system'
export type Language = 'zh' | 'en'

export interface AppSettings {
  theme: ThemeMode
  language: Language
  namespaceDisplayStyle: 'name' | 'id' | 'both'
}

// ============================================
// 认证类型
// ============================================

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  tokenTtl: number
  globalAdmin: boolean
  username: string
}
