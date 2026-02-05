<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('permissions') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('permissionsDesc') }}</p>
      </div>
      <button @click="showCreateModal = true" class="btn btn-primary btn-sm">
        <Plus class="w-3.5 h-3.5" />
        {{ t('addPermission') }}
      </button>
    </div>

    <!-- Search Bar -->
    <div class="card">
      <div class="p-3">
        <div class="flex items-center gap-3">
          <div class="flex-1">
            <input
              v-model="searchRole"
              type="text"
              class="input"
              :placeholder="t('searchByRole')"
              @keyup.enter="handleSearch"
            />
          </div>
          <button @click="handleSearch" class="btn btn-primary">
            <Search class="w-3.5 h-3.5" />
            {{ t('search') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Permission List -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('roleName') }}</th>
              <th>{{ t('resource') }}</th>
              <th>{{ t('action') }}</th>
              <th class="w-32">{{ t('actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="4" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
              </td>
            </tr>
            <tr v-else-if="permissions.length === 0">
              <td colspan="4" class="text-center py-6 text-text-secondary">
                {{ t('noData') }}
              </td>
            </tr>
            <tr v-for="(perm, index) in permissions" :key="index" class="hover:bg-bg-secondary">
              <td class="font-medium">{{ perm.role }}</td>
              <td class="font-mono text-sm">{{ perm.resource }}</td>
              <td>
                <span :class="getActionClass(perm.action)">
                  {{ getActionLabel(perm.action) }}
                </span>
              </td>
              <td>
                <button
                  @click="handleDelete(perm)"
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

      <!-- Pagination -->
      <div class="flex items-center justify-between p-4 border-t border-border">
        <div class="text-sm text-text-secondary">
          {{ t('total') }}: {{ total }} {{ t('items') }}
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="handlePageChange(currentPage - 1)"
            :disabled="currentPage <= 1"
            class="btn btn-secondary btn-sm"
          >
            <ChevronLeft class="w-3.5 h-3.5" />
          </button>
          <span class="text-sm text-text-primary px-3"> {{ currentPage }} / {{ totalPages }} </span>
          <button
            @click="handlePageChange(currentPage + 1)"
            :disabled="currentPage >= totalPages"
            class="btn btn-secondary btn-sm"
          >
            <ChevronRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Create Permission Modal -->
    <div v-if="showCreateModal" class="modal-backdrop" @click="showCreateModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3 class="text-sm font-semibold text-text-primary">{{ t('addPermission') }}</h3>
          <button @click="showCreateModal = false" class="btn btn-ghost btn-sm">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
        <div class="modal-body space-y-3">
          <div>
            <label class="block text-xs font-medium text-text-primary mb-1">
              {{ t('roleName') }} <span class="text-danger">*</span>
            </label>
            <input v-model="createForm.role" type="text" class="input" />
          </div>
          <div>
            <label class="block text-xs font-medium text-text-primary mb-1">
              {{ t('resource') }} <span class="text-danger">*</span>
            </label>
            <input v-model="createForm.resource" type="text" class="input" placeholder="*:*:*" />
            <p class="text-xs text-text-tertiary mt-1">{{ t('resourceHint') }}</p>
          </div>
          <div>
            <label class="block text-xs font-medium text-text-primary mb-1">
              {{ t('action') }} <span class="text-danger">*</span>
            </label>
            <select v-model="createForm.action" class="input">
              <option value="r">{{ t('readOnly') }}</option>
              <option value="w">{{ t('writeOnly') }}</option>
              <option value="rw">{{ t('readWrite') }}</option>
            </select>
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
          <p class="text-text-secondary">{{ t('confirmDeletePermission') }}</p>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, Search, Trash2, Loader2, X, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import { toast } from '@/utils/error'
import type { PermissionInfo, Namespace } from '@/types'

defineProps<{
  namespace: Namespace
}>()

const { t } = useI18n()

// State
const loading = ref(false)
const saving = ref(false)
const permissions = ref<PermissionInfo[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchRole = ref('')

// Modals
const showCreateModal = ref(false)
const showDeleteModal = ref(false)
const permToDelete = ref<PermissionInfo | null>(null)

const createForm = reactive({
  role: '',
  resource: '',
  action: 'r',
})

// Computed
const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1)

// Methods
const fetchPermissions = async () => {
  loading.value = true
  try {
    const response = await batataApi.getPermissionList({
      pageNo: currentPage.value,
      pageSize: pageSize.value,
      role: searchRole.value || undefined,
    })
    permissions.value = response.data.data.pageItems || []
    total.value = response.data.data.totalCount || 0
  } catch (error) {
    console.error('Failed to fetch permissions:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchPermissions()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchPermissions()
}

const getActionClass = (action: string) => {
  const classes: Record<string, string> = {
    r: 'badge badge-info',
    w: 'badge badge-warning',
    rw: 'badge badge-success',
  }
  return classes[action] || 'badge'
}

const getActionLabel = (action: string) => {
  const labels: Record<string, string> = {
    r: t('readOnly'),
    w: t('writeOnly'),
    rw: t('readWrite'),
  }
  return labels[action] || action
}

const submitCreate = async () => {
  if (!createForm.role || !createForm.resource || !createForm.action) {
    toast.warning(t('requiredFieldsMissing'))
    return
  }

  saving.value = true
  try {
    await batataApi.createPermission(createForm)
    showCreateModal.value = false
    Object.assign(createForm, { role: '', resource: '', action: 'r' })
    fetchPermissions()
  } catch (error) {
    console.error('Failed to create permission:', error)
  } finally {
    saving.value = false
  }
}

const handleDelete = (perm: PermissionInfo) => {
  permToDelete.value = perm
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!permToDelete.value) return
  try {
    await batataApi.deletePermission(
      permToDelete.value.role,
      permToDelete.value.resource,
      permToDelete.value.action,
    )
    showDeleteModal.value = false
    fetchPermissions()
  } catch (error) {
    console.error('Failed to delete permission:', error)
  }
}

// Lifecycle
onMounted(() => {
  fetchPermissions()
})
</script>
