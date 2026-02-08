import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBatataStore } from '../batata'

// Mock dependencies
vi.mock('@/api/batata', () => ({
  default: {
    login: vi.fn(),
    getServiceList: vi.fn(),
    getServiceDetail: vi.fn(),
    getConfigList: vi.fn(),
    getConfig: vi.fn(),
    getNamespaceList: vi.fn(),
    getClusterNodes: vi.fn(),
    deleteService: vi.fn(),
    createService: vi.fn(),
    deleteConfig: vi.fn(),
    publishConfig: vi.fn(),
    deleteNamespace: vi.fn(),
    createNamespace: vi.fn(),
  },
}))

vi.mock('@/composables/useStorage', () => ({
  storage: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    getJSON: vi.fn(),
    setJSON: vi.fn(),
  },
}))

vi.mock('@/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    language: { value: 'en' },
    setLanguage: vi.fn(),
  }),
}))

import batataApi from '@/api/batata'
import { storage } from '@/composables/useStorage'

describe('batata store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('logs in successfully and stores token', async () => {
      vi.mocked(batataApi.login).mockResolvedValue({
        data: { accessToken: 'test-token' },
      } as never)

      const store = useBatataStore()
      const result = await store.login('admin', 'password')

      expect(result).toBe(true)
      expect(store.currentUser).toEqual({ username: 'admin', token: 'test-token' })
      expect(storage.set).toHaveBeenCalledWith('batata-token', 'test-token')
      expect(storage.set).toHaveBeenCalledWith('batata-username', 'admin')
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('handles login failure', async () => {
      vi.mocked(batataApi.login).mockRejectedValue(new Error('Invalid credentials'))

      const store = useBatataStore()
      const result = await store.login('admin', 'wrong')

      expect(result).toBe(false)
      expect(store.currentUser).toBeNull()
      expect(store.error).toBe('Invalid credentials')
      expect(store.loading).toBe(false)
    })

    it('handles non-Error login failure', async () => {
      vi.mocked(batataApi.login).mockRejectedValue('network error')

      const store = useBatataStore()
      const result = await store.login('admin', 'password')

      expect(result).toBe(false)
      expect(store.error).toBe('loginFailedGeneric')
    })
  })

  describe('logout', () => {
    it('clears user and storage', async () => {
      vi.mocked(batataApi.login).mockResolvedValue({
        data: { accessToken: 'token' },
      } as never)

      const store = useBatataStore()
      await store.login('admin', 'password')

      store.logout()

      expect(store.currentUser).toBeNull()
      expect(storage.remove).toHaveBeenCalledWith('batata-token')
      expect(storage.remove).toHaveBeenCalledWith('batata-username')
      expect(store.services).toEqual([])
      expect(store.configs).toEqual([])
      expect(store.namespaces).toEqual([])
    })
  })

  describe('fetchServices', () => {
    it('fetches services with default params', async () => {
      const mockData = {
        pageItems: [
          { name: 'svc1', ipCount: 3, healthyInstanceCount: 2 },
          { name: 'svc2', ipCount: 1, healthyInstanceCount: 0 },
        ],
        totalCount: 2,
      }
      vi.mocked(batataApi.getServiceList).mockResolvedValue({
        data: { data: mockData },
      } as never)

      const store = useBatataStore()
      const result = await store.fetchServices()

      expect(result).toEqual(mockData)
      expect(store.services).toEqual(mockData.pageItems)
      expect(store.serviceTotal).toBe(2)
      expect(batataApi.getServiceList).toHaveBeenCalledWith({
        pageNo: 1,
        pageSize: 20,
        groupName: undefined,
        serviceName: undefined,
        namespaceId: undefined,
        hasIpCount: true,
      })
    })

    it('passes custom params', async () => {
      vi.mocked(batataApi.getServiceList).mockResolvedValue({
        data: { data: { pageItems: [], totalCount: 0 } },
      } as never)

      const store = useBatataStore()
      await store.fetchServices({ pageNo: 2, pageSize: 50, serviceName: 'test' })

      expect(batataApi.getServiceList).toHaveBeenCalledWith({
        pageNo: 2,
        pageSize: 50,
        groupName: undefined,
        serviceName: 'test',
        namespaceId: undefined,
        hasIpCount: true,
      })
    })

    it('handles fetch error', async () => {
      vi.mocked(batataApi.getServiceList).mockRejectedValue(new Error('Network error'))

      const store = useBatataStore()

      await expect(store.fetchServices()).rejects.toThrow('Network error')
      expect(store.error).toBe('Network error')
      expect(store.loading).toBe(false)
    })
  })

  describe('fetchConfigs', () => {
    it('fetches configs successfully', async () => {
      const mockData = {
        pageItems: [{ dataId: 'config1', group: 'DEFAULT_GROUP' }],
        totalCount: 1,
      }
      vi.mocked(batataApi.getConfigList).mockResolvedValue({
        data: { data: mockData },
      } as never)

      const store = useBatataStore()
      const result = await store.fetchConfigs()

      expect(result).toEqual(mockData)
      expect(store.configs).toEqual(mockData.pageItems)
      expect(store.configTotal).toBe(1)
    })

    it('handles fetch error', async () => {
      vi.mocked(batataApi.getConfigList).mockRejectedValue(new Error('Config error'))

      const store = useBatataStore()

      await expect(store.fetchConfigs()).rejects.toThrow('Config error')
      expect(store.error).toBe('Config error')
    })
  })

  describe('fetchNamespaces', () => {
    it('fetches namespaces successfully', async () => {
      const mockNamespaces = [
        { namespace: 'public', namespaceShowName: 'Public' },
        { namespace: 'dev', namespaceShowName: 'Development' },
      ]
      vi.mocked(batataApi.getNamespaceList).mockResolvedValue({
        data: { data: mockNamespaces },
      } as never)

      const store = useBatataStore()
      const result = await store.fetchNamespaces()

      expect(result).toEqual(mockNamespaces)
      expect(store.namespaces).toEqual(mockNamespaces)
    })
  })

  describe('computed properties', () => {
    it('isAuthenticated returns true when user is set', async () => {
      vi.mocked(batataApi.login).mockResolvedValue({
        data: { accessToken: 'token' },
      } as never)

      const store = useBatataStore()
      expect(store.isAuthenticated).toBe(false)

      await store.login('admin', 'password')
      expect(store.isAuthenticated).toBe(true)
    })

    it('healthyServicesCount counts correctly', async () => {
      vi.mocked(batataApi.getServiceList).mockResolvedValue({
        data: {
          data: {
            pageItems: [
              { name: 'svc1', ipCount: 3, healthyInstanceCount: 2 },
              { name: 'svc2', ipCount: 1, healthyInstanceCount: 0 },
              { name: 'svc3', ipCount: 2, healthyInstanceCount: 1 },
            ],
            totalCount: 3,
          },
        },
      } as never)

      const store = useBatataStore()
      await store.fetchServices()

      expect(store.healthyServicesCount).toBe(2)
    })

    it('totalInstancesCount sums ipCount', async () => {
      vi.mocked(batataApi.getServiceList).mockResolvedValue({
        data: {
          data: {
            pageItems: [
              { name: 'svc1', ipCount: 3, healthyInstanceCount: 2 },
              { name: 'svc2', ipCount: 5, healthyInstanceCount: 1 },
            ],
            totalCount: 2,
          },
        },
      } as never)

      const store = useBatataStore()
      await store.fetchServices()

      expect(store.totalInstancesCount).toBe(8)
    })
  })

  describe('deleteService', () => {
    it('deletes service successfully', async () => {
      vi.mocked(batataApi.deleteService).mockResolvedValue({} as never)

      const store = useBatataStore()
      const result = await store.deleteService('svc1', 'DEFAULT_GROUP')

      expect(result).toBe(true)
      expect(batataApi.deleteService).toHaveBeenCalledWith('svc1', 'DEFAULT_GROUP', undefined)
    })

    it('handles delete error', async () => {
      vi.mocked(batataApi.deleteService).mockRejectedValue(new Error('Delete failed'))

      const store = useBatataStore()

      await expect(store.deleteService('svc1', 'DEFAULT_GROUP')).rejects.toThrow('Delete failed')
      expect(store.error).toBe('Delete failed')
    })
  })

  describe('publishConfig', () => {
    it('publishes config successfully', async () => {
      vi.mocked(batataApi.publishConfig).mockResolvedValue({} as never)

      const store = useBatataStore()
      const result = await store.publishConfig({
        dataId: 'test.yaml',
        groupName: 'DEFAULT_GROUP',
        content: 'key: value',
      })

      expect(result).toBe(true)
    })
  })

  describe('clearError', () => {
    it('clears the error state', async () => {
      vi.mocked(batataApi.getServiceList).mockRejectedValue(new Error('some error'))

      const store = useBatataStore()
      try {
        await store.fetchServices()
      } catch {
        // expected
      }

      expect(store.error).toBe('some error')
      store.clearError()
      expect(store.error).toBeNull()
    })
  })
})
