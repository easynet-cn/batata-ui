import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import batataApi from '@/api/batata'
import consulApi from '@/api/consul'
import apolloApi from '@/api/apollo'
import { config } from '@/config'
import { storage } from '@/composables/useStorage'
import type { ProviderType } from '@/types'

interface UserSession {
  username: string
  token: string
  globalAdmin: boolean
}

const CONSUL_USER_KEY = 'consul_user'
const APOLLO_USER_KEY = 'apollo_user'
const SIGNED_OUT_KEY = 'batata_signed_out_providers'

function normalizeProvider(value: string | null): ProviderType {
  return value === 'consul' || value === 'apollo' ? value : 'batata'
}

function parseSignedOut(raw: string | null): ProviderType[] {
  if (!raw) return []
  return raw
    .split(',')
    .filter((p): p is ProviderType => p === 'batata' || p === 'consul' || p === 'apollo')
}

export const useAuthStore = defineStore('auth', () => {
  // `currentUser` is a view of the ACTIVE provider's own credentials, rebuilt
  // by restoreSession() on each navigation. It must never be treated as a
  // global identity shared across providers: signing out of one provider may
  // not invalidate the others.
  const currentUser = ref<UserSession | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  // Fail closed until the server state has been read: on a cold start we must
  // not assume Consul ACL is disabled, otherwise the router guard lets an
  // unauthenticated visitor straight into the Consul dashboard.
  const consulAclEnabled = ref(true)
  const consulAclLoaded = ref(false)
  // Providers with implicit access (Consul ACL disabled) would otherwise be
  // re-created by restoreSession() right after a sign-out. Persist an explicit
  // sign-out PER PROVIDER so it survives reloads and never re-enables another
  // provider that the user also signed out of.
  const signedOutProviders = ref<ProviderType[]>(parseSignedOut(storage.get(SIGNED_OUT_KEY)))

  function persistSignedOut() {
    if (signedOutProviders.value.length) {
      storage.set(SIGNED_OUT_KEY, signedOutProviders.value.join(','))
    } else {
      storage.remove(SIGNED_OUT_KEY)
    }
  }

  function markSignedOut(provider: ProviderType) {
    if (!signedOutProviders.value.includes(provider)) signedOutProviders.value.push(provider)
    persistSignedOut()
  }

  function clearSignedOut(provider: ProviderType) {
    signedOutProviders.value = signedOutProviders.value.filter((p) => p !== provider)
    persistSignedOut()
  }

  // Backward-compatible view of the most recent sign-out, kept for UI/tests
  // that only care about the active provider.
  const explicitlyLoggedOut = computed<ProviderType | null>(
    () => signedOutProviders.value[signedOutProviders.value.length - 1] ?? null,
  )
  const isProviderSignedOut = (provider: ProviderType): boolean =>
    signedOutProviders.value.includes(provider)

  const isAuthenticated = computed(() => !!currentUser.value)
  const username = computed(() => currentUser.value?.username || '')
  const isGlobalAdmin = computed(() => currentUser.value?.globalAdmin === true)
  const consulAnonymousAllowed = computed(
    () => consulAclLoaded.value && !consulAclEnabled.value && !isProviderSignedOut('consul'),
  )

  function getSessionForProvider(provider: ProviderType): UserSession | null {
    switch (provider) {
      case 'consul': {
        const token = storage.get(config.storage.consulTokenKey)
        if (token) {
          return {
            username: storage.get(CONSUL_USER_KEY) || 'consul',
            token,
            globalAdmin: true,
          }
        }
        // Anonymous access is only granted after the server confirmed ACL is
        // disabled, and not after the user explicitly signed out of Consul.
        if (consulAnonymousAllowed.value) {
          return { username: 'anonymous', token: '', globalAdmin: false }
        }
        return null
      }
      case 'apollo': {
        const token = storage.get(config.storage.apolloTokenKey)
        if (token) {
          return {
            username: storage.get(APOLLO_USER_KEY) || 'apollo',
            token,
            globalAdmin: true,
          }
        }
        return null
      }
      default: {
        const savedUser = storage.getJSON<{ name: string; globalAdmin?: boolean }>(
          config.storage.userKey,
        )
        const savedToken = storage.get(config.storage.tokenKey)
        if (savedUser?.name && savedToken) {
          return {
            username: savedUser.name,
            token: savedToken,
            globalAdmin: savedUser.globalAdmin === true,
          }
        }
        return null
      }
    }
  }

  /**
   * Rebuild the active identity from a provider's own storage keys. Passing an
   * explicit provider lets the caller switch identity as part of a provider
   * switch; without one the persisted provider preference is used.
   */
  function restoreSession(provider?: ProviderType): boolean {
    const target = normalizeProvider(provider ?? storage.get('batata_provider'))
    const session = getSessionForProvider(target)
    currentUser.value = session
    return session !== null
  }

  async function login(username: string, password: string) {
    try {
      loading.value = true
      error.value = null
      const response = await batataApi.login(username, password)
      const { accessToken, globalAdmin } = response.data
      const admin = globalAdmin === true
      currentUser.value = { username, token: accessToken, globalAdmin: admin }
      storage.set(config.storage.tokenKey, accessToken)
      storage.set(config.storage.usernameKey, username)
      storage.setJSON(config.storage.userKey, { name: username, globalAdmin: admin })
      clearSignedOut('batata')
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
      const name = tokenInfo.Description || 'Consul Token'
      currentUser.value = { username: name, token: secretId, globalAdmin: true }
      storage.set(config.storage.consulTokenKey, secretId)
      storage.set(CONSUL_USER_KEY, name)
      clearSignedOut('consul')
      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Invalid ACL Token'
      return false
    } finally {
      loading.value = false
    }
  }

  async function loginWithApolloToken(token: string, username = 'apollo'): Promise<boolean> {
    try {
      loading.value = true
      error.value = null
      // Validate the Apollo token by calling a lightweight open-api endpoint
      await apolloApi.listApps()
      currentUser.value = { username, token, globalAdmin: true }
      storage.set(config.storage.apolloTokenKey, token)
      storage.set(APOLLO_USER_KEY, username)
      clearSignedOut('apollo')
      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Invalid Apollo Token'
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
      const name = tokenInfo.Description || 'Consul Token'
      currentUser.value = { username: name, token: tokenInfo.SecretID, globalAdmin: true }
      storage.set(config.storage.consulTokenKey, tokenInfo.SecretID)
      storage.set(CONSUL_USER_KEY, name)
      clearSignedOut('consul')
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
    consulAclLoaded.value = true
  }

  /**
   * Explicitly (re-)enter Consul's anonymous mode from the login page. This
   * preserves the original "continue without logging in" behavior: ACL is
   * switched off locally, the sign-out marker is cleared, and the anonymous
   * identity is rebuilt.
   */
  function loginAnonymously(): boolean {
    setConsulAclEnabled(false)
    clearSignedOut('consul')
    return restoreSession('consul')
  }

  /**
   * Sign out of the ACTIVE provider only. Other providers keep their stored
   * credentials, so switching back to them restores their session directly.
   */
  function logout() {
    const provider = normalizeProvider(storage.get('batata_provider'))
    switch (provider) {
      case 'consul':
        storage.remove(config.storage.consulTokenKey)
        storage.remove(CONSUL_USER_KEY)
        break
      case 'apollo':
        storage.remove(config.storage.apolloTokenKey)
        storage.remove(APOLLO_USER_KEY)
        break
      default:
        storage.remove(config.storage.tokenKey)
        storage.remove(config.storage.usernameKey)
        storage.remove(config.storage.userKey)
    }
    markSignedOut(provider)
    currentUser.value = null
  }

  function clearError() {
    error.value = null
  }

  // Cross-tab token sync via StorageEvent
  function setupStorageSync() {
    window.addEventListener('storage', (e: StorageEvent) => {
      if (e.key === config.storage.consulTokenKey) {
        if (e.newValue) {
          currentUser.value = {
            username: storage.get(CONSUL_USER_KEY) || 'consul',
            token: e.newValue,
            globalAdmin: true,
          }
        } else {
          currentUser.value = null
        }
      } else if (e.key === config.storage.apolloTokenKey) {
        if (e.newValue) {
          currentUser.value = {
            username: storage.get(APOLLO_USER_KEY) || 'apollo',
            token: e.newValue,
            globalAdmin: true,
          }
        } else {
          currentUser.value = null
        }
      } else if (e.key === config.storage.tokenKey) {
        if (e.newValue) {
          const savedUser = storage.getJSON<{ name: string; globalAdmin?: boolean }>(
            config.storage.userKey,
          )
          currentUser.value = {
            username: savedUser?.name || '',
            token: e.newValue,
            globalAdmin: savedUser?.globalAdmin === true,
          }
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
    consulAclLoaded,
    consulAnonymousAllowed,
    signedOutProviders,
    explicitlyLoggedOut,
    isProviderSignedOut,
    isAuthenticated,
    isGlobalAdmin,
    username,
    getSessionForProvider,
    restoreSession,
    login,
    loginWithToken,
    loginWithApolloToken,
    loginWithOIDC,
    completeOIDCLogin,
    setConsulAclEnabled,
    loginAnonymously,
    logout,
    clearError,
    setupStorageSync,
  }
})
