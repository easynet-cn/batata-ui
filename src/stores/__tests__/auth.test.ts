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
    storage: {
      tokenKey: 'batata-token',
      usernameKey: 'batata-username',
      userKey: 'batata_user',
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
      expect(store.currentUser).toEqual({ username: 'admin', token: 'test-token-123' })
      expect(store.isAuthenticated).toBe(true)
      expect(store.username).toBe('admin')
      expect(storage.set).toHaveBeenCalledWith('batata-token', 'test-token-123')
      expect(storage.set).toHaveBeenCalledWith('batata-username', 'admin')
      expect(storage.setJSON).toHaveBeenCalledWith('batata_user', { name: 'admin' })
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
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

  describe('logout', () => {
    it('clears user state and storage', async () => {
      vi.mocked(batataApi.login).mockResolvedValue({
        data: { accessToken: 'token' },
      } as never)

      const store = useAuthStore()
      await store.login('admin', 'password')
      expect(store.isAuthenticated).toBe(true)

      store.logout()

      expect(store.currentUser).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(store.username).toBe('')
      expect(storage.remove).toHaveBeenCalledWith('batata-token')
      expect(storage.remove).toHaveBeenCalledWith('batata-username')
      expect(storage.remove).toHaveBeenCalledWith('batata_user')
    })
  })

  describe('restoreSession', () => {
    it('restores session from storage when user and token exist', () => {
      vi.mocked(storage.getJSON).mockReturnValue({ name: 'saved-user' })
      vi.mocked(storage.get).mockReturnValue('saved-token')

      const store = useAuthStore()
      const result = store.restoreSession()

      expect(result).toBe(true)
      expect(store.currentUser).toEqual({ username: 'saved-user', token: 'saved-token' })
      expect(store.isAuthenticated).toBe(true)
    })

    it('returns false when no saved user in storage', () => {
      vi.mocked(storage.getJSON).mockReturnValue(null)
      vi.mocked(storage.get).mockReturnValue(null)

      const store = useAuthStore()
      const result = store.restoreSession()

      expect(result).toBe(false)
      expect(store.currentUser).toBeNull()
    })

    it('returns false when token is missing', () => {
      vi.mocked(storage.getJSON).mockReturnValue({ name: 'user' })
      vi.mocked(storage.get).mockReturnValue(null)

      const store = useAuthStore()
      const result = store.restoreSession()

      expect(result).toBe(false)
      expect(store.currentUser).toBeNull()
    })

    it('returns false when user name is missing', () => {
      vi.mocked(storage.getJSON).mockReturnValue({})
      vi.mocked(storage.get).mockReturnValue('token')

      const store = useAuthStore()
      const result = store.restoreSession()

      expect(result).toBe(false)
      expect(store.currentUser).toBeNull()
    })

    it('returns true immediately if user is already set', async () => {
      vi.mocked(batataApi.login).mockResolvedValue({
        data: { accessToken: 'token' },
      } as never)

      const store = useAuthStore()
      await store.login('admin', 'password')

      const result = store.restoreSession()

      expect(result).toBe(true)
      // Should not call storage since user is already set
      expect(storage.getJSON).not.toHaveBeenCalled()
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
