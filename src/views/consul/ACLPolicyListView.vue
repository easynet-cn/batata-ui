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
                <button
                  @click="handleDelete(policy)"
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

    <!-- Create Policy Modal -->
    <div v-if="showCreateModal" class="modal-backdrop" @click="showCreateModal = false">
      <div class="modal max-w-lg" @click.stop>
        <div class="modal-header">
          <h3 class="text-sm font-semibold text-text-primary">{{ t('createPolicy') }}</h3>
          <button @click="showCreateModal = false" class="btn btn-ghost btn-sm">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
        <div class="modal-body space-y-3">
          <div>
            <label class="block text-xs font-medium text-text-primary mb-1">
              {{ t('name') }} <span class="text-danger">*</span>
            </label>
            <input v-model="createForm.Name" type="text" class="input" placeholder="my-policy" />
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
        <div class="modal-footer">
          <button @click="showCreateModal = false" class="btn btn-secondary">
            {{ t('cancel') }}
          </button>
          <button @click="submitCreate" class="btn btn-primary" :disabled="saving">
            <Loader2 v-if="saving" class="w-3.5 h-3.5 animate-spin" />
            {{ t('create') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirm Modal -->
    <div v-if="showDeleteModal" class="modal-backdrop" @click="showDeleteModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3 class="text-sm font-semibold text-text-primary">{{ t('confirmDelete') }}</h3>
          <button @click="showDeleteModal = false" class="btn btn-ghost btn-sm">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
        <div class="modal-body">
          <p class="text-text-secondary">{{ t('confirmDeletePolicy') }}</p>
          <p class="text-xs text-text-tertiary mt-2">
            <span class="font-medium text-text-primary">{{ policyToDelete?.Name }}</span>
            - {{ t('deletePolicyWarning') }}
          </p>
        </div>
        <div class="modal-footer">
          <button @click="showDeleteModal = false" class="btn btn-secondary">
            {{ t('cancel') }}
          </button>
          <button @click="confirmDelete" class="btn btn-danger">
            {{ t('delete') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus, RefreshCw, Trash2, Loader2, X } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useConsulStore } from '@/stores/consul'
import consulApi from '@/api/consul'
import { toast } from '@/utils/error'
import type { ConsulACLPolicy } from '@/types/consul'

const { t } = useI18n()
const store = useConsulStore()

// State
const saving = ref(false)
const showCreateModal = ref(false)
const showDeleteModal = ref(false)
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
    console.error('Failed to fetch ACL policies:', error)
  }
}

function openCreateModal() {
  createForm.Name = ''
  createForm.Description = ''
  createForm.Rules = ''
  showCreateModal.value = true
}

async function submitCreate() {
  if (!createForm.Name || !createForm.Rules) {
    toast.warning(t('requiredFieldsMissing'))
    return
  }

  saving.value = true
  try {
    await consulApi.createACLPolicy({
      Name: createForm.Name,
      Description: createForm.Description,
      Rules: createForm.Rules,
    })
    showCreateModal.value = false
    toast.success(t('success'))
    await loadPolicies()
  } catch (error) {
    console.error('Failed to create ACL policy:', error)
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
    console.error('Failed to delete ACL policy:', error)
    toast.error(t('operationFailed'))
  }
}

// Lifecycle
onMounted(() => {
  loadPolicies()
})
</script>
