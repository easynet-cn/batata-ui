<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('roles') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('rolesDesc') }}</p>
      </div>
      <button @click="showCreateModal = true" class="btn btn-primary btn-sm">
        <Plus class="w-3.5 h-3.5" />
        {{ t('bindRole') }}
      </button>
    </div>

    <!-- Search Bar -->
    <div class="card">
      <div class="p-3">
        <div class="flex items-center gap-3">
          <div class="flex-1">
            <input
              v-model="searchRoleName"
              type="text"
              class="input"
              :placeholder="t('searchRoleName')"
              @keyup.enter="handleSearch"
            />
          </div>
          <div class="flex-1">
            <input
              v-model="searchUsername"
              type="text"
              class="input"
              :placeholder="t('searchUsername')"
              @keyup.enter="handleSearch"
            />
          </div>
          <label
            class="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer select-none whitespace-nowrap"
          >
            <input type="checkbox" v-model="fuzzySearch" class="accent-primary w-3.5 h-3.5" />
            {{ t('fuzzySearch') }}
          </label>
          <button @click="handleSearch" class="btn btn-primary">
            <Search class="w-3.5 h-3.5" />
            {{ t('search') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Role List -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('roleName') }}</th>
              <th>{{ t('username') }}</th>
              <th class="w-32">{{ t('actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="3" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
              </td>
            </tr>
            <tr v-else-if="roles.length === 0">
              <td colspan="3" class="text-center py-6 text-text-secondary">
                {{ t('noData') }}
              </td>
            </tr>
            <tr v-for="(role, index) in roles" :key="index" class="hover:bg-bg-secondary">
              <td class="font-medium">{{ role.role }}</td>
              <td>{{ role.username }}</td>
              <td>
                <button
                  v-if="role.role !== 'ROLE_ADMIN'"
                  @click="handleDelete(role)"
                  class="btn btn-ghost btn-sm text-danger"
                  :title="t('delete')"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
                <span v-else class="text-xs text-text-tertiary" :title="t('cannotDeleteAdmin')"
                  >—</span
                >
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

    <!-- Create Role Modal -->
    <FormModal
      v-model="showCreateModal"
      :title="t('bindRole')"
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
            {{ t('username') }} <span class="text-danger">*</span>
          </label>
          <input v-model="createForm.username" type="text" class="input" />
        </div>
      </div>
    </FormModal>

    <!-- Delete Confirm Modal -->
    <ConfirmModal
      v-model="showDeleteModal"
      :title="t('confirmDelete')"
      :message="`${t('confirmDeleteRoleBinding')} ${roleToDelete?.role} ${t('and')} ${roleToDelete?.username}?`"
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
import type { RoleInfo, Namespace } from '@/types'

defineProps<{
  namespace: Namespace
}>()

const { t } = useI18n()

// State
const loading = ref(false)
const saving = ref(false)
const roles = ref<RoleInfo[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchRoleName = ref('')
const searchUsername = ref('')
const fuzzySearch = ref(false)

// Modals
const showCreateModal = ref(false)
const showDeleteModal = ref(false)
const roleToDelete = ref<RoleInfo | null>(null)

const createForm = reactive({
  role: '',
  username: '',
})

// Methods
const fetchRoles = async () => {
  loading.value = true
  try {
    const response = await batataApi.getRoleList({
      pageNo: currentPage.value,
      pageSize: pageSize.value,
      role: searchRoleName.value || undefined,
      username: searchUsername.value || undefined,
      search: fuzzySearch.value ? 'blur' : 'accurate',
    })
    roles.value = response.data.data.pageItems || []
    total.value = response.data.data.totalCount || 0
  } catch (error) {
    logger.error('Failed to fetch roles:', error)
    toast.error(t('operationFailed'))
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchRoles()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchRoles()
}

const submitCreate = async () => {
  if (!createForm.role || !createForm.username) {
    toast.warning(t('requiredFieldsMissing'))
    return
  }

  saving.value = true
  try {
    await batataApi.createRole(createForm)
    showCreateModal.value = false
    Object.assign(createForm, { role: '', username: '' })
    fetchRoles()
  } catch (error) {
    logger.error('Failed to create role:', error)
    toast.error(t('operationFailed'))
  } finally {
    saving.value = false
  }
}

const handleDelete = (role: RoleInfo) => {
  roleToDelete.value = role
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!roleToDelete.value) return
  try {
    await batataApi.deleteRole(roleToDelete.value.role, roleToDelete.value.username)
    showDeleteModal.value = false
    fetchRoles()
  } catch (error) {
    logger.error('Failed to delete role:', error)
    toast.error(t('operationFailed'))
  }
}

// Lifecycle
onMounted(() => {
  fetchRoles()
})
</script>
