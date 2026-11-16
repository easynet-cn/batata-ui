import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'

vi.mock('@/api/batata', () => ({
  default: {
    login: vi.fn(),
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

vi.mock('@/config', () => ({
  config: {
    // The Consul and Apollo API modules instantiate their axios clients at
    // module load, so the mock must expose the whole api/storage surface they
    // read in their constructors.
    api: {
      baseUrl: '',
      consulBaseUrl: '/consul-api/v1',
      apolloBaseUrl: '/apollo-api/openapi/v1',
      timeout: 30000,
      retryCount: 3,
    },
    storage: {
      tokenKey: 'batata-token',
      usernameKey: 'batata-username',
      userKey: 'batata_user',
      consulTokenKey: 'consul-token',
      apolloTokenKey: 'apollo-token',
    },
  },
}))

import batataApi from '@/api/batata'
import { storage } from '@/composables/useStorage'

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('logs in successfully and stores credentials', async () => {
      vi.mocked(batataApi.login).mockResolvedValue({
        data: { accessToken: 'test-token-123' },
      } as never)

      const store = useAuthStore()
      const result = await store.login('admin', 'password')

      expect(result).toBe(true)
      expect(store.currentUser).toEqual({
        username: 'admin',
        token: 'test-token-123',
        globalAdmin: false,
      })
      expect(store.isAuthenticated).toBe(true)
      expect(store.username).toBe('admin')
      expect(storage.set).toHaveBeenCalledWith('batata-token', 'test-token-123')
      expect(storage.set).toHaveBeenCalledWith('batata-username', 'admin')
      expect(storage.setJSON).toHaveBeenCalledWith('batata_user', {
        name: 'admin',
        globalAdmin: false,
      })
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('carries the globalAdmin flag from the login response', async () => {
      vi.mocked(batataApi.login).mockResolvedValue({
        data: { accessToken: 'admin-token', globalAdmin: true },
      } as never)

      const store = useAuthStore()
      await store.login('root', 'password')

      expect(store.currentUser).toEqual({
        username: 'root',
        token: 'admin-token',
        globalAdmin: true,
      })
      expect(store.isGlobalAdmin).toBe(true)
      expect(storage.setJSON).toHaveBeenCalledWith('batata_user', {
        name: 'root',
        globalAdmin: true,
      })
    })

    it('handles login failure with Error', async () => {
      vi.mocked(batataApi.login).mockRejectedValue(new Error('Invalid credentials'))

      const store = useAuthStore()
      const result = await store.login('admin', 'wrong')

      expect(result).toBe(false)
      expect(store.currentUser).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(store.error).toBe('Invalid credentials')
      expect(store.loading).toBe(false)
    })

    it('handles non-Error login failure', async () => {
      vi.mocked(batataApi.login).mockRejectedValue('network error')

      const store = useAuthStore()
      const result = await store.login('admin', 'password')

      expect(result).toBe(false)
      expect(store.error).toBe('Login failed')
    })

    it('sets loading during login', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let resolveLogin: (value: any) => void
      vi.mocked(batataApi.login).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveLogin = resolve
          }),
      )

      const store = useAuthStore()
      const promise = store.login('admin', 'password')

      expect(store.loading).toBe(true)

      resolveLogin!({ data: { accessToken: 'token' } })
      await promise

      expect(store.loading).toBe(false)
    })
  })

  describe('per-provider sessions', () => {
    const asProviders = (provider: string, tokens: Record<string, string | null> = {}) => {
      vi.mocked(storage.get).mockImplementation(
        (key: string) =>
          ({
            batata_provider: provider,
            'batata-token': tokens.batata ?? null,
            'consul-token': tokens.consul ?? null,
            'apollo-token': tokens.apollo ?? null,
            consul_user: tokens.consulName ?? null,
            apollo_user: tokens.apolloName ?? null,
            batata_signed_out_providers: tokens.signedOut ?? null,
          })[key] ?? null,
      )
      vi.mocked(storage.getJSON).mockImplementation((key: string) =>
        key === 'batata_user'
          ? tokens.batata
            ? { name: 'batata-user', globalAdmin: false }
            : null
          : null,
      )
    }

    it('resolves each identity from its own provider credentials', () => {
      asProviders('batata', {
        batata: 'batata-token',
        consul: 'consul-token',
        consulName: 'my-consul-token',
        apollo: 'apollo-token',
        apolloName: 'apollo-user',
      })
      const store = useAuthStore()

      expect(store.getSessionForProvider('batata')).toEqual({
        username: 'batata-user',
        token: 'batata-token',
        globalAdmin: false,
      })
      expect(store.getSessionForProvider('consul')).toEqual({
        username: 'my-consul-token',
        token: 'consul-token',
        globalAdmin: true,
      })
      expect(store.getSessionForProvider('apollo')).toEqual({
        username: 'apollo-user',
        token: 'apollo-token',
        globalAdmin: true,
      })
    })

    it('rebuilds currentUser for an explicitly requested provider', () => {
      asProviders('batata', {
        batata: 'batata-token',
        consul: 'consul-token',
        consulName: 'consul-name',
      })
      const store = useAuthStore()

      expect(store.restoreSession()).toBe(true)
      expect(store.currentUser?.username).toBe('batata-user')

      // Switching provider rebuilds the identity from that provider's keys.
      expect(store.restoreSession('consul')).toBe(true)
      expect(store.currentUser).toEqual({
        username: 'consul-name',
        token: 'consul-token',
        globalAdmin: true,
      })

      // And switching back restores the batata identity again.
      expect(store.restoreSession('batata')).toBe(true)
      expect(store.currentUser?.username).toBe('batata-user')
    })

    it('logout clears only the active provider credentials', () => {
      asProviders('consul', {
        batata: 'batata-token',
        consul: 'consul-token',
        apollo: 'apollo-token',
      })
      const store = useAuthStore()
      store.restoreSession()
      expect(store.currentUser?.token).toBe('consul-token')

      store.logout()

      // Only Consul keys are removed; batata and Apollo stay signed in.
      expect(storage.remove).toHaveBeenCalledWith('consul-token')
      expect(storage.remove).not.toHaveBeenCalledWith('batata-token')
      expect(storage.remove).not.toHaveBeenCalledWith('batata_user')
      expect(storage.remove).not.toHaveBeenCalledWith('apollo-token')
      expect(storage.remove).not.toHaveBeenCalledWith('apollo_user')
      // The provider preference stays so the login page can offer a switcher.
      expect(storage.remove).not.toHaveBeenCalledWith('batata_provider')
      expect(store.currentUser).toBeNull()
    })

    it('logout of batata clears batata keys but keeps consul and apollo keys', () => {
      asProviders('batata', {
        batata: 'batata-token',
        consul: 'consul-token',
        apollo: 'apollo-token',
      })
      const store = useAuthStore()

      store.logout()

      expect(storage.remove).toHaveBeenCalledWith('batata-token')
      expect(storage.remove).toHaveBeenCalledWith('batata-username')
      expect(storage.remove).toHaveBeenCalledWith('batata_user')
      expect(storage.remove).not.toHaveBeenCalledWith('consul-token')
      expect(storage.remove).not.toHaveBeenCalledWith('apollo-token')
    })
  })

  describe('logout', () => {
    it('marks the active provider as explicitly signed out (persisted)', () => {
      asProvidersForLogout('consul')
      const store = useAuthStore()

      store.logout()

      expect(store.explicitlyLoggedOut).toBe('consul')
      expect(storage.set).toHaveBeenCalledWith('batata_signed_out_providers', 'consul')
    })

    it('successful login clears only its own signed-out marker', async () => {
      asProvidersForLogout('batata')
      vi.mocked(batataApi.login).mockResolvedValue({ data: { accessToken: 'token' } } as never)
      const store = useAuthStore()
      // Simulate a prior Consul sign-out with a persisted marker.
      vi.mocked(storage.get).mockImplementation((key: string) =>
        key === 'batata_signed_out_providers'
          ? 'consul'
          : key === 'batata_provider'
            ? 'batata'
            : null,
      )
      store.signedOutProviders.push('consul')
      store.logout() // marks batata as well -> ['consul', 'batata']
      expect(store.isProviderSignedOut('consul')).toBe(true)
      expect(store.isProviderSignedOut('batata')).toBe(true)

      await store.login('admin', 'password')

      // Batata login clears only batata; Consul stays signed out.
      expect(store.isProviderSignedOut('batata')).toBe(false)
      expect(store.isProviderSignedOut('consul')).toBe(true)
    })
  })

  describe('restoreSession', () => {
    const asBatata = (user: unknown, token: string | null) => {
      vi.mocked(storage.get).mockImplementation((key: string) =>
        key === 'batata_provider' ? 'batata' : key === 'batata-token' ? token : null,
      )
      vi.mocked(storage.getJSON).mockReturnValue(user as never)
    }

    it('restores session from storage when user and token exist', () => {
      asBatata({ name: 'saved-user' }, 'saved-token')

      const store = useAuthStore()
      const result = store.restoreSession()

      expect(result).toBe(true)
      expect(store.currentUser).toEqual({
        username: 'saved-user',
        token: 'saved-token',
        globalAdmin: false,
      })
      expect(store.isAuthenticated).toBe(true)
    })

    it('restores the globalAdmin flag from the stored user', () => {
      asBatata({ name: 'saved-admin', globalAdmin: true }, 'saved-token')

      const store = useAuthStore()
      expect(store.restoreSession()).toBe(true)
      expect(store.isGlobalAdmin).toBe(true)
    })

    it('returns false when no saved user in storage', () => {
      asBatata(null, null)

      const store = useAuthStore()
      expect(store.restoreSession()).toBe(false)
      expect(store.currentUser).toBeNull()
    })

    it('returns false when token is missing', () => {
      asBatata({ name: 'user' }, null)

      const store = useAuthStore()
      expect(store.restoreSession()).toBe(false)
      expect(store.currentUser).toBeNull()
    })

    it('returns false when user name is missing', () => {
      asBatata({}, 'token')

      const store = useAuthStore()
      expect(store.restoreSession()).toBe(false)
      expect(store.currentUser).toBeNull()
    })

    it('rebuilds from storage even when a stale identity is held in memory', () => {
      asBatata(null, null)
      const store = useAuthStore()
      store.currentUser = { username: 'stale', token: 'stale', globalAdmin: false }

      // The old short-circuit returned true without touching storage, which is
      // what made a provider switch keep the previous provider's identity.
      expect(store.restoreSession()).toBe(false)
      expect(store.currentUser).toBeNull()
    })
  })

  describe('consul ACL state', () => {
    const asConsulSession = (token: string | null = null) => {
      vi.mocked(storage.get).mockImplementation((key: string) =>
        key === 'batata_provider' ? 'consul' : token,
      )
      vi.mocked(storage.getJSON).mockReturnValue(null)
    }

    it('fails closed before the server state is known', () => {
      asConsulSession()
      const store = useAuthStore()

      // Cold start must not grant anonymous access just because the ACL flag
      // has not been read yet (the old guard bypassed auth on this path).
      expect(store.consulAclLoaded).toBe(false)
      expect(store.restoreSession()).toBe(false)
      expect(store.currentUser).toBeNull()
    })

    it('allows anonymous access only after ACL is confirmed disabled', () => {
      asConsulSession()
      const store = useAuthStore()
      store.setConsulAclEnabled(false)

      expect(store.consulAclLoaded).toBe(true)
      expect(store.consulAnonymousAllowed).toBe(true)
      expect(store.restoreSession()).toBe(true)
      expect(store.currentUser?.username).toBe('anonymous')
    })

    it('still requires a token when ACL is enabled', () => {
      asConsulSession()
      const store = useAuthStore()
      store.setConsulAclEnabled(true)

      expect(store.restoreSession()).toBe(false)
      expect(store.currentUser).toBeNull()
    })

    it('restores a consul token regardless of ACL state', () => {
      asConsulSession('consul-secret')
      const store = useAuthStore()

      expect(store.restoreSession()).toBe(true)
      expect(store.currentUser?.token).toBe('consul-secret')
    })

    it('does not auto-enter anonymous Consul after an explicit sign-out', () => {
      asConsulSession()
      const store = useAuthStore()
      store.setConsulAclEnabled(false)
      store.logout()

      expect(store.consulAnonymousAllowed).toBe(false)
      expect(store.explicitlyLoggedOut).toBe('consul')
      expect(store.restoreSession()).toBe(false)
      expect(store.currentUser).toBeNull()
    })

    it('loginAnonymously re-enters Consul and clears the sign-out marker', () => {
      asConsulSession()
      const store = useAuthStore()
      store.setConsulAclEnabled(false)
      store.logout()

      expect(store.loginAnonymously()).toBe(true)
      expect(store.explicitlyLoggedOut).toBeNull()
      expect(store.consulAnonymousAllowed).toBe(true)
      expect(store.currentUser?.username).toBe('anonymous')
    })

    it('honours a persisted sign-out marker on a fresh store (reload)', () => {
      vi.mocked(storage.get).mockImplementation((key: string) => {
        if (key === 'batata_provider') return 'consul'
        if (key === 'batata_signed_out_providers') return 'consul'
        return null
      })
      vi.mocked(storage.getJSON).mockReturnValue(null)
      const store = useAuthStore()
      store.setConsulAclEnabled(false)

      expect(store.explicitlyLoggedOut).toBe('consul')
      expect(store.consulAnonymousAllowed).toBe(false)
      expect(store.restoreSession()).toBe(false)
    })
  })

  describe('clearError', () => {
    it('clears the error state', async () => {
      vi.mocked(batataApi.login).mockRejectedValue(new Error('some error'))

      const store = useAuthStore()
      await store.login('admin', 'wrong')

      expect(store.error).toBe('some error')
      store.clearError()
      expect(store.error).toBeNull()
    })
  })
})

// Small helper shared by the logout-marker tests (no API calls needed).
function asProvidersForLogout(provider: string) {
  vi.mocked(storage.get).mockImplementation((key: string) =>
    key === 'batata_provider' ? provider : null,
  )
  vi.mocked(storage.getJSON).mockReturnValue(null)
}
