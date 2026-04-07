import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import batataApi from '@/api/batata'
import consulApi from '@/api/consul'
import { config } from '@/config'
import { storage } from '@/composables/useStorage'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<{ username: string; token: string } | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const consulAclEnabled = ref(false)

  const isAuthenticated = computed(() => !!currentUser.value)
  const username = computed(() => currentUser.value?.username || '')

  function restoreSession(): boolean {
    if (currentUser.value) return true

    const provider = storage.get('batata_provider') || 'batata'

    if (provider === 'consul') {
      // Consul: restore from consul token
      const consulToken = storage.get(config.storage.consulTokenKey)
      if (consulToken) {
        currentUser.value = { username: 'consul', token: consulToken }
        return true
      }
      // If ACL is disabled, allow access without token
      if (!consulAclEnabled.value) {
        currentUser.value = { username: 'anonymous', token: '' }
        return true
      }
      return false
    }

    // Batata: restore from batata token
    const savedUser = storage.getJSON<{ name: string }>(config.storage.userKey)
    const savedToken = storage.get(config.storage.tokenKey)
    if (savedUser?.name && savedToken) {
      currentUser.value = { username: savedUser.name, token: savedToken }
      return true
    }
    return false
  }

  async function login(username: string, password: string) {
    try {
      loading.value = true
      error.value = null
      const response = await batataApi.login(username, password)
      const { accessToken } = response.data
      currentUser.value = { username, token: accessToken }
      storage.set(config.storage.tokenKey, accessToken)
      storage.set(config.storage.usernameKey, username)
      storage.setJSON(config.storage.userKey, { name: username })
      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Login failed'
      return false
    } finally {
      loading.value = false
    }
  }

  async function loginWithToken(secretId: string) {
    try {
      loading.value = true
      error.value = null
      // Validate token by calling Consul ACL token self endpoint
      const response = await consulApi.getACLTokenSelf(secretId)
      const tokenInfo = response.data
      const name = tokenInfo.Description || tokenInfo.AccessorID || 'consul'
      currentUser.value = { username: name, token: secretId }
      storage.set(config.storage.consulTokenKey, secretId)
      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Invalid ACL Token'
      return false
    } finally {
      loading.value = false
    }
  }

  async function loginWithOIDC(authMethod: string, redirectURI: string): Promise<string | null> {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.getOIDCAuthURL(authMethod, redirectURI)
      return response.data.AuthURL
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to get OIDC URL'
      return null
    } finally {
      loading.value = false
    }
  }

  async function completeOIDCLogin(authMethod: string, code: string, state: string) {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.exchangeOIDCToken(authMethod, code, state)
      const tokenInfo = response.data
      const name = tokenInfo.Description || tokenInfo.AccessorID || 'consul'
      currentUser.value = { username: name, token: tokenInfo.SecretID }
      storage.set(config.storage.consulTokenKey, tokenInfo.SecretID)
      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'OIDC login failed'
      return false
    } finally {
      loading.value = false
    }
  }

  function setConsulAclEnabled(enabled: boolean) {
    consulAclEnabled.value = enabled
    // When ACL is disabled, auto-authenticate as anonymous
    if (!enabled) {
      const provider = storage.get('batata_provider') || 'batata'
      if (provider === 'consul' && !currentUser.value) {
        currentUser.value = { username: 'anonymous', token: '' }
      }
    }
  }

  function logout() {
    currentUser.value = null
    storage.remove(config.storage.tokenKey)
    storage.remove(config.storage.usernameKey)
    storage.remove(config.storage.userKey)
    storage.remove(config.storage.consulTokenKey)
  }

  function clearError() {
    error.value = null
  }

  // Cross-tab token sync via StorageEvent
  function setupStorageSync() {
    window.addEventListener('storage', (e: StorageEvent) => {
      if (e.key === config.storage.consulTokenKey) {
        if (e.newValue) {
          // Token changed in another tab
          currentUser.value = { username: 'consul', token: e.newValue }
        } else {
          // Token removed in another tab
          currentUser.value = null
        }
      } else if (e.key === config.storage.tokenKey) {
        if (e.newValue) {
          const savedUser = storage.getJSON<{ name: string }>(config.storage.userKey)
          currentUser.value = { username: savedUser?.name || '', token: e.newValue }
        } else {
          currentUser.value = null
        }
      }
    })
  }

  return {
    currentUser,
    loading,
    error,
    consulAclEnabled,
    isAuthenticated,
    username,
    restoreSession,
    login,
    loginWithToken,
    loginWithOIDC,
    completeOIDCLogin,
    setConsulAclEnabled,
    logout,
    clearError,
    setupStorageSync,
  }
})
