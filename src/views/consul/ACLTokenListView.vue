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
        <RouterLink to="/consul/acl/token/new" class="btn btn-primary btn-sm">
          <Plus class="w-3.5 h-3.5" />
          {{ t('createToken') }}
        </RouterLink>
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
                  <RouterLink
                    :to="`/consul/acl/token/${token.AccessorID}/edit`"
                    class="btn btn-ghost btn-sm text-text-secondary"
                    :title="t('edit')"
                  >
                    <Pencil class="w-3.5 h-3.5" />
                  </RouterLink>
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
import { RouterLink } from 'vue-router'
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
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import type { ConsulACLToken } from '@/types/consul'

const { t } = useI18n()
const store = useConsulStore()

// State
const showDeleteModal = ref(false)
const tokenToDelete = ref<ConsulACLToken | null>(null)
const searchQuery = ref('')
const scopeFilter = ref('')
const sortBy = ref('newest')

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
