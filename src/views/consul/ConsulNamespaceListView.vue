<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('consulNamespaces') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('consulNamespacesDesc') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="loadNamespaces" class="btn btn-secondary btn-sm" :disabled="loading">
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
          {{ t('refresh') }}
        </button>
        <button @click="openCreateModal" class="btn btn-primary btn-sm">
          <Plus class="w-3.5 h-3.5" />
          {{ t('createConsulNamespace') }}
        </button>
      </div>
    </div>

    <!-- Namespace List -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('name') }}</th>
              <th>{{ t('description') }}</th>
              <th>{{ t('policyDefaults') }}</th>
              <th>{{ t('roleDefaults') }}</th>
              <th>{{ t('createIndex') }}</th>
              <th class="w-24">{{ t('actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="6" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-fuchsia-600" />
              </td>
            </tr>
            <tr v-else-if="namespaces.length === 0">
              <td colspan="6" class="text-center py-6 text-text-secondary">
                {{ t('noData') }}
              </td>
            </tr>
            <tr v-for="ns in namespaces" :key="ns.Name" class="hover:bg-bg-secondary">
              <td>
                <span class="font-medium text-text-primary">{{ ns.Name }}</span>
              </td>
              <td class="text-text-secondary">{{ ns.Description || '-' }}</td>
              <td>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="p in ns.ACLs?.PolicyDefaults || []"
                    :key="p.ID || p.Name"
                    class="badge bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/30 dark:text-fuchsia-400"
                  >
                    {{ p.Name || p.ID }}
                  </span>
                  <span v-if="!ns.ACLs?.PolicyDefaults?.length" class="text-xs text-text-tertiary"
                    >-</span
                  >
                </div>
              </td>
              <td>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="r in ns.ACLs?.RoleDefaults || []"
                    :key="r.ID || r.Name"
                    class="badge bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/30 dark:text-fuchsia-400"
                  >
                    {{ r.Name || r.ID }}
                  </span>
                  <span v-if="!ns.ACLs?.RoleDefaults?.length" class="text-xs text-text-tertiary"
                    >-</span
                  >
                </div>
              </td>
              <td class="text-text-secondary text-xs">{{ ns.CreateIndex }}</td>
              <td>
                <button
                  @click="handleDelete(ns)"
                  class="btn btn-ghost btn-sm text-danger"
                  :title="t('delete')"
                  :disabled="ns.Name === 'default'"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Namespace Modal -->
    <FormModal
      v-model="showCreateModal"
      :title="t('createConsulNamespace')"
      :submit-text="t('create')"
      :loading="creating"
      @submit="submitCreate"
    >
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('namespaceName') }}
            <span class="text-red-500">*</span>
          </label>
          <input v-model="createForm.Name" type="text" class="input" placeholder="my-namespace" />
        </div>
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('description') }}
          </label>
          <input
            v-model="createForm.Description"
            type="text"
            class="input"
            :placeholder="t('description')"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('defaultPolicyName') }}
          </label>
          <input
            v-model="createForm.PolicyName"
            type="text"
            class="input"
            :placeholder="t('defaultPolicyNameHint')"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('defaultRoleName') }}
          </label>
          <input
            v-model="createForm.RoleName"
            type="text"
            class="input"
            :placeholder="t('defaultRoleNameHint')"
          />
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
        <p class="text-text-secondary">{{ t('confirmDeleteConsulNamespace') }}</p>
        <p class="text-xs text-text-tertiary mt-2">
          <span class="font-mono text-text-primary">{{ nsToDelete?.Name }}</span>
        </p>
      </div>
    </ConfirmModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { RefreshCw, Trash2, Loader2, Plus } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import consulApi from '@/api/consul'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import FormModal from '@/components/common/FormModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import type { ConsulNamespace } from '@/types/consul'

const { t } = useI18n()

// State
const loading = ref(false)
const namespaces = ref<ConsulNamespace[]>([])
const showCreateModal = ref(false)
const creating = ref(false)
const showDeleteModal = ref(false)
const nsToDelete = ref<ConsulNamespace | null>(null)

const createForm = reactive({
  Name: '',
  Description: '',
  PolicyName: '',
  RoleName: '',
})

// Actions
async function loadNamespaces() {
  loading.value = true
  try {
    const response = await consulApi.listNamespaces()
    namespaces.value = response.data || []
  } catch (error) {
    logger.error('Failed to fetch namespaces:', error)
    toast.apiError(error)
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  Object.assign(createForm, { Name: '', Description: '', PolicyName: '', RoleName: '' })
  showCreateModal.value = true
}

async function submitCreate() {
  if (!createForm.Name.trim()) {
    toast.warning(t('requiredFieldsMissing'))
    return
  }
  creating.value = true
  try {
    const data: {
      Name: string
      Description?: string
      ACLs?: {
        PolicyDefaults?: Array<{ Name: string }>
        RoleDefaults?: Array<{ Name: string }>
      }
    } = {
      Name: createForm.Name.trim(),
      Description: createForm.Description.trim() || undefined,
    }
    // Build ACL defaults if provided
    const policyName = createForm.PolicyName.trim()
    const roleName = createForm.RoleName.trim()
    if (policyName || roleName) {
      data.ACLs = {}
      if (policyName) {
        data.ACLs.PolicyDefaults = [{ Name: policyName }]
      }
      if (roleName) {
        data.ACLs.RoleDefaults = [{ Name: roleName }]
      }
    }
    await consulApi.createNamespace(data)
    showCreateModal.value = false
    toast.success(t('success'))
    await loadNamespaces()
  } catch (error) {
    logger.error('Failed to create namespace:', error)
    toast.apiError(error)
  } finally {
    creating.value = false
  }
}

function handleDelete(ns: ConsulNamespace) {
  nsToDelete.value = ns
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!nsToDelete.value) return
  try {
    await consulApi.deleteNamespace(nsToDelete.value.Name)
    showDeleteModal.value = false
    toast.success(t('success'))
    await loadNamespaces()
  } catch (error) {
    logger.error('Failed to delete namespace:', error)
    toast.apiError(error)
  }
}

// Lifecycle
onMounted(() => {
  loadNamespaces()
})
</script>
