<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('aclTokens') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('aclTokensDesc') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="loadTokens" class="btn btn-secondary btn-sm">
          <RefreshCw class="w-3.5 h-3.5" />
          {{ t('refresh') }}
        </button>
        <button @click="openCreateModal" class="btn btn-primary btn-sm">
          <Plus class="w-3.5 h-3.5" />
          {{ t('createToken') }}
        </button>
      </div>
    </div>

    <!-- Search & Filter Bar -->
    <div class="card">
      <div class="p-3">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div class="md:col-span-2">
            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                v-model="searchQuery"
                type="text"
                class="input pl-10"
                :placeholder="t('searchTokens')"
              />
            </div>
          </div>
          <div>
            <select v-model="scopeFilter" class="input">
              <option value="">{{ t('consulFilterAll') }}</option>
              <option value="local">{{ t('tokenLocal') }}</option>
              <option value="global">{{ t('tokenGlobal') }}</option>
              <option value="management">{{ t('globalManagement') }}</option>
            </select>
          </div>
          <div>
            <select v-model="sortBy" class="input">
              <option value="newest">{{ t('sortBy') }}: {{ t('createTime') }} ↓</option>
              <option value="oldest">{{ t('sortBy') }}: {{ t('createTime') }} ↑</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Token List -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('accessorId') }}</th>
              <th>{{ t('scope') }}</th>
              <th>{{ t('description') }}</th>
              <th>{{ t('policies') }}</th>
              <th>{{ t('roles') }}</th>
              <th>{{ t('createTime') }}</th>
              <th class="w-32">{{ t('actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.loading">
              <td colspan="7" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
              </td>
            </tr>
            <tr v-else-if="sortedTokens.length === 0">
              <td colspan="7" class="text-center py-6 text-text-secondary">
                {{ t('noTokens') }}
              </td>
            </tr>
            <tr v-for="token in sortedTokens" :key="token.AccessorID" class="hover:bg-bg-secondary">
              <td>
                <span class="font-mono text-xs" :title="token.AccessorID">
                  ...{{ token.AccessorID.slice(-8) }}
                </span>
              </td>
              <td>
                <span
                  v-if="isGlobalManagement(token)"
                  class="badge bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                >
                  {{ t('globalManagement') }}
                </span>
                <span v-else-if="token.Local" class="badge badge-info">
                  {{ t('tokenLocal') }}
                </span>
                <span v-else class="badge badge-warning">
                  {{ t('tokenGlobal') }}
                </span>
              </td>
              <td>
                <span class="text-text-primary">{{ token.Description || '-' }}</span>
              </td>
              <td>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="policy in token.Policies || []"
                    :key="policy.ID"
                    class="badge badge-primary"
                  >
                    {{ policy.Name }}
                  </span>
                  <span v-if="!token.Policies?.length" class="text-text-tertiary">-</span>
                </div>
              </td>
              <td>
                <div class="flex flex-wrap gap-1">
                  <span v-for="role in token.Roles || []" :key="role.ID" class="badge badge-info">
                    {{ role.Name }}
                  </span>
                  <span v-if="!token.Roles?.length" class="text-text-tertiary">-</span>
                </div>
              </td>
              <td class="text-text-secondary text-xs">
                {{ formatTime(token.CreateTime) }}
              </td>
              <td>
                <div class="flex items-center gap-1">
                  <button
                    @click="copySecretId(token)"
                    class="btn btn-ghost btn-sm text-text-secondary"
                    :title="t('copySecretId')"
                  >
                    <ClipboardCopy class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="handleEdit(token)"
                    class="btn btn-ghost btn-sm text-text-secondary"
                    :title="t('edit')"
                  >
                    <Pencil class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="handleClone(token)"
                    class="btn btn-ghost btn-sm text-text-secondary"
                    :title="t('cloneToken')"
                  >
                    <Copy class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="handleDelete(token)"
                    class="btn btn-ghost btn-sm text-danger"
                    :title="t('delete')"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="flex items-center justify-between p-4 border-t border-border">
        <div class="text-sm text-text-secondary">
          {{ t('total') }}: {{ sortedTokens.length }} {{ t('items') }}
        </div>
      </div>
    </div>

    <!-- Create/Edit Token Modal -->
    <FormModal
      v-model="showCreateModal"
      :title="isEditing ? t('editToken') : t('createToken')"
      :submit-text="isEditing ? t('updateToken') : t('create')"
      :loading="saving"
      @submit="submitCreate"
    >
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('description') }}
          </label>
          <input
            v-model="createForm.Description"
            type="text"
            class="input"
            :placeholder="t('descriptionPlaceholder')"
          />
        </div>
        <!-- Local/Global Toggle -->
        <div v-if="!isEditing">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="createForm.Local" class="rounded" />
            <span class="text-sm text-text-primary">{{ t('tokenLocalDesc') }}</span>
          </label>
        </div>
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('policies') }}
          </label>
          <div class="space-y-1.5 max-h-40 overflow-y-auto border border-border rounded-xl p-3">
            <label
              v-for="policy in store.aclPolicies"
              :key="policy.ID"
              class="flex items-center gap-2 text-sm text-text-primary cursor-pointer"
            >
              <input
                type="checkbox"
                :value="policy.ID"
                v-model="selectedPolicyIds"
                class="rounded"
              />
              {{ policy.Name }}
            </label>
            <p v-if="store.aclPolicies.length === 0" class="text-xs text-text-tertiary">
              {{ t('noPolicies') }}
            </p>
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('roles') }}
          </label>
          <div class="space-y-1.5 max-h-40 overflow-y-auto border border-border rounded-xl p-3">
            <label
              v-for="role in store.aclRoles"
              :key="role.ID"
              class="flex items-center gap-2 text-sm text-text-primary cursor-pointer"
            >
              <input type="checkbox" :value="role.ID" v-model="selectedRoleIds" class="rounded" />
              {{ role.Name }}
            </label>
            <p v-if="store.aclRoles.length === 0" class="text-xs text-text-tertiary">
              {{ t('noRoles') }}
            </p>
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('serviceIdentities') }}
          </label>
          <div class="space-y-2 border border-border rounded-xl p-3">
            <div v-for="(si, idx) in serviceIdentities" :key="idx" class="flex items-center gap-2">
              <input
                v-model="si.ServiceName"
                type="text"
                class="input flex-1"
                :placeholder="t('serviceIdentityName')"
              />
              <button
                @click="serviceIdentities.splice(idx, 1)"
                class="btn btn-ghost btn-sm text-danger"
              >
                <Trash2 class="w-3 h-3" />
              </button>
            </div>
            <button
              @click="serviceIdentities.push({ ServiceName: '' })"
              class="btn btn-ghost btn-sm text-primary"
            >
              <Plus class="w-3 h-3" />
              {{ t('addServiceIdentity') }}
            </button>
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('nodeIdentities') }}
          </label>
          <div class="space-y-2 border border-border rounded-xl p-3">
            <div v-for="(ni, idx) in nodeIdentities" :key="idx" class="flex items-center gap-2">
              <input
                v-model="ni.NodeName"
                type="text"
                class="input flex-1"
                :placeholder="t('nodeIdentityName')"
              />
              <input
                v-model="ni.Datacenter"
                type="text"
                class="input w-32"
                :placeholder="t('nodeIdentityDc')"
              />
              <button
                @click="nodeIdentities.splice(idx, 1)"
                class="btn btn-ghost btn-sm text-danger"
              >
                <Trash2 class="w-3 h-3" />
              </button>
            </div>
            <button
              @click="nodeIdentities.push({ NodeName: '', Datacenter: '' })"
              class="btn btn-ghost btn-sm text-primary"
            >
              <Plus class="w-3 h-3" />
              {{ t('addNodeIdentity') }}
            </button>
          </div>
        </div>
      </div>
    </FormModal>

    <!-- Delete Confirm Modal -->
    <ConfirmModal
      v-model="showDeleteModal"
      :title="t('confirmDelete')"
      :confirm-text="t('delete')"
      danger
      @confirm="confirmDelete"
    >
      <div>
        <p class="text-text-secondary">{{ t('confirmDeleteToken') }}</p>
        <p class="text-xs text-text-tertiary mt-2">{{ t('deleteTokenWarning') }}</p>
      </div>
    </ConfirmModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Plus,
  RefreshCw,
  Trash2,
  Pencil,
  Loader2,
  Copy,
  Search,
  ClipboardCopy,
} from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useConsulStore } from '@/stores/consul'
import consulApi from '@/api/consul'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import FormModal from '@/components/common/FormModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import type { ConsulACLToken } from '@/types/consul'

const { t } = useI18n()
const store = useConsulStore()

// State
const saving = ref(false)
const showCreateModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const editingToken = ref<ConsulACLToken | null>(null)
const tokenToDelete = ref<ConsulACLToken | null>(null)
const selectedPolicyIds = ref<string[]>([])
const selectedRoleIds = ref<string[]>([])
const searchQuery = ref('')
const scopeFilter = ref('')
const sortBy = ref('newest')

const createForm = ref({
  Description: '',
  Local: false,
})
const serviceIdentities = ref<Array<{ ServiceName: string }>>([])
const nodeIdentities = ref<Array<{ NodeName: string; Datacenter: string }>>([])

// Helpers
const MANAGEMENT_POLICY_NAME = 'global-management'

function isGlobalManagement(token: ConsulACLToken): boolean {
  return (token.Policies || []).some((p) => p.Name === MANAGEMENT_POLICY_NAME)
}

function formatTime(time: string): string {
  if (!time) return '-'
  try {
    return new Date(time).toLocaleString()
  } catch {
    return time
  }
}

// Filtered & sorted tokens
const filteredTokens = computed(() => {
  let tokens = store.aclTokens

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    tokens = tokens.filter((t) => {
      if (t.AccessorID.toLowerCase().includes(q)) return true
      if (t.Description?.toLowerCase().includes(q)) return true
      if (t.Policies?.some((p) => p.Name.toLowerCase().includes(q))) return true
      if (t.Roles?.some((r) => r.Name.toLowerCase().includes(q))) return true
      return false
    })
  }

  if (scopeFilter.value) {
    switch (scopeFilter.value) {
      case 'local':
        tokens = tokens.filter((t) => t.Local)
        break
      case 'global':
        tokens = tokens.filter((t) => !t.Local)
        break
      case 'management':
        tokens = tokens.filter((t) => isGlobalManagement(t))
        break
    }
  }

  return tokens
})

const sortedTokens = computed(() => {
  const tokens = [...filteredTokens.value]
  tokens.sort((a, b) => {
    const da = new Date(a.CreateTime || 0).getTime()
    const db = new Date(b.CreateTime || 0).getTime()
    return sortBy.value === 'newest' ? db - da : da - db
  })
  return tokens
})

// Copy SecretID
async function copySecretId(token: ConsulACLToken) {
  try {
    const response = await consulApi.getACLToken(token.AccessorID)
    const secretId = response.data.SecretID
    if (secretId) {
      await navigator.clipboard.writeText(secretId)
      toast.success(t('copiedToClipboard'))
    }
  } catch (error) {
    logger.error('Failed to copy secret ID:', error)
    toast.apiError(error)
  }
}

// Actions
async function loadTokens() {
  try {
    await store.fetchACLTokens()
  } catch (error) {
    logger.error('Failed to fetch ACL tokens:', error)
    toast.apiError(error)
  }
}

async function openCreateModal() {
  isEditing.value = false
  editingToken.value = null
  showCreateModal.value = true
  createForm.value.Description = ''
  createForm.value.Local = false
  selectedPolicyIds.value = []
  selectedRoleIds.value = []
  serviceIdentities.value = []
  nodeIdentities.value = []
  try {
    await Promise.all([store.fetchACLPolicies(), store.fetchACLRoles()])
  } catch (error) {
    logger.error('Failed to load policies/roles:', error)
  }
}

async function handleEdit(token: ConsulACLToken) {
  isEditing.value = true
  try {
    const response = await consulApi.getACLToken(token.AccessorID)
    const fullToken = response.data
    editingToken.value = fullToken
    createForm.value.Description = fullToken.Description || ''
    createForm.value.Local = fullToken.Local
    selectedPolicyIds.value = (fullToken.Policies || []).map((p) => p.ID)
    selectedRoleIds.value = (fullToken.Roles || []).map((r) => r.ID)
    serviceIdentities.value = (fullToken.ServiceIdentities || []).map((si) => ({
      ServiceName: si.ServiceName,
    }))
    nodeIdentities.value = (fullToken.NodeIdentities || []).map((ni) => ({
      NodeName: ni.NodeName,
      Datacenter: ni.Datacenter,
    }))
    await Promise.all([store.fetchACLPolicies(), store.fetchACLRoles()])
    showCreateModal.value = true
  } catch (error) {
    logger.error('Failed to fetch token details:', error)
    toast.apiError(error)
  }
}

async function submitCreate() {
  saving.value = true
  try {
    const policies = selectedPolicyIds.value.map((id) => {
      const found = store.aclPolicies.find((p) => p.ID === id)
      return { ID: id, Name: found?.Name || '' }
    })
    const roles = selectedRoleIds.value.map((id) => {
      const found = store.aclRoles.find((r) => r.ID === id)
      return { ID: id, Name: found?.Name || '' }
    })

    const si = serviceIdentities.value
      .filter((s) => s.ServiceName.trim())
      .map((s) => ({ ServiceName: s.ServiceName.trim() }))
    const ni = nodeIdentities.value
      .filter((n) => n.NodeName.trim())
      .map((n) => ({ NodeName: n.NodeName.trim(), Datacenter: n.Datacenter.trim() }))

    const tokenData: Partial<ConsulACLToken> = {
      Description: createForm.value.Description,
      Policies: policies,
      Roles: roles,
      ServiceIdentities: si.length > 0 ? si : undefined,
      NodeIdentities: ni.length > 0 ? ni : undefined,
    }

    if (isEditing.value && editingToken.value) {
      await consulApi.updateACLToken(editingToken.value.AccessorID, tokenData)
    } else {
      await consulApi.createACLToken({ ...tokenData, Local: createForm.value.Local })
    }
    showCreateModal.value = false
    toast.success(t('success'))
    await loadTokens()
  } catch (error) {
    logger.error('Failed to save ACL token:', error)
    toast.apiError(error)
  } finally {
    saving.value = false
  }
}

async function handleClone(token: ConsulACLToken) {
  try {
    await consulApi.cloneACLToken(token.AccessorID)
    toast.success(t('success'))
    await loadTokens()
  } catch (error) {
    logger.error('Failed to clone ACL token:', error)
    toast.apiError(error)
  }
}

function handleDelete(token: ConsulACLToken) {
  tokenToDelete.value = token
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!tokenToDelete.value) return
  try {
    await consulApi.deleteACLToken(tokenToDelete.value.AccessorID)
    showDeleteModal.value = false
    toast.success(t('success'))
    await loadTokens()
  } catch (error) {
    logger.error('Failed to delete ACL token:', error)
    toast.apiError(error)
  }
}

// Lifecycle
onMounted(() => {
  loadTokens()
})
</script>
