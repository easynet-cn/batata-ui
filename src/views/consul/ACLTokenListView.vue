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

    <!-- Token List -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('accessorId') }}</th>
              <th>{{ t('description') }}</th>
              <th>{{ t('policies') }}</th>
              <th>{{ t('roles') }}</th>
              <th>{{ t('local') }}</th>
              <th>{{ t('createTime') }}</th>
              <th class="w-24">{{ t('actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.loading">
              <td colspan="7" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
              </td>
            </tr>
            <tr v-else-if="store.aclTokens.length === 0">
              <td colspan="7" class="text-center py-6 text-text-secondary">
                {{ t('noTokens') }}
              </td>
            </tr>
            <tr v-for="token in store.aclTokens" :key="token.AccessorID">
              <td>
                <span class="font-mono text-xs" :title="token.AccessorID">
                  {{ truncateId(token.AccessorID) }}
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
              <td>
                <span :class="token.Local ? 'badge badge-success' : 'badge badge-warning'">
                  {{ token.Local ? t('yes') : t('no') }}
                </span>
              </td>
              <td class="text-text-secondary text-xs">
                {{ formatTime(token.CreateTime) }}
              </td>
              <td>
                <button
                  @click="handleDelete(token)"
                  class="btn btn-ghost btn-sm text-danger"
                  :title="t('delete')"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Token Modal -->
    <FormModal
      v-model="showCreateModal"
      :title="t('createToken')"
      :submit-text="t('create')"
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
import { ref, onMounted } from 'vue'
import { Plus, RefreshCw, Trash2, Loader2 } from 'lucide-vue-next'
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
const tokenToDelete = ref<ConsulACLToken | null>(null)
const selectedPolicyIds = ref<string[]>([])
const selectedRoleIds = ref<string[]>([])

const createForm = ref({
  Description: '',
})

// Helpers
function truncateId(id: string): string {
  if (!id) return '-'
  return id.length > 8 ? `${id.substring(0, 8)}...` : id
}

function formatTime(time: string): string {
  if (!time) return '-'
  try {
    return new Date(time).toLocaleString()
  } catch {
    return time
  }
}

// Actions
async function loadTokens() {
  try {
    await store.fetchACLTokens()
  } catch (error) {
    logger.error('Failed to fetch ACL tokens:', error)
    toast.error(t('operationFailed'))
  }
}

async function openCreateModal() {
  showCreateModal.value = true
  createForm.value.Description = ''
  selectedPolicyIds.value = []
  selectedRoleIds.value = []
  // Load policies and roles for the selector
  try {
    await Promise.all([store.fetchACLPolicies(), store.fetchACLRoles()])
  } catch (error) {
    logger.error('Failed to load policies/roles:', error)
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
    await consulApi.createACLToken({
      Description: createForm.value.Description,
      Policies: policies,
      Roles: roles,
    })
    showCreateModal.value = false
    toast.success(t('success'))
    await loadTokens()
  } catch (error) {
    logger.error('Failed to create ACL token:', error)
    toast.error(t('operationFailed'))
  } finally {
    saving.value = false
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
    toast.error(t('operationFailed'))
  }
}

// Lifecycle
onMounted(() => {
  loadTokens()
})
</script>
