import Mock from 'mockjs'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/nacos'

// 模拟用户数据
const users = [
  { username: 'nacos', password: 'nacos' },
  { username: 'admin', password: 'admin' },
]

export function setupAuthMock() {
  // 登录接口
  Mock.mock(new RegExp(`${baseURL}/v1/auth/login`), 'post', (options: { body: string }) => {
    const body = JSON.parse(options.body)
    const { username, password } = body

    const user = users.find((u) => u.username === username && u.password === password)

    if (user) {
      return {
        code: 200,
        message: 'success',
        data: {
          accessToken: Mock.Random.guid(),
          tokenTtl: 18000,
          globalAdmin: username === 'admin',
          username: username,
        },
      }
    }

    return {
      code: 401,
      message: '用户名或密码错误',
      data: null,
    }
  })

  // 登出接口
  Mock.mock(new RegExp(`${baseURL}/v1/auth/logout`), 'post', () => {
    return {
      code: 200,
      message: 'success',
      data: null,
    }
  })

  // 获取用户信息
  Mock.mock(new RegExp(`${baseURL}/v1/auth/users`), 'get', () => {
    return {
      code: 200,
      message: 'success',
      data: {
        totalCount: 2,
        pageNumber: 1,
        pagesAvailable: 1,
        pageItems: [
          { username: 'nacos', password: '******' },
          { username: 'admin', password: '******' },
        ],
      },
    }
  })
}
