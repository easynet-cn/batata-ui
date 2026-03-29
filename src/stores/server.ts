import { defineStore } from 'pinia'
import { ref } from 'vue'
import batataApi from '@/api/batata'
import { logger } from '@/utils/logger'

export const useServerStore = defineStore('server', () => {
  const version = ref('')
  const authEnabled = ref(true)
  const consoleUiEnabled = ref(true)
  const authAdminRequest = ref(false)
  const functionMode = ref('')
  const loaded = ref(false)
  const loading = ref(false)

  async function fetchServerState() {
    if (loaded.value) return
    loading.value = true
    try {
      const response = await batataApi.getServerState()
      const state = response.data
      if (state) {
        version.value = state.version || ''
        authEnabled.value = state.auth_enabled !== 'false'
        consoleUiEnabled.value = state.console_ui_enabled !== 'false'
        authAdminRequest.value = state.auth_admin_request === 'true'
        functionMode.value = state.function_mode || ''
      }
      loaded.value = true
    } catch (err) {
      logger.error('Failed to fetch server state:', err)
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  return {
    version,
    authEnabled,
    consoleUiEnabled,
    authAdminRequest,
    functionMode,
    loaded,
    loading,
    fetchServerState,
  }
})
