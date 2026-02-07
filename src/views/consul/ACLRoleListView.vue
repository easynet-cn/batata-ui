<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('aclRoles') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('aclRolesDesc') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="loadRoles" class="btn btn-secondary btn-sm">
          <RefreshCw class="w-3.5 h-3.5" />
          {{ t('refresh') }}
        </button>
        <button @click="openCreateModal" class="btn btn-primary btn-sm">
          <Plus class="w-3.5 h-3.5" />
          {{ t('createRole') }}
        </button>
      </div>
    </div>

    <!-- Role List -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('name') }}</th>
              <th>{{ t('description') }}</th>
              <th>{{ t('policies') }}</th>
              <th class="w-24">{{ t('actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.loading">
              <td colspan="4" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
              </td>
            </tr>
            <tr v-else-if="store.aclRoles.length === 0">
              <td colspan="4" class="text-center py-6 text-text-secondary">
                {{ t('noRoles') }}
              </td>
            </tr>
            <tr v-for="role in store.aclRoles" :key="role.ID">
              <td>
                <span class="font-medium text-text-primary">{{ role.Name }}</span>
              </td>
              <td>
                <span class="text-text-secondary">{{ role.Description || '-' }}</span>
              </td>
              <td>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="policy in role.Policies || []"
                    :key="policy.ID"
                    class="badge badge-primary"
                  >
                    {{ policy.Name }}
                  </span>
                  <span v-if="!role.Policies?.length" class="text-text-tertiary">-</span>
                </div>
              </td>
              <td>
                <button
                  @click="handleDelete(role)"
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

    <!-- Create Role Modal -->
    <FormModal
      v-model="showCreateModal"
      :title="t('createRole')"
      :submit-text="t('create')"
      :loading="saving"
      @submit="submitCreate"
    >
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('name') }} <span class="text-danger">*</span>
          </label>
          <input v-model="createForm.Name" type="text" class="input" placeholder="my-role" />
        </div>
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
            {{ t('selectPolicies') }}
          </label>
          <div class="space-y-1.5 max-h-48 overflow-y-auto border border-border rounded-xl p-3">
            <label
              v-for="policy in availablePolicies"
              :key="policy.ID"
              class="flex items-center gap-2 text-sm text-text-primary cursor-pointer"
            >
              <input
                type="checkbox"
                :value="policy.ID"
                v-model="selectedPolicyIds"
                class="rounded"
              />
              <span>{{ policy.Name }}</span>
              <span v-if="policy.Description" class="text-text-tertiary text-xs ml-1">
                ({{ policy.Description }})
              </span>
            </label>
            <p v-if="availablePolicies.length === 0" class="text-xs text-text-tertiary">
              {{ t('noPolicies') }}
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
        <p class="text-text-secondary">{{ t('confirmDeleteRole') }}</p>
        <p class="text-xs text-text-tertiary mt-2">
          <span class="font-medium text-text-primary">{{ roleToDelete?.Name }}</span>
          - {{ t('deleteRoleWarning') }}
        </p>
      </div>
    </ConfirmModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus, RefreshCw, Trash2, Loader2 } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useConsulStore } from '@/stores/consul'
import consulApi from '@/api/consul'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import FormModal from '@/components/common/FormModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import type { ConsulACLRole } from '@/types/consul'

const { t } = useI18n()
const store = useConsulStore()

// State
const saving = ref(false)
const showCreateModal = ref(false)
const showDeleteModal = ref(false)
const roleToDelete = ref<ConsulACLRole | null>(null)
const selectedPolicyIds = ref<string[]>([])
const availablePolicies = ref<{ ID: string; Name: string; Description: string }[]>([])

const createForm = reactive({
  Name: '',
  Description: '',
})

// Actions
async function loadRoles() {
  try {
    await store.fetchACLRoles()
  } catch (error) {
    logger.error('Failed to fetch ACL roles:', error)
    toast.error(t('operationFailed'))
  }
}

async function openCreateModal() {
  createForm.Name = ''
  createForm.Description = ''
  selectedPolicyIds.value = []
  showCreateModal.value = true
  // Load available policies for the selector
  try {
    await store.fetchACLPolicies()
    availablePolicies.value = store.aclPolicies.map((p) => ({
      ID: p.ID,
      Name: p.Name,
      Description: p.Description,
    }))
  } catch (error) {
    logger.error('Failed to load policies:', error)
  }
}

async function submitCreate() {
  if (!createForm.Name) {
    toast.warning(t('requiredFieldsMissing'))
    return
  }

  saving.value = true
  try {
    const policies = selectedPolicyIds.value.map((id) => {
      const found = availablePolicies.value.find((p) => p.ID === id)
      return { ID: id, Name: found?.Name || '' }
    })
    await consulApi.createACLRole({
      Name: createForm.Name,
      Description: createForm.Description,
      Policies: policies,
    })
    showCreateModal.value = false
    toast.success(t('success'))
    await loadRoles()
  } catch (error) {
    logger.error('Failed to create ACL role:', error)
    toast.error(t('operationFailed'))
  } finally {
    saving.value = false
  }
}

function handleDelete(role: ConsulACLRole) {
  roleToDelete.value = role
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!roleToDelete.value) return
  try {
    await consulApi.deleteACLRole(roleToDelete.value.ID)
    showDeleteModal.value = false
    toast.success(t('success'))
    await loadRoles()
  } catch (error) {
    logger.error('Failed to delete ACL role:', error)
    toast.error(t('operationFailed'))
  }
}

// Lifecycle
onMounted(() => {
  loadRoles()
})
</script>
