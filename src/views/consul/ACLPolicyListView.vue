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

    <!-- Search & Filter Bar -->
    <div class="card">
      <div class="p-3">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                v-model="searchQuery"
                type="text"
                class="input pl-10"
                :placeholder="t('searchPolicies')"
              />
            </div>
          </div>
          <div>
            <select v-model="kindFilter" class="input">
              <option value="">{{ t('consulFilterAll') }}</option>
              <option value="management">{{ t('globalManagement') }}</option>
              <option value="standard">{{ t('consulServiceKindService') }}</option>
            </select>
          </div>
          <div>
            <select v-model="sortBy" class="input">
              <option value="name-asc">{{ t('sortBy') }}: {{ t('name') }} ↑</option>
              <option value="name-desc">{{ t('sortBy') }}: {{ t('name') }} ↓</option>
            </select>
          </div>
        </div>
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
            <tr v-else-if="sortedPolicies.length === 0">
              <td colspan="4" class="text-center py-6 text-text-secondary">
                {{ t('noPolicies') }}
              </td>
            </tr>
            <tr v-for="policy in sortedPolicies" :key="policy.ID" class="hover:bg-bg-secondary">
              <td>
                <div class="flex items-center gap-2">
                  <span class="font-medium text-text-primary">{{ policy.Name }}</span>
                  <span
                    v-if="isBuiltIn(policy)"
                    class="badge bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 text-[10px]"
                  >
                    {{ t('builtInPolicy') }}
                  </span>
                </div>
              </td>
              <td>
                <span class="text-text-secondary">{{ policy.Description || '-' }}</span>
              </td>
              <td>
                <div class="flex flex-wrap gap-1">
                  <span v-if="!policy.Datacenters?.length" class="text-xs text-text-tertiary">
                    {{ t('allDatacenters') }}
                  </span>
                  <span v-for="dc in policy.Datacenters || []" :key="dc" class="badge badge-info">
                    {{ dc }}
                  </span>
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
                    v-if="!isBuiltIn(policy)"
                    @click="handleDelete(policy)"
                    class="btn btn-ghost btn-sm text-danger"
                    :title="t('delete')"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                  <button
                    v-else
                    class="btn btn-ghost btn-sm text-text-tertiary cursor-not-allowed"
                    :title="t('cannotDeleteBuiltIn')"
                    disabled
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
          {{ t('total') }}: {{ sortedPolicies.length }} {{ t('items') }}
        </div>
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
        <!-- Policy Template Selector -->
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('policyTemplate') }}
          </label>
          <div class="flex items-center gap-2">
            <button
              v-for="tmpl in policyTemplates"
              :key="tmpl.value"
              @click="selectTemplate(tmpl.value)"
              :class="[
                'btn btn-sm',
                createForm.template === tmpl.value ? 'btn-primary' : 'btn-secondary',
              ]"
            >
              {{ tmpl.label }}
            </button>
          </div>
        </div>
        <!-- Template fields -->
        <div v-if="createForm.template !== 'custom'" class="space-y-2">
          <div>
            <label class="block text-xs font-medium text-text-primary mb-1">
              {{ createForm.template === 'service-identity' ? t('serviceName') : t('nodeName') }}
              <span class="text-danger">*</span>
            </label>
            <input
              v-model="createForm.templateName"
              type="text"
              class="input"
              :placeholder="createForm.template === 'service-identity' ? 'my-service' : 'my-node'"
              @input="generateTemplateRules"
            />
          </div>
        </div>
        <!-- Datacenters -->
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('datacenters') }}
          </label>
          <div class="space-y-2">
            <label class="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
              <input type="radio" v-model="dcScope" value="all" />
              {{ t('allDatacenters') }}
            </label>
            <label class="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
              <input type="radio" v-model="dcScope" value="scoped" />
              {{ t('scopedDatacenters') }}
            </label>
            <div v-if="dcScope === 'scoped'" class="ml-6">
              <div
                v-if="store.datacenters.length > 0"
                class="space-y-1.5 max-h-32 overflow-y-auto border border-border rounded-xl p-3"
              >
                <label
                  v-for="dc in store.datacenters"
                  :key="dc"
                  class="flex items-center gap-2 text-sm text-text-primary cursor-pointer"
                >
                  <input
                    type="checkbox"
                    :value="dc"
                    v-model="selectedDatacenters"
                    class="rounded"
                  />
                  {{ dc }}
                </label>
              </div>
              <input
                v-else
                v-model="manualDatacenters"
                type="text"
                class="input"
                placeholder="dc1, dc2"
              />
            </div>
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('rules') }} <span class="text-danger">*</span>
          </label>
          <CodeEditor
            v-model="createForm.Rules"
            language="hcl"
            :readonly="createForm.template !== 'custom'"
            min-height="200px"
            :placeholder="t('rulesPlaceholder')"
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
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, RefreshCw, Trash2, Pencil, Loader2, Search } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useConsulStore } from '@/stores/consul'
import consulApi from '@/api/consul'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import FormModal from '@/components/common/FormModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import CodeEditor from '@/components/common/CodeEditor.vue'
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
const searchQuery = ref('')
const kindFilter = ref('')
const sortBy = ref('name-asc')
const dcScope = ref<'all' | 'scoped'>('all')
const selectedDatacenters = ref<string[]>([])
const manualDatacenters = ref('')

type PolicyTemplate = 'custom' | 'service-identity' | 'node-identity'

const createForm = reactive({
  Name: '',
  Description: '',
  Rules: '',
  template: 'custom' as PolicyTemplate,
  templateName: '',
})

const policyTemplates = [
  { value: 'custom' as PolicyTemplate, label: t('policyTemplateCustom') },
  { value: 'service-identity' as PolicyTemplate, label: t('policyTemplateServiceIdentity') },
  { value: 'node-identity' as PolicyTemplate, label: t('policyTemplateNodeIdentity') },
]

const BUILTIN_NAMES = ['global-management', 'builtin/global-read-only']

function isBuiltIn(policy: ConsulACLPolicy): boolean {
  return BUILTIN_NAMES.includes(policy.Name)
}

// Filtered & sorted policies
const filteredPolicies = computed(() => {
  let policies = store.aclPolicies

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    policies = policies.filter(
      (p) => p.Name.toLowerCase().includes(q) || (p.Description || '').toLowerCase().includes(q),
    )
  }

  if (kindFilter.value) {
    switch (kindFilter.value) {
      case 'management':
        policies = policies.filter((p) => p.Name === 'global-management')
        break
      case 'standard':
        policies = policies.filter((p) => !isBuiltIn(p))
        break
    }
  }

  return policies
})

const sortedPolicies = computed(() => {
  const policies = [...filteredPolicies.value]
  switch (sortBy.value) {
    case 'name-asc':
      policies.sort((a, b) => a.Name.localeCompare(b.Name))
      break
    case 'name-desc':
      policies.sort((a, b) => b.Name.localeCompare(a.Name))
      break
  }
  return policies
})

function selectTemplate(tmpl: PolicyTemplate) {
  createForm.template = tmpl
  if (tmpl === 'custom') {
    createForm.templateName = ''
  } else {
    generateTemplateRules()
  }
}

function generateTemplateRules() {
  const name = createForm.templateName || '<name>'
  if (createForm.template === 'service-identity') {
    createForm.Rules = `service "${name}" {\n  policy = "write"\n}\nservice "${name}-sidecar-proxy" {\n  policy = "write"\n}\nservice_prefix "" {\n  policy = "read"\n}\nnode_prefix "" {\n  policy = "read"\n}`
    if (!createForm.Name) createForm.Name = `${name}-service-identity`
  } else if (createForm.template === 'node-identity') {
    createForm.Rules = `node "${name}" {\n  policy = "write"\n}\nservice_prefix "" {\n  policy = "read"\n}`
    if (!createForm.Name) createForm.Name = `${name}-node-identity`
  }
}

// Actions
async function loadPolicies() {
  try {
    await store.fetchACLPolicies()
  } catch (error) {
    logger.error('Failed to fetch ACL policies:', error)
    toast.apiError(error)
  }
}

function openCreateModal() {
  isEditing.value = false
  editingPolicy.value = null
  createForm.Name = ''
  createForm.Description = ''
  createForm.Rules = ''
  createForm.template = 'custom'
  createForm.templateName = ''
  dcScope.value = 'all'
  selectedDatacenters.value = []
  manualDatacenters.value = ''
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
    createForm.template = 'custom'
    createForm.templateName = ''
    if (fullPolicy.Datacenters && fullPolicy.Datacenters.length > 0) {
      dcScope.value = 'scoped'
      selectedDatacenters.value = [...fullPolicy.Datacenters]
    } else {
      dcScope.value = 'all'
      selectedDatacenters.value = []
    }
    showCreateModal.value = true
  } catch (error) {
    logger.error('Failed to fetch policy details:', error)
    toast.apiError(error)
  }
}

async function submitCreate() {
  if (!createForm.Name || !createForm.Rules) {
    toast.warning(t('requiredFieldsMissing'))
    return
  }

  saving.value = true
  try {
    let datacenters: string[] | undefined
    if (dcScope.value === 'scoped') {
      if (selectedDatacenters.value.length > 0) {
        datacenters = selectedDatacenters.value
      } else if (manualDatacenters.value.trim()) {
        datacenters = manualDatacenters.value
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      }
    }

    if (isEditing.value && editingPolicy.value) {
      await consulApi.updateACLPolicy(editingPolicy.value.ID, {
        Name: createForm.Name,
        Description: createForm.Description,
        Rules: createForm.Rules,
        Datacenters: datacenters,
      })
    } else {
      await consulApi.createACLPolicy({
        Name: createForm.Name,
        Description: createForm.Description,
        Rules: createForm.Rules,
        Datacenters: datacenters,
      })
    }
    showCreateModal.value = false
    toast.success(t('success'))
    await loadPolicies()
  } catch (error) {
    logger.error('Failed to save ACL policy:', error)
    toast.apiError(error)
  } finally {
    saving.value = false
  }
}

function handleDelete(policy: ConsulACLPolicy) {
  if (isBuiltIn(policy)) return
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
    toast.apiError(error)
  }
}

// Lifecycle
onMounted(() => {
  loadPolicies()
})
</script>
