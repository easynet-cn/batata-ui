export interface ConfigInfo {
  id: string
  dataId: string
  group: string
  appName: string
  content: string
  type: 'text' | 'json' | 'xml' | 'yaml' | 'properties'
  md5: string
  tenant: string
  lastModifiedTime: number
}

export interface InstanceInfo {
  ip: string
  port: number
  weight: number
  healthy: boolean
  enabled: boolean
  ephemeral: boolean
  metadata: Record<string, string>
}

export interface ServiceInfo {
  name: string
  groupName: string
  clusterCount: number
  ipCount: number
  healthyInstanceCount: number
  triggerThreshold: number
  instances?: InstanceInfo[]
}

export interface Namespace {
  namespace: string
  namespaceShowName: string
  type: number // 0: global, 1: custom
  quota: number
  configCount: number
}

export interface UserInfo {
  username: string
  password?: string
  roles?: string[]
}

export interface RoleInfo {
  role: string
  username: string
}

export interface PermissionInfo {
  role: string
  resource: string
  action: 'R' | 'W' | 'RW'
}

export interface NodeInfo {
  ip: string
  port: number
  state: 'UP' | 'DOWN' | 'SUSPICIOUS'
  uptime: string
  version: string
  isLeader: boolean
  cpuUsage: number
  memoryUsage: number
}
