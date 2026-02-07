import Mock from 'mockjs'
import { setupAuthMock } from './modules/auth'
import { setupServiceMock } from './modules/service'
import { setupConfigMock } from './modules/config'
import { setupNamespaceMock } from './modules/namespace'
import { setupClusterMock } from './modules/cluster'
import { logger } from '@/utils/logger'

// Mock 配置
Mock.setup({
  // 响应延迟 (模拟网络延迟)
  timeout: '200-600',
})

export function setupMock() {
  logger.debug('[Mock] 启用 Mock 数据模式')

  // 注册各模块的 Mock
  setupAuthMock()
  setupServiceMock()
  setupConfigMock()
  setupNamespaceMock()
  setupClusterMock()

  logger.debug('[Mock] Mock 数据初始化完成')
}
