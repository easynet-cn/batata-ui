import Mock from 'mockjs'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/nacos'

// 生成配置列表数据
function generateConfigs(count: number = 30) {
  const configs = []
  const groups = ['DEFAULT_GROUP', 'PROD_GROUP', 'DEV_GROUP', 'TEST_GROUP']
  const types = ['yaml', 'properties', 'json', 'xml', 'text']
  const dataIdPrefixes = [
    'application',
    'bootstrap',
    'database',
    'redis',
    'mq',
    'gateway',
    'auth',
    'log',
    'monitor',
    'scheduler',
  ]

  for (let i = 0; i < count; i++) {
    const type = types[Mock.Random.integer(0, types.length - 1)] || 'yaml'
    const prefix = dataIdPrefixes[i % dataIdPrefixes.length] || 'application'
    const group = groups[Mock.Random.integer(0, groups.length - 1)] || 'DEFAULT_GROUP'
    const suffix = i >= dataIdPrefixes.length ? `-${Math.floor(i / dataIdPrefixes.length)}` : ''

    configs.push({
      id: Mock.Random.guid(),
      dataId: `${prefix}${suffix}.${type}`,
      group: group,
      tenant: '',
      appName: `${prefix}-service`,
      content: generateConfigContent(type),
      md5: Mock.Random.string('lower', 32),
      type: type,
      encryptedDataKey: '',
      createTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss'),
      modifyTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss'),
    })
  }

  return configs
}

// 根据类型生成配置内容
function generateConfigContent(type: string): string {
  switch (type) {
    case 'yaml':
      return `server:
  port: ${Mock.Random.integer(8000, 9000)}

spring:
  application:
    name: ${Mock.Random.word()}-service
  datasource:
    url: jdbc:mysql://localhost:3306/${Mock.Random.word()}
    username: root
    password: ******

logging:
  level:
    root: INFO
    com.example: DEBUG`

    case 'properties':
      return `server.port=${Mock.Random.integer(8000, 9000)}
spring.application.name=${Mock.Random.word()}-service
spring.datasource.url=jdbc:mysql://localhost:3306/${Mock.Random.word()}
spring.datasource.username=root
spring.datasource.password=******
logging.level.root=INFO`

    case 'json':
      return JSON.stringify(
        {
          server: {
            port: Mock.Random.integer(8000, 9000),
          },
          database: {
            host: 'localhost',
            port: 3306,
            name: Mock.Random.word(),
          },
          redis: {
            host: 'localhost',
            port: 6379,
          },
        },
        null,
        2,
      )

    case 'xml':
      return `<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <server>
    <port>${Mock.Random.integer(8000, 9000)}</port>
  </server>
  <database>
    <host>localhost</host>
    <port>3306</port>
    <name>${Mock.Random.word()}</name>
  </database>
</configuration>`

    default:
      return `# Configuration
key1=${Mock.Random.word()}
key2=${Mock.Random.word()}
key3=${Mock.Random.integer(1, 100)}`
  }
}

// 缓存生成的配置数据
let cachedConfigs: ReturnType<typeof generateConfigs> | null = null

export function setupConfigMock() {
  // 获取配置列表
  Mock.mock(new RegExp(`${baseURL}/v1/cs/configs\\?`), 'get', (options: { url: string }) => {
    const url = new URL(options.url, 'http://localhost')
    const pageNo = parseInt(url.searchParams.get('pageNo') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20')
    const dataId = url.searchParams.get('dataId')
    const group = url.searchParams.get('group')
    const tenant = url.searchParams.get('tenant')

    if (!cachedConfigs) {
      cachedConfigs = generateConfigs(50)
    }

    let filteredConfigs = cachedConfigs

    // 按 tenant 过滤
    if (tenant) {
      filteredConfigs = filteredConfigs.filter((c) => c.tenant === tenant)
    }

    // 按 dataId 搜索
    if (dataId) {
      filteredConfigs = filteredConfigs.filter((c) =>
        c.dataId.toLowerCase().includes(dataId.toLowerCase()),
      )
    }

    // 按 group 过滤
    if (group) {
      filteredConfigs = filteredConfigs.filter((c) => c.group === group)
    }

    const total = filteredConfigs.length
    const start = (pageNo - 1) * pageSize
    const end = start + pageSize
    const pageItems = filteredConfigs.slice(start, end)

    return {
      code: 200,
      message: 'success',
      data: {
        totalCount: total,
        pageNumber: pageNo,
        pagesAvailable: Math.ceil(total / pageSize),
        pageItems: pageItems,
      },
    }
  })

  // 获取单个配置内容
  Mock.mock(new RegExp(`${baseURL}/v1/cs/configs$`), 'get', (options: { url: string }) => {
    const url = new URL(options.url, 'http://localhost')
    const dataId = url.searchParams.get('dataId')
    const group = url.searchParams.get('group')

    if (!cachedConfigs) {
      cachedConfigs = generateConfigs(50)
    }

    const config = cachedConfigs.find((c) => c.dataId === dataId && c.group === group)

    if (config) {
      return config.content
    }

    return generateConfigContent('yaml')
  })

  // 发布配置
  Mock.mock(new RegExp(`${baseURL}/v1/cs/configs`), 'post', () => {
    return {
      code: 200,
      message: 'success',
      data: true,
    }
  })

  // 删除配置
  Mock.mock(new RegExp(`${baseURL}/v1/cs/configs`), 'delete', () => {
    return {
      code: 200,
      message: 'success',
      data: true,
    }
  })

  // 获取配置历史
  Mock.mock(new RegExp(`${baseURL}/v1/cs/history`), 'get', (options: { url: string }) => {
    const url = new URL(options.url, 'http://localhost')
    const pageNo = parseInt(url.searchParams.get('pageNo') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20')

    const historyItems = []
    const total = Mock.Random.integer(10, 30)

    for (let i = 0; i < Math.min(pageSize, total - (pageNo - 1) * pageSize); i++) {
      historyItems.push({
        id: Mock.Random.guid(),
        dataId: url.searchParams.get('dataId') || 'application.yaml',
        group: url.searchParams.get('group') || 'DEFAULT_GROUP',
        tenant: '',
        appName: '',
        srcIp: Mock.Random.ip(),
        srcUser: Mock.Random.pick(['nacos', 'admin']),
        opType: Mock.Random.pick(['I', 'U', 'D']),
        createdTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss'),
        lastModifiedTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss'),
      })
    }

    return {
      code: 200,
      message: 'success',
      data: {
        totalCount: total,
        pageNumber: pageNo,
        pagesAvailable: Math.ceil(total / pageSize),
        pageItems: historyItems,
      },
    }
  })

  // 监听查询
  Mock.mock(new RegExp(`${baseURL}/v1/cs/configs/listener`), 'get', () => {
    return {
      code: 200,
      message: 'success',
      data: {
        collectStatus: 200,
        lisentersGroupkeyStatus: Mock.mock({
          'list|5-10': [
            {
              ip: '@ip',
              md5: '@string("lower", 32)',
              pushStatus: '@pick(["success", "pending"])',
            },
          ],
        }).list,
      },
    }
  })
}
