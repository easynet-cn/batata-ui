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

    <!-- Search & Sort Bar -->
    <div class="card">
      <div class="p-3">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div class="md:col-span-2">
            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                v-model="searchQuery"
                type="text"
                class="input pl-10"
                :placeholder="t('searchRoles')"
              />
            </div>
          </div>
          <div>
            <select v-model="sortBy" class="input">
              <option value="name-asc">{{ t('sortBy') }}: {{ t('name') }} ↑</option>
              <option value="name-desc">{{ t('sortBy') }}: {{ t('name') }} ↓</option>
              <option value="newest">{{ t('sortBy') }}: {{ t('createTime') }} ↓</option>
            </select>
          </div>
        </div>
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
            <tr v-else-if="sortedRoles.length === 0">
              <td colspan="4" class="text-center py-6 text-text-secondary">
                {{ t('noRoles') }}
              </td>
            </tr>
            <tr v-for="role in sortedRoles" :key="role.ID" class="hover:bg-bg-secondary">
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
                <div class="flex items-center gap-1">
                  <button
                    @click="handleEdit(role)"
                    class="btn btn-ghost btn-sm text-text-secondary"
                    :title="t('edit')"
                  >
                    <Pencil class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="handleDelete(role)"
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
          {{ t('total') }}: {{ sortedRoles.length }} {{ t('items') }}
        </div>
      </div>
    </div>

    <!-- Create/Edit Role Modal -->
    <FormModal
      v-model="showCreateModal"
      :title="isEditing ? t('editRole') : t('createRole')"
      :submit-text="isEditing ? t('updateRole') : t('create')"
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
            placeholder="my-role"
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
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, RefreshCw, Trash2, Pencil, Loader2, Search } from 'lucide-vue-next'
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
const isEditing = ref(false)
const editingRole = ref<ConsulACLRole | null>(null)
const roleToDelete = ref<ConsulACLRole | null>(null)
const selectedPolicyIds = ref<string[]>([])
const availablePolicies = ref<{ ID: string; Name: string; Description: string }[]>([])
const serviceIdentities = ref<Array<{ ServiceName: string }>>([])
const nodeIdentities = ref<Array<{ NodeName: string; Datacenter: string }>>([])
const searchQuery = ref('')
const sortBy = ref('name-asc')

const createForm = reactive({
  Name: '',
  Description: '',
})

// Filtered & sorted
const filteredRoles = computed(() => {
  let roles = store.aclRoles
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    roles = roles.filter(
      (r) =>
        r.Name.toLowerCase().includes(q) ||
        (r.Description || '').toLowerCase().includes(q) ||
        (r.Policies || []).some((p) => p.Name.toLowerCase().includes(q)),
    )
  }
  return roles
})

const sortedRoles = computed(() => {
  const roles = [...filteredRoles.value]
  switch (sortBy.value) {
    case 'name-asc':
      roles.sort((a, b) => a.Name.localeCompare(b.Name))
      break
    case 'name-desc':
      roles.sort((a, b) => b.Name.localeCompare(a.Name))
      break
    case 'newest':
      roles.sort((a, b) => (b.CreateIndex || 0) - (a.CreateIndex || 0))
      break
  }
  return roles
})

// Actions
async function loadRoles() {
  try {
    await store.fetchACLRoles()
  } catch (error) {
    logger.error('Failed to fetch ACL roles:', error)
    toast.apiError(error)
  }
}

async function openCreateModal() {
  isEditing.value = false
  editingRole.value = null
  createForm.Name = ''
  createForm.Description = ''
  selectedPolicyIds.value = []
  serviceIdentities.value = []
  nodeIdentities.value = []
  showCreateModal.value = true
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

async function handleEdit(role: ConsulACLRole) {
  isEditing.value = true
  try {
    const response = await consulApi.getACLRole(role.ID)
    const fullRole = response.data
    editingRole.value = fullRole
    createForm.Name = fullRole.Name
    createForm.Description = fullRole.Description || ''
    selectedPolicyIds.value = (fullRole.Policies || []).map((p) => p.ID)
    serviceIdentities.value = (fullRole.ServiceIdentities || []).map((si) => ({
      ServiceName: si.ServiceName,
    }))
    nodeIdentities.value = (fullRole.NodeIdentities || []).map((ni) => ({
      NodeName: ni.NodeName,
      Datacenter: ni.Datacenter,
    }))
    await store.fetchACLPolicies()
    availablePolicies.value = store.aclPolicies.map((p) => ({
      ID: p.ID,
      Name: p.Name,
      Description: p.Description,
    }))
    showCreateModal.value = true
  } catch (error) {
    logger.error('Failed to fetch role details:', error)
    toast.apiError(error)
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

    const si = serviceIdentities.value
      .filter((s) => s.ServiceName.trim())
      .map((s) => ({ ServiceName: s.ServiceName.trim() }))
    const ni = nodeIdentities.value
      .filter((n) => n.NodeName.trim())
      .map((n) => ({ NodeName: n.NodeName.trim(), Datacenter: n.Datacenter.trim() }))

    const payload = {
      Name: createForm.Name,
      Description: createForm.Description,
      Policies: policies,
      ServiceIdentities: si.length > 0 ? si : undefined,
      NodeIdentities: ni.length > 0 ? ni : undefined,
    }

    if (isEditing.value && editingRole.value) {
      await consulApi.updateACLRole(editingRole.value.ID, payload)
    } else {
      await consulApi.createACLRole(payload)
    }
    showCreateModal.value = false
    toast.success(t('success'))
    await loadRoles()
  } catch (error) {
    logger.error('Failed to save ACL role:', error)
    toast.apiError(error)
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
    toast.apiError(error)
  }
}

// Lifecycle
onMounted(() => {
  loadRoles()
})
</script>
