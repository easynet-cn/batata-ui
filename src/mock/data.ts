import Mock from 'mockjs'
import type {
  ConfigInfo,
  ServiceInfo,
  Namespace,
  UserInfo,
  RoleInfo,
  PermissionInfo,
  NodeInfo,
} from '@/types'

const Random = Mock.Random

export const mockConfigs: ConfigInfo[] = Array.from({ length: 15 }, () => ({
  id: Random.guid(),
  dataId: `com.alibaba.nacos.${Random.word(3, 8)}.yaml`,
  group: Random.pick(['DEFAULT_GROUP', 'DEV_GROUP', 'PROD_GROUP']) as string,
  appName: Random.word(4, 10),
  content: 'server:\n  port: 8080\nspring:\n  application:\n    name: demo-app',
  type: 'yaml' as const,
  md5: Random.string('lower', 32),
  tenant: 'public',
  createTime: Date.now() - Random.integer(86400000 * 30, 86400000 * 60),
  modifyTime: Date.now() - Random.integer(0, 86400000 * 30),
}))

export const mockServices: ServiceInfo[] = Array.from({ length: 10 }, () => {
  const ipCount = Random.integer(1, 10)
  const healthyCount = Math.floor(ipCount * 0.8)

  return {
    name: `service-${Random.word(4, 8)}`,
    groupName: 'DEFAULT_GROUP',
    clusterCount: Random.integer(1, 3),
    ipCount: ipCount,
    healthyInstanceCount: healthyCount,
    protectThreshold: 0.6,
  }
})

export const mockNamespaces: Namespace[] = [
  { namespace: '', namespaceShowName: 'public', type: 0, quota: 200, configCount: 15 },
  {
    namespace: Random.guid(),
    namespaceShowName: 'Development',
    type: 1,
    quota: 200,
    configCount: 5,
  },
  {
    namespace: Random.guid(),
    namespaceShowName: 'Production',
    type: 1,
    quota: 200,
    configCount: 22,
  },
]

export const mockUsers: UserInfo[] = [
  { username: 'nacos', enabled: true },
  { username: 'admin', enabled: true },
  { username: 'developer', enabled: true },
]

export const mockRoles: RoleInfo[] = [
  { role: 'ROLE_ADMIN', username: 'admin' },
  { role: 'ROLE_ADMIN', username: 'nacos' },
  { role: 'ROLE_DEVELOPER', username: 'developer' },
]

export const mockPermissions: PermissionInfo[] = [
  { role: 'ROLE_ADMIN', resource: '*:*:*', action: 'rw' },
  { role: 'ROLE_DEVELOPER', resource: 'public:*:*', action: 'r' },
]

export const mockNodes: NodeInfo[] = [
  {
    ip: '192.168.1.101',
    port: 8848,
    state: 'UP',
    address: '192.168.1.101:8848',
    abilities: {
      remoteAbility: { supportRemoteConnection: true },
      configAbility: { supportRemoteMetrics: true },
      namingAbility: { supportDeltaPush: true, supportJraft: true },
    },
    metadata: { version: '2.3.2' },
  },
  {
    ip: '192.168.1.102',
    port: 8848,
    state: 'UP',
    address: '192.168.1.102:8848',
    abilities: {
      remoteAbility: { supportRemoteConnection: true },
      configAbility: { supportRemoteMetrics: true },
      namingAbility: { supportDeltaPush: true, supportJraft: true },
    },
    metadata: { version: '2.3.2' },
  },
  {
    ip: '192.168.1.103',
    port: 8848,
    state: 'UP',
    address: '192.168.1.103:8848',
    abilities: {
      remoteAbility: { supportRemoteConnection: true },
      configAbility: { supportRemoteMetrics: true },
      namingAbility: { supportDeltaPush: true, supportJraft: true },
    },
    metadata: { version: '2.3.2' },
  },
]
