import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Namespace } from '@/types'
import batataApi from '@/api/batata'
import { storage } from '@/composables/useStorage'
import { logger } from '@/utils/logger'

const NAMESPACE_KEY = 'batata_namespace'

export const useNamespaceStore = defineStore('namespace', () => {
  const namespaces = ref<Namespace[]>([])
  const currentNamespace = ref<string>(storage.get(NAMESPACE_KEY) || 'public')
  const loading = ref(false)

  async function fetchNamespaces() {
    loading.value = true
    try {
      const response = await batataApi.getNamespaceList()
      namespaces.value = response.data.data
      return response.data.data
    } catch (err) {
      logger.error('Failed to fetch namespaces:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  function selectNamespace(ns: string) {
    currentNamespace.value = ns
    storage.set(NAMESPACE_KEY, ns)
  }

  async function createNamespace(data: {
    namespaceId?: string
    namespaceName: string
    namespaceDesc?: string
  }) {
    await batataApi.createNamespace(data)
  }

  async function deleteNamespace(namespaceId: string) {
    await batataApi.deleteNamespace(namespaceId)
  }

  return {
    namespaces,
    currentNamespace,
    loading,
    fetchNamespaces,
    selectNamespace,
    createNamespace,
    deleteNamespace,
  }
})
