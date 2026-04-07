import { ref, computed } from 'vue'
import consulApi from '@/api/consul'
import { useConsulACLStore } from '@/stores/consul-acl'

export interface ConsulPermission {
  Resource: string
  Segment?: { Value: string }
  Access: string
  Allow: boolean
}

const permissions = ref<ConsulPermission[]>([])
const loaded = ref(false)

export function useConsulAbilities() {
  const aclStore = useConsulACLStore()

  async function fetchPermissions() {
    if (!aclStore.aclEnabled || loaded.value) return
    try {
      const checks = [
        { Resource: 'operator', Access: 'read' },
        { Resource: 'operator', Access: 'write' },
        { Resource: 'service', Segment: { Value: '' }, Access: 'read' },
        { Resource: 'node', Segment: { Value: '' }, Access: 'read' },
        { Resource: 'key', Segment: { Value: '' }, Access: 'read' },
        { Resource: 'key', Segment: { Value: '' }, Access: 'write' },
        { Resource: 'intention', Segment: { Value: '' }, Access: 'read' },
        { Resource: 'intention', Segment: { Value: '' }, Access: 'write' },
        { Resource: 'session', Segment: { Value: '' }, Access: 'read' },
        { Resource: 'session', Segment: { Value: '' }, Access: 'write' },
        { Resource: 'acl', Access: 'read' },
        { Resource: 'acl', Access: 'write' },
        { Resource: 'peering', Access: 'read' },
        { Resource: 'peering', Access: 'write' },
      ]

      // Try the authorize endpoint - if it fails, assume full access
      try {
        const response = await consulApi.checkPermissions(checks)
        permissions.value = response.data
      } catch {
        // If authorize endpoint not available, grant all permissions
        permissions.value = checks.map((c) => ({ ...c, Allow: true }))
      }
      loaded.value = true
    } catch {
      // On error, assume full access
      loaded.value = true
    }
  }

  function can(resource: string, access: string): boolean {
    if (!aclStore.aclEnabled) return true
    if (!loaded.value) return true // Optimistic: allow until permissions loaded
    const perm = permissions.value.find((p) => p.Resource === resource && p.Access === access)
    return perm?.Allow ?? true
  }

  const canReadServices = computed(() => can('service', 'read'))
  const canReadNodes = computed(() => can('node', 'read'))
  const canReadKV = computed(() => can('key', 'read'))
  const canWriteKV = computed(() => can('key', 'write'))
  const canReadIntentions = computed(() => can('intention', 'read'))
  const canWriteIntentions = computed(() => can('intention', 'write'))
  const canReadACL = computed(() => can('acl', 'read'))
  const canWriteACL = computed(() => can('acl', 'write'))
  const canReadSessions = computed(() => can('session', 'read'))
  const canReadPeerings = computed(() => can('peering', 'read'))
  const canReadOperator = computed(() => can('operator', 'read'))

  function reset() {
    permissions.value = []
    loaded.value = false
  }

  return {
    fetchPermissions,
    can,
    reset,
    canReadServices,
    canReadNodes,
    canReadKV,
    canWriteKV,
    canReadIntentions,
    canWriteIntentions,
    canReadACL,
    canWriteACL,
    canReadSessions,
    canReadPeerings,
    canReadOperator,
  }
}
