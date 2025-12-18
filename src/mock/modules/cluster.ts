import Mock from 'mockjs'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/nacos'

// 生成集群节点数据
function generateClusterNodes() {
  const nodes = []
  const nodeCount = Mock.Random.integer(3, 5)
  const states = ['UP', 'UP', 'UP', 'SUSPICIOUS', 'DOWN'] // 大多数节点应该是 UP

  for (let i = 0; i < nodeCount; i++) {
    const ip = `192.168.1.${10 + i}`
    const port = 8848

    nodes.push({
      ip: ip,
      port: port,
      state: states[i] || 'UP',
      extendInfo: {
        lastRefreshTime: Date.now() - Mock.Random.integer(0, 60000),
        raftMetaData: {
          metaDataMap: {
            naming_instance_metadata: {
              leader: i === 0 ? `${ip}:${port + 1000}` : `192.168.1.10:9848`,
              raftGroupMember: Array.from(
                { length: nodeCount },
                (_, j) => `192.168.1.${10 + j}:${port + 1000}`,
              ),
              term: Mock.Random.integer(1, 100),
            },
            naming_service_metadata: {
              leader: i === 0 ? `${ip}:${port + 1000}` : `192.168.1.10:9848`,
              raftGroupMember: Array.from(
                { length: nodeCount },
                (_, j) => `192.168.1.${10 + j}:${port + 1000}`,
              ),
              term: Mock.Random.integer(1, 100),
            },
          },
        },
        version: '2.3.0',
        readyToUpgrade: true,
      },
      address: `${ip}:${port}`,
      failAccessCnt: states[i] === 'DOWN' ? Mock.Random.integer(1, 10) : 0,
      abilities: {
        remoteAbility: {
          supportRemoteConnection: true,
          grpcReportEnabled: true,
        },
        configAbility: {
          supportRemoteMetrics: true,
        },
        namingAbility: {
          supportDeltaPush: true,
          supportRemoteMetric: true,
        },
      },
    })
  }

  return nodes
}

// 生成服务器状态数据
function generateServerState() {
  return {
    standalone_mode: 'standalone',
    function_mode: 'All',
    version: '2.3.0',
    startup_mode: 'STANDALONE',
    useAddressServer: false,
  }
}

// 缓存数据
let cachedNodes: ReturnType<typeof generateClusterNodes> | null = null

export function setupClusterMock() {
  // 获取集群节点列表
  Mock.mock(new RegExp(`${baseURL}/v1/core/cluster/nodes`), 'get', () => {
    if (!cachedNodes) {
      cachedNodes = generateClusterNodes()
    }

    return {
      code: 200,
      message: 'success',
      data: cachedNodes,
    }
  })

  // 获取当前节点信息
  Mock.mock(new RegExp(`${baseURL}/v1/core/cluster/node/self`), 'get', () => {
    if (!cachedNodes) {
      cachedNodes = generateClusterNodes()
    }

    return {
      code: 200,
      message: 'success',
      data: cachedNodes[0],
    }
  })

  // 获取集群健康状态
  Mock.mock(new RegExp(`${baseURL}/v1/core/cluster/health`), 'get', () => {
    if (!cachedNodes) {
      cachedNodes = generateClusterNodes()
    }

    const healthyCount = cachedNodes.filter((n) => n.state === 'UP').length

    return {
      code: 200,
      message: 'success',
      data: {
        status: healthyCount === cachedNodes.length ? 'UP' : 'WARN',
        healthyCount: healthyCount,
        totalCount: cachedNodes.length,
        nodeHealthMap: cachedNodes.reduce(
          (acc, node) => {
            acc[node.address] = node.state === 'UP'
            return acc
          },
          {} as Record<string, boolean>,
        ),
      },
    }
  })

  // 获取服务器状态
  Mock.mock(new RegExp(`${baseURL}/v1/console/server/state`), 'get', () => {
    return {
      code: 200,
      message: 'success',
      data: generateServerState(),
    }
  })

  // 切换节点查找
  Mock.mock(new RegExp(`${baseURL}/v1/core/cluster/lookup`), 'put', () => {
    return {
      code: 200,
      message: 'success',
      data: 'ok',
    }
  })

  // 获取 Raft 状态
  Mock.mock(new RegExp(`${baseURL}/v1/core/cluster/raft`), 'get', () => {
    return {
      code: 200,
      message: 'success',
      data: {
        naming_instance_metadata: {
          leader: '192.168.1.10:9848',
          term: Mock.Random.integer(1, 100),
          heartbeatTimeMs: 500,
          electionTimeMs: Mock.Random.integer(1000, 5000),
        },
        naming_service_metadata: {
          leader: '192.168.1.10:9848',
          term: Mock.Random.integer(1, 100),
          heartbeatTimeMs: 500,
          electionTimeMs: Mock.Random.integer(1000, 5000),
        },
      },
    }
  })
}
