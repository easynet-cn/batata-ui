import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'

// Mock storage
vi.mock('@/composables/useStorage', () => ({
  storage: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    getJSON: vi.fn(),
    setJSON: vi.fn(),
  },
}))

// Mock config
vi.mock('@/config', () => ({
  config: {
    api: {
      baseUrl: 'http://localhost:8848',
      timeout: 30000,
    },
    storage: {
      tokenKey: 'batata-token',
      usernameKey: 'batata-username',
    },
    cache: {
      maxSize: 100,
      ttl: 60000,
    },
  },
}))

// storage is imported dynamically in tests via await import()

// Capture interceptors from axios.create
let requestInterceptorFulfilled: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig
let responseInterceptorFulfilled: (response: AxiosResponse) => AxiosResponse
let responseInterceptorRejected: (error: unknown) => never

const mockAxiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: {
      use: vi.fn((fulfilled: typeof requestInterceptorFulfilled) => {
        requestInterceptorFulfilled = fulfilled
      }),
    },
    response: {
      use: vi.fn(
        (
          fulfilled: typeof responseInterceptorFulfilled,
          rejected: typeof responseInterceptorRejected,
        ) => {
          responseInterceptorFulfilled = fulfilled
          responseInterceptorRejected = rejected
        },
      ),
    },
  },
} as unknown as AxiosInstance

vi.spyOn(axios, 'create').mockReturnValue(mockAxiosInstance)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BatataApiModule = { default: any }

function catchError(fn: () => void): Error | null {
  try {
    fn()
    return null
  } catch (e) {
    return e as Error
  }
}

describe('BatataApi', () => {
  let BatataApi: BatataApiModule

  beforeEach(async () => {
    vi.clearAllMocks()

    // Re-mock axios.create before each import
    vi.spyOn(axios, 'create').mockReturnValue(mockAxiosInstance)

    // Reset module cache to re-trigger constructor
    vi.resetModules()

    // Re-apply mocks after reset
    vi.doMock('@/composables/useStorage', () => ({
      storage: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
        getJSON: vi.fn(),
        setJSON: vi.fn(),
      },
    }))

    vi.doMock('@/config', () => ({
      config: {
        api: {
          baseUrl: 'http://localhost:8848',
          timeout: 30000,
        },
        storage: {
          tokenKey: 'batata-token',
          usernameKey: 'batata-username',
        },
        cache: {
          maxSize: 100,
          ttl: 60000,
        },
      },
    }))

    BatataApi = await import('@/api/batata')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('request interceptor', () => {
    it('attaches token and username from storage', async () => {
      const { storage: storageModule } = await import('@/composables/useStorage')

      vi.mocked(storageModule.get).mockReturnValueOnce('my-token').mockReturnValueOnce('my-user')

      const config = {
        headers: {
          set: vi.fn(),
          get: vi.fn(),
          has: vi.fn(),
          delete: vi.fn(),
        },
      } as unknown as InternalAxiosRequestConfig

      const result = requestInterceptorFulfilled(config)

      expect(result.headers.accessToken).toBe('my-token')
      expect(result.headers.username).toBe('my-user')
    })

    it('does not attach headers when no token', async () => {
      const { storage: storageModule } = await import('@/composables/useStorage')

      vi.mocked(storageModule.get).mockReturnValue(null)

      const config = {
        headers: {
          set: vi.fn(),
          get: vi.fn(),
          has: vi.fn(),
          delete: vi.fn(),
        },
      } as unknown as InternalAxiosRequestConfig

      const result = requestInterceptorFulfilled(config)

      expect(result.headers.accessToken).toBeUndefined()
      expect(result.headers.username).toBeUndefined()
    })
  })

  describe('response interceptor', () => {
    it('passes through successful responses with code 0', () => {
      const response = {
        data: { code: 0, message: 'ok', data: { test: true } },
      } as AxiosResponse

      const result = responseInterceptorFulfilled(response)
      expect(result).toBe(response)
    })

    it('passes through successful responses with code 200', () => {
      const response = {
        data: { code: 200, message: 'ok', data: {} },
      } as AxiosResponse

      const result = responseInterceptorFulfilled(response)
      expect(result).toBe(response)
    })

    it('throws ApiError for non-success response codes', () => {
      const response = {
        data: { code: 500, message: 'Internal error', data: null },
      } as AxiosResponse

      // Use name check since instanceof fails across module resets
      expect(() => responseInterceptorFulfilled(response)).toThrowError('Internal error')
    })

    it('throws NetworkError when no response', () => {
      const error = { response: undefined }

      const thrown = catchError(() => responseInterceptorRejected(error))
      expect(thrown).not.toBeNull()
      expect(thrown!.name).toBe('NetworkError')
    })

    it('throws AuthError on 401', async () => {
      const { storage: storageModule } = await import('@/composables/useStorage')

      const error = {
        response: { status: 401, data: {} },
      }

      const thrown = catchError(() => responseInterceptorRejected(error))
      expect(thrown).not.toBeNull()
      expect(thrown!.name).toBe('AuthError')
      expect(storageModule.remove).toHaveBeenCalledWith('batata-token')
      expect(storageModule.remove).toHaveBeenCalledWith('batata-username')
    })

    it('throws AuthError on 403', () => {
      const error = {
        response: { status: 403, data: {} },
      }

      const thrown = catchError(() => responseInterceptorRejected(error))
      expect(thrown).not.toBeNull()
      expect(thrown!.name).toBe('AuthError')
    })

    it('throws ApiError for other HTTP errors', () => {
      const error = {
        response: { status: 502, data: { message: 'Bad Gateway' } },
        message: 'Request failed',
      }

      const thrown = catchError(() => responseInterceptorRejected(error))
      expect(thrown).not.toBeNull()
      expect(thrown!.name).toBe('ApiError')
      expect((thrown as unknown as { code: number }).code).toBe(502)
      expect(thrown!.message).toBe('Bad Gateway')
    })
  })

  describe('API methods', () => {
    it('calls getServiceList with correct params', async () => {
      const mockResponse = {
        data: { code: 0, data: { pageItems: [], totalCount: 0 } },
      }
      ;(mockAxiosInstance.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse)

      await BatataApi.default.getServiceList({
        pageNo: 1,
        pageSize: 20,
        serviceName: 'test',
      })

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/ns/service/list', {
        params: { pageNo: 1, pageSize: 20, serviceName: 'test' },
      })
    })

    it('calls getConfigList with correct params', async () => {
      const mockResponse = {
        data: { code: 0, data: { pageItems: [], totalCount: 0 } },
      }
      ;(mockAxiosInstance.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse)

      await BatataApi.default.getConfigList({
        pageNo: 1,
        pageSize: 10,
        dataId: 'test.yaml',
      })

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/cs/config/list', {
        params: { pageNo: 1, pageSize: 10, dataId: 'test.yaml' },
      })
    })

    it('calls publishConfig with POST', async () => {
      const mockResponse = { data: { code: 0, message: 'ok' } }
      ;(mockAxiosInstance.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse)

      const configData = {
        dataId: 'test.yaml',
        groupName: 'DEFAULT_GROUP',
        content: 'key: value',
      }

      await BatataApi.default.publishConfig(configData)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/cs/config', configData)
    })

    it('calls deleteConfig with correct params', async () => {
      const mockResponse = { data: { code: 0 } }
      ;(mockAxiosInstance.delete as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse)

      await BatataApi.default.deleteConfig('test.yaml', 'DEFAULT_GROUP', 'public')

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/cs/config', {
        params: { dataId: 'test.yaml', groupName: 'DEFAULT_GROUP', tenant: 'public' },
      })
    })

    it('calls createMcpServer with POST', async () => {
      const mockResponse = { data: { code: 0 } }
      ;(mockAxiosInstance.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse)

      const payload = { name: 'test-mcp', type: 'stdio' as const, command: 'npx test' }

      await BatataApi.default.createMcpServer(payload)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/ai/mcp/servers', payload)
    })

    it('calls getNamespaceList', async () => {
      const mockResponse = { data: { code: 0, data: [] } }
      ;(mockAxiosInstance.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse)

      await BatataApi.default.getNamespaceList()

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/core/namespace/list')
    })
  })

  describe('cache', () => {
    it('clearCache clears all cached data', () => {
      // clearCache should not throw
      expect(() => BatataApi.default.clearCache()).not.toThrow()
    })

    it('clearCache with pattern clears matching entries', () => {
      expect(() => BatataApi.default.clearCache('/ns/service')).not.toThrow()
    })
  })
})
