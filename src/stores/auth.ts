import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import batataApi from '@/api/batata'
import { config } from '@/config'
import { storage } from '@/composables/useStorage'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<{ username: string; token: string } | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!currentUser.value)
  const username = computed(() => currentUser.value?.username || '')

  function restoreSession(): boolean {
    if (currentUser.value) return true
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

  function logout() {
    currentUser.value = null
    storage.remove(config.storage.tokenKey)
    storage.remove(config.storage.usernameKey)
    storage.remove(config.storage.userKey)
  }

  function clearError() {
    error.value = null
  }

  return {
    currentUser,
    loading,
    error,
    isAuthenticated,
    username,
    restoreSession,
    login,
    logout,
    clearError,
  }
})
