<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('aclPolicies') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('aclPoliciesDesc') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="loadPolicies" class="btn btn-secondary btn-sm">
          <RefreshCw class="w-3.5 h-3.5" />
          {{ t('refresh') }}
        </button>
        <button @click="openCreateModal" class="btn btn-primary btn-sm">
          <Plus class="w-3.5 h-3.5" />
          {{ t('createPolicy') }}
        </button>
      </div>
    </div>

    <!-- Policy List -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('name') }}</th>
              <th>{{ t('description') }}</th>
              <th>{{ t('datacenters') }}</th>
              <th class="w-24">{{ t('actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.loading">
              <td colspan="4" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
              </td>
            </tr>
            <tr v-else-if="store.aclPolicies.length === 0">
              <td colspan="4" class="text-center py-6 text-text-secondary">
                {{ t('noPolicies') }}
              </td>
            </tr>
            <tr v-for="policy in store.aclPolicies" :key="policy.ID">
              <td>
                <span class="font-medium text-text-primary">{{ policy.Name }}</span>
              </td>
              <td>
                <span class="text-text-secondary">{{ policy.Description || '-' }}</span>
              </td>
              <td>
                <div class="flex flex-wrap gap-1">
                  <span v-for="dc in policy.Datacenters || []" :key="dc" class="badge badge-info">
                    {{ dc }}
                  </span>
                  <span v-if="!policy.Datacenters?.length" class="text-text-tertiary">-</span>
                </div>
              </td>
              <td>
                <div class="flex items-center gap-1">
                  <button
                    @click="handleEdit(policy)"
                    class="btn btn-ghost btn-sm text-text-secondary"
                    :title="t('edit')"
                  >
                    <Pencil class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="handleDelete(policy)"
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
    </div>

    <!-- Create/Edit Policy Modal -->
    <FormModal
      v-model="showCreateModal"
      :title="isEditing ? t('editPolicy') : t('createPolicy')"
      :submit-text="isEditing ? t('updatePolicy') : t('create')"
      :loading="saving"
      @submit="submitCreate"
    >
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('name') }} <span class="text-danger">*</span>
          </label>
          <input
            v-model="createForm.Name"
            type="text"
            class="input"
            placeholder="my-policy"
            :disabled="isEditing"
          />
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
            {{ t('rules') }} <span class="text-danger">*</span>
          </label>
          <textarea
            v-model="createForm.Rules"
            class="input min-h-[160px] font-mono text-xs"
            :placeholder="t('rulesPlaceholder')"
          ></textarea>
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
        <p class="text-text-secondary">{{ t('confirmDeletePolicy') }}</p>
        <p class="text-xs text-text-tertiary mt-2">
          <span class="font-medium text-text-primary">{{ policyToDelete?.Name }}</span>
          - {{ t('deletePolicyWarning') }}
        </p>
      </div>
    </ConfirmModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus, RefreshCw, Trash2, Pencil, Loader2 } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useConsulStore } from '@/stores/consul'
import consulApi from '@/api/consul'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import FormModal from '@/components/common/FormModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import type { ConsulACLPolicy } from '@/types/consul'

const { t } = useI18n()
const store = useConsulStore()

// State
const saving = ref(false)
const showCreateModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const editingPolicy = ref<ConsulACLPolicy | null>(null)
const policyToDelete = ref<ConsulACLPolicy | null>(null)

const createForm = reactive({
  Name: '',
  Description: '',
  Rules: '',
})

// Actions
async function loadPolicies() {
  try {
    await store.fetchACLPolicies()
  } catch (error) {
    logger.error('Failed to fetch ACL policies:', error)
    toast.error(t('operationFailed'))
  }
}

function openCreateModal() {
  isEditing.value = false
  editingPolicy.value = null
  createForm.Name = ''
  createForm.Description = ''
  createForm.Rules = ''
  showCreateModal.value = true
}

async function handleEdit(policy: ConsulACLPolicy) {
  isEditing.value = true
  try {
    const response = await consulApi.getACLPolicy(policy.ID)
    const fullPolicy = response.data
    editingPolicy.value = fullPolicy
    createForm.Name = fullPolicy.Name
    createForm.Description = fullPolicy.Description || ''
    createForm.Rules = fullPolicy.Rules || ''
    showCreateModal.value = true
  } catch (error) {
    logger.error('Failed to fetch policy details:', error)
    toast.error(t('operationFailed'))
  }
}

async function submitCreate() {
  if (!createForm.Name || !createForm.Rules) {
    toast.warning(t('requiredFieldsMissing'))
    return
  }

  saving.value = true
  try {
    if (isEditing.value && editingPolicy.value) {
      await consulApi.updateACLPolicy(editingPolicy.value.ID, {
        Name: createForm.Name,
        Description: createForm.Description,
        Rules: createForm.Rules,
      })
    } else {
      await consulApi.createACLPolicy({
        Name: createForm.Name,
        Description: createForm.Description,
        Rules: createForm.Rules,
      })
    }
    showCreateModal.value = false
    toast.success(t('success'))
    await loadPolicies()
  } catch (error) {
    logger.error('Failed to save ACL policy:', error)
    toast.error(t('operationFailed'))
  } finally {
    saving.value = false
  }
}

function handleDelete(policy: ConsulACLPolicy) {
  policyToDelete.value = policy
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!policyToDelete.value) return
  try {
    await consulApi.deleteACLPolicy(policyToDelete.value.ID)
    showDeleteModal.value = false
    toast.success(t('success'))
    await loadPolicies()
  } catch (error) {
    logger.error('Failed to delete ACL policy:', error)
    toast.error(t('operationFailed'))
  }
}

// Lifecycle
onMounted(() => {
  loadPolicies()
})
</script>
