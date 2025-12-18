import Mock from 'mockjs'
import type {
  ConfigInfo,
  ServiceInfo,
  Namespace,
  UserInfo,
  RoleInfo,
  PermissionInfo,
  NodeInfo,
  InstanceInfo,
} from '@/types'

const Random = Mock.Random

const generateInstances = (count: number): InstanceInfo[] => {
  return Array.from({ length: count }, () => ({
    ip: `10.0.${Random.integer(1, 255)}.${Random.integer(1, 255)}`,
    port: Random.pick([8080, 8081, 9000, 9001, 3000]) as number,
    weight: parseFloat(Random.float(0.1, 1.0, 1, 1).toFixed(1)),
    healthy: Math.random() < 0.8,
    enabled: true,
    ephemeral: true,
    metadata: {
      version: `1.0.${Random.integer(0, 9)}`,
      preserved: 'true',
    },
  }))
}

export const mockConfigs: ConfigInfo[] = Array.from({ length: 15 }, () => ({
  id: Random.guid(),
  dataId: `com.alibaba.nacos.${Random.word(3, 8)}.yaml`,
  group: Random.pick(['DEFAULT_GROUP', 'DEV_GROUP', 'PROD_GROUP']) as string,
  appName: Random.word(4, 10),
  content: 'server:\n  port: 8080\nspring:\n  application:\n    name: demo-app',
  type: 'yaml' as const,
  md5: Random.string('lower', 32),
  tenant: 'public',
  lastModifiedTime: Date.now() - Random.integer(0, 86400000 * 30),
}))

export const mockServices: ServiceInfo[] = Array.from({ length: 10 }, () => {
  const ipCount = Random.integer(1, 10)
  const instances = generateInstances(ipCount)
  const healthyCount = instances.filter((i) => i.healthy).length

  return {
    name: `service-${Random.word(4, 8)}`,
    groupName: 'DEFAULT_GROUP',
    clusterCount: Random.integer(1, 3),
    ipCount: ipCount,
    healthyInstanceCount: healthyCount,
    triggerThreshold: 0.6,
    instances: instances,
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
  { username: 'nacos' },
  { username: 'admin' },
  { username: 'developer' },
]

export const mockRoles: RoleInfo[] = [
  { role: 'ROLE_ADMIN', username: 'admin' },
  { role: 'ROLE_ADMIN', username: 'nacos' },
  { role: 'ROLE_DEVELOPER', username: 'developer' },
]

export const mockPermissions: PermissionInfo[] = [
  { role: 'ROLE_ADMIN', resource: '*:*:*', action: 'RW' },
  { role: 'ROLE_DEVELOPER', resource: 'public:*:*', action: 'R' },
]

export const mockNodes: NodeInfo[] = [
  {
    ip: '192.168.1.101',
    port: 8848,
    state: 'UP',
    uptime: '15d 4h 22m',
    version: '2.3.2',
    isLeader: true,
    cpuUsage: 12.5,
    memoryUsage: 45.2,
  },
  {
    ip: '192.168.1.102',
    port: 8848,
    state: 'UP',
    uptime: '15d 4h 21m',
    version: '2.3.2',
    isLeader: false,
    cpuUsage: 8.4,
    memoryUsage: 42.1,
  },
  {
    ip: '192.168.1.103',
    port: 8848,
    state: 'UP',
    uptime: '10d 2h 15m',
    version: '2.3.2',
    isLeader: false,
    cpuUsage: 15.1,
    memoryUsage: 48.9,
  },
]
