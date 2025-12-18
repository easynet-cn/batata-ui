import Mock from 'mockjs'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/nacos'

// 生成命名空间数据
function generateNamespaces() {
  return [
    {
      namespace: '',
      namespaceShowName: 'public',
      namespaceDesc: '公共命名空间',
      quota: 200,
      configCount: Mock.Random.integer(10, 50),
      type: 0,
    },
    {
      namespace: Mock.Random.guid(),
      namespaceShowName: 'dev',
      namespaceDesc: '开发环境',
      quota: 200,
      configCount: Mock.Random.integer(5, 30),
      type: 2,
    },
    {
      namespace: Mock.Random.guid(),
      namespaceShowName: 'test',
      namespaceDesc: '测试环境',
      quota: 200,
      configCount: Mock.Random.integer(5, 25),
      type: 2,
    },
    {
      namespace: Mock.Random.guid(),
      namespaceShowName: 'prod',
      namespaceDesc: '生产环境',
      quota: 200,
      configCount: Mock.Random.integer(20, 60),
      type: 2,
    },
  ]
}

// 缓存命名空间数据
let cachedNamespaces: ReturnType<typeof generateNamespaces> | null = null

export function setupNamespaceMock() {
  // 获取命名空间列表
  Mock.mock(new RegExp(`${baseURL}/v1/console/namespaces`), 'get', () => {
    if (!cachedNamespaces) {
      cachedNamespaces = generateNamespaces()
    }

    return {
      code: 200,
      message: 'success',
      data: cachedNamespaces,
    }
  })

  // 创建命名空间
  Mock.mock(new RegExp(`${baseURL}/v1/console/namespaces`), 'post', (options: { body: string }) => {
    const body = JSON.parse(options.body)

    if (!cachedNamespaces) {
      cachedNamespaces = generateNamespaces()
    }

    // 检查是否已存在
    const exists = cachedNamespaces.some(
      (ns) =>
        ns.namespace === body.customNamespaceId || ns.namespaceShowName === body.namespaceName,
    )

    if (exists) {
      return {
        code: 400,
        message: '命名空间已存在',
        data: false,
      }
    }

    cachedNamespaces.push({
      namespace: body.customNamespaceId || Mock.Random.guid(),
      namespaceShowName: body.namespaceName,
      namespaceDesc: body.namespaceDesc || '',
      quota: 200,
      configCount: 0,
      type: 2,
    })

    return {
      code: 200,
      message: 'success',
      data: true,
    }
  })

  // 更新命名空间
  Mock.mock(new RegExp(`${baseURL}/v1/console/namespaces`), 'put', (options: { body: string }) => {
    const body = JSON.parse(options.body)

    if (!cachedNamespaces) {
      cachedNamespaces = generateNamespaces()
    }

    const ns = cachedNamespaces.find((n) => n.namespace === body.namespace)
    if (ns) {
      ns.namespaceShowName = body.namespaceShowName || ns.namespaceShowName
      ns.namespaceDesc = body.namespaceDesc || ns.namespaceDesc
    }

    return {
      code: 200,
      message: 'success',
      data: true,
    }
  })

  // 删除命名空间
  Mock.mock(
    new RegExp(`${baseURL}/v1/console/namespaces`),
    'delete',
    (options: { url: string }) => {
      const url = new URL(options.url, 'http://localhost')
      const namespaceId = url.searchParams.get('namespaceId')

      if (!cachedNamespaces) {
        cachedNamespaces = generateNamespaces()
      }

      // 不能删除 public 命名空间
      if (!namespaceId || namespaceId === '') {
        return {
          code: 400,
          message: '不能删除 public 命名空间',
          data: false,
        }
      }

      cachedNamespaces = cachedNamespaces.filter((ns) => ns.namespace !== namespaceId)

      return {
        code: 200,
        message: 'success',
        data: true,
      }
    },
  )
}
