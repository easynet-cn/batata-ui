import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AxiosInstance } from 'axios'

/**
 * Upstream Consul registers distinct singular/plural ACL binding-rule routes
 * (agent/http_register.go) and a single peering-token route:
 *
 *   GET    /v1/acl/binding-rules            (list)
 *   PUT    /v1/acl/binding-rule             (create)
 *   GET    /v1/acl/binding-rule/{id}        (read)
 *   PUT    /v1/acl/binding-rule/{id}        (update)
 *   DELETE /v1/acl/binding-rule/{id}        (delete)
 *   POST   /v1/peering/token                (generate token)
 *
 * The console gateway strips `/consul-api`, so `ConsulApi` must emit exactly
 * those suffixes relative to `/consul-api/v1`. These assertions guard against
 * reintroducing the former plural detail paths and `/peering/token/generate`.
 */
const { http } = vi.hoisted(() => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}))

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>()
  return { ...actual, default: { ...actual.default, create: vi.fn(() => http) } }
})

// Keep the singleton construction free of unrelated side effects.
vi.mock('@/utils/retry', () => ({ setupRetryInterceptor: vi.fn() }))
vi.mock('@/api/client', () => ({ clearProviderTokenOnExpired: vi.fn() }))
vi.mock('@/composables/useStorage', () => ({
  storage: { get: vi.fn(() => null), set: vi.fn(), remove: vi.fn() },
}))

import consulApi from '@/api/consul'

const instance = http as unknown as {
  get: ReturnType<typeof vi.fn>
  post: ReturnType<typeof vi.fn>
  put: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
} & AxiosInstance

beforeEach(() => {
  vi.clearAllMocks()
  for (const method of [instance.get, instance.post, instance.put, instance.delete]) {
    method.mockResolvedValue({ data: {} })
  }
})

describe('Consul API upstream route contracts', () => {
  describe('ACL binding rules', () => {
    it('lists rules through the plural upstream list route', async () => {
      await consulApi.listBindingRules('k8s-auth')

      expect(instance.get).toHaveBeenCalledWith('/acl/binding-rules', {
        params: { authmethod: 'k8s-auth' },
      })
    })

    it('reads a rule through the singular detail route', async () => {
      await consulApi.getBindingRule('rule-123')

      expect(instance.get).toHaveBeenCalledWith('/acl/binding-rule/rule-123')
    })

    it('creates a rule through the singular collection route', async () => {
      const payload = {
        AuthMethod: 'k8s-auth',
        BindType: 'service',
        BindName: 'web',
      }
      await consulApi.createBindingRule(payload)

      expect(instance.put).toHaveBeenCalledWith('/acl/binding-rule', payload)
    })

    it('updates a rule through the singular detail route', async () => {
      const payload = { BindType: 'role', BindName: 'ops' }
      await consulApi.updateBindingRule('rule-123', payload)

      expect(instance.put).toHaveBeenCalledWith('/acl/binding-rule/rule-123', payload)
    })

    it('deletes a rule through the singular detail route', async () => {
      await consulApi.deleteBindingRule('rule-123')

      expect(instance.delete).toHaveBeenCalledWith('/acl/binding-rule/rule-123')
    })

    it('uses only singular paths for the full binding-rule CRUD sequence', async () => {
      await consulApi.getBindingRule('rule-123')
      await consulApi.createBindingRule({
        AuthMethod: 'k8s-auth',
        BindType: 'service',
        BindName: 'web',
      })
      await consulApi.updateBindingRule('rule-123', { BindType: 'service', BindName: 'web' })
      await consulApi.deleteBindingRule('rule-123')

      const requestedUrls = [
        ...instance.get.mock.calls.map((call) => call[0]),
        ...instance.put.mock.calls.map((call) => call[0]),
        ...instance.delete.mock.calls.map((call) => call[0]),
      ]
      expect(requestedUrls).toEqual([
        '/acl/binding-rule/rule-123',
        '/acl/binding-rule',
        '/acl/binding-rule/rule-123',
        '/acl/binding-rule/rule-123',
      ])
    })
  })

  describe('peering', () => {
    it('generates a peering token through POST /peering/token', async () => {
      await consulApi.generatePeeringToken('dc2')

      expect(instance.post).toHaveBeenCalledWith('/peering/token', {
        PeerName: 'dc2',
        Meta: undefined,
      })
    })

    it('forwards optional metadata without changing the route', async () => {
      await consulApi.generatePeeringToken('dc2', { env: 'test' })

      expect(instance.post).toHaveBeenCalledWith('/peering/token', {
        PeerName: 'dc2',
        Meta: { env: 'test' },
      })
    })
  })
})
