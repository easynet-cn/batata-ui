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
      <AppPagination
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        @change="handlePageChange"
      />
    </div>

    <!-- Create Permission Modal -->
    <FormModal
      v-model="showCreateModal"
      :title="t('addPermission')"
      :submit-text="t('create')"
      :loading="saving"
      @submit="submitCreate"
    >
      <div class="space-y-3">
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
    </FormModal>

    <!-- Delete Confirm Modal -->
    <ConfirmModal
      v-model="showDeleteModal"
      :title="t('confirmDelete')"
      :message="t('confirmDeletePermission')"
      :confirm-text="t('delete')"
      danger
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus, Search, Trash2, Loader2 } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import FormModal from '@/components/common/FormModal.vue'
import AppPagination from '@/components/common/AppPagination.vue'
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
    logger.error('Failed to fetch permissions:', error)
    toast.error(t('operationFailed'))
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
    logger.error('Failed to create permission:', error)
    toast.error(t('operationFailed'))
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
    logger.error('Failed to delete permission:', error)
    toast.error(t('operationFailed'))
  }
}

// Lifecycle
onMounted(() => {
  fetchPermissions()
})
</script>
