import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  ConsulACLToken,
  ConsulACLPolicy,
  ConsulACLRole,
  ConsulACLAuthMethod,
  ConsulACLBindingRule,
} from '@/types/consul'
import consulApi from '@/api/consul'

export const useConsulACLStore = defineStore('consul-acl', () => {
  // State
  const loading = ref(false)
  const error = ref<string | null>(null)
  const aclTokens = ref<ConsulACLToken[]>([])
  const aclPolicies = ref<ConsulACLPolicy[]>([])
  const aclRoles = ref<ConsulACLRole[]>([])
  const authMethods = ref<ConsulACLAuthMethod[]>([])
  const bindingRules = ref<ConsulACLBindingRule[]>([])
  const aclEnabled = ref(true)

  // Actions
  async function fetchACLTokens() {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.listACLTokens()
      aclTokens.value = response.data || []
      return aclTokens.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch ACL tokens'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchACLPolicies() {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.listACLPolicies()
      aclPolicies.value = response.data || []
      return aclPolicies.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch ACL policies'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchACLRoles() {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.listACLRoles()
      aclRoles.value = response.data || []
      return aclRoles.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch ACL roles'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchAuthMethods() {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.listACLAuthMethods()
      authMethods.value = response.data || []
      return authMethods.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch auth methods'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchBindingRules(authMethod?: string) {
    try {
      loading.value = true
      error.value = null
      const response = await consulApi.listBindingRules(authMethod)
      bindingRules.value = response.data || []
      return bindingRules.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch binding rules'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function probeACLCapabilities() {
    try {
      const response = await consulApi.getAgentSelf()
      const config = response.data?.Config
      // If we can read agent/self, check ACL config
      // ACL is enabled by default in Consul; check Stats for ACL
      const stats = response.data?.Stats
      const aclStats = stats?.['consul.acl']
      if (aclStats && aclStats['enabled'] === 'false') {
        aclEnabled.value = false
      } else {
        // Try listing tokens; if it fails with 401/403, ACL is disabled or no access
        try {
          await consulApi.listACLTokens()
          aclEnabled.value = true
        } catch {
          aclEnabled.value = false
        }
      }
      return { datacenter: config?.Datacenter, primaryDc: config?.PrimaryDatacenter }
    } catch {
      // If agent/self fails, assume ACL not available
      aclEnabled.value = false
      return null
    }
  }

  function $reset() {
    aclTokens.value = []
    aclPolicies.value = []
    aclRoles.value = []
    authMethods.value = []
    bindingRules.value = []
    aclEnabled.value = true
    error.value = null
  }

  return {
    loading,
    error,
    aclTokens,
    aclPolicies,
    aclRoles,
    authMethods,
    bindingRules,
    aclEnabled,
    fetchACLTokens,
    fetchACLPolicies,
    fetchACLRoles,
    fetchAuthMethods,
    fetchBindingRules,
    probeACLCapabilities,
    $reset,
  }
})
