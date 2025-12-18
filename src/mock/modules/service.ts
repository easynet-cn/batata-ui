import Mock from 'mockjs'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/nacos'

// 生成服务列表数据
function generateServices(count: number = 20) {
  const services = []
  const groups = ['DEFAULT_GROUP', 'PROD_GROUP', 'DEV_GROUP', 'TEST_GROUP']
  const serviceNames = [
    'user-service',
    'order-service',
    'payment-service',
    'inventory-service',
    'notification-service',
    'auth-service',
    'gateway-service',
    'config-service',
    'log-service',
    'monitor-service',
    'cache-service',
    'search-service',
    'file-service',
    'message-service',
    'scheduler-service',
  ]

  for (let i = 0; i < count; i++) {
    const ipCount = Mock.Random.integer(1, 10)
    const healthyCount = Mock.Random.integer(0, ipCount)

    services.push({
      name: serviceNames[i % serviceNames.length] + (i >= serviceNames.length ? `-${i}` : ''),
      groupName: groups[Mock.Random.integer(0, groups.length - 1)],
      clusterCount: Mock.Random.integer(1, 3),
      ipCount: ipCount,
      healthyInstanceCount: healthyCount,
      triggerFlag: Mock.Random.boolean() ? 'true' : 'false',
      metadata: {},
    })
  }

  return services
}

// 生成服务实例数据
function generateInstances(serviceName: string, count: number = 5) {
  const instances = []
  const clusters = ['DEFAULT', 'CLUSTER-A', 'CLUSTER-B']

  for (let i = 0; i < count; i++) {
    instances.push({
      instanceId: `${Mock.Random.ip()}#${8080 + i}#${clusters[i % clusters.length]}#${serviceName}`,
      ip: Mock.Random.ip(),
      port: 8080 + i,
      weight: Mock.Random.float(0.1, 1, 1, 1),
      healthy: Math.random() < 0.8,
      enabled: Math.random() < 0.9,
      ephemeral: true,
      clusterName: clusters[i % clusters.length],
      serviceName: serviceName,
      metadata: {
        version: `v${Mock.Random.integer(1, 3)}.${Mock.Random.integer(0, 9)}.${Mock.Random.integer(0, 9)}`,
        env: Mock.Random.pick(['prod', 'dev', 'test']),
      },
    })
  }

  return instances
}

// 缓存生成的服务数据
let cachedServices: ReturnType<typeof generateServices> | null = null

export function setupServiceMock() {
  // 获取服务列表
  Mock.mock(new RegExp(`${baseURL}/v1/ns/catalog/services`), 'get', (options: { url: string }) => {
    const url = new URL(options.url, 'http://localhost')
    const pageNo = parseInt(url.searchParams.get('pageNo') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20')
    const groupName = url.searchParams.get('groupName')
    const serviceNameParam = url.searchParams.get('serviceNameParam')

    if (!cachedServices) {
      cachedServices = generateServices(50)
    }

    let filteredServices = cachedServices

    // 按分组过滤
    if (groupName) {
      filteredServices = filteredServices.filter((s) => s.groupName === groupName)
    }

    // 按服务名搜索
    if (serviceNameParam) {
      filteredServices = filteredServices.filter((s) =>
        s.name.toLowerCase().includes(serviceNameParam.toLowerCase()),
      )
    }

    const total = filteredServices.length
    const start = (pageNo - 1) * pageSize
    const end = start + pageSize
    const pageItems = filteredServices.slice(start, end)

    return {
      code: 200,
      message: 'success',
      data: {
        count: total,
        doms: pageItems,
      },
    }
  })

  // 获取服务详情/实例列表
  Mock.mock(new RegExp(`${baseURL}/v1/ns/catalog/instances`), 'get', (options: { url: string }) => {
    const url = new URL(options.url, 'http://localhost')
    const serviceName = url.searchParams.get('serviceName') || 'unknown-service'
    const clusterName = url.searchParams.get('clusterName')

    let instances = generateInstances(serviceName, Mock.Random.integer(3, 8))

    if (clusterName) {
      instances = instances.filter((i) => i.clusterName === clusterName)
    }

    return {
      code: 200,
      message: 'success',
      data: instances,
    }
  })

  // 创建服务
  Mock.mock(new RegExp(`${baseURL}/v1/ns/service`), 'post', () => {
    return {
      code: 200,
      message: 'success',
      data: 'ok',
    }
  })

  // 删除服务
  Mock.mock(new RegExp(`${baseURL}/v1/ns/service`), 'delete', () => {
    return {
      code: 200,
      message: 'success',
      data: 'ok',
    }
  })

  // 更新服务
  Mock.mock(new RegExp(`${baseURL}/v1/ns/service`), 'put', () => {
    return {
      code: 200,
      message: 'success',
      data: 'ok',
    }
  })

  // 更新实例
  Mock.mock(new RegExp(`${baseURL}/v1/ns/instance`), 'put', () => {
    return {
      code: 200,
      message: 'success',
      data: 'ok',
    }
  })
}
