<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('users') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('usersDesc') }}</p>
      </div>
      <button @click="showCreateModal = true" class="btn btn-primary btn-sm">
        <Plus class="w-3.5 h-3.5" />
        {{ t('createUser') }}
      </button>
    </div>

    <!-- Search Bar -->
    <div class="card">
      <div class="p-3">
        <div class="flex items-center gap-3">
          <div class="flex-1">
            <input
              v-model="searchKeyword"
              type="text"
              class="input"
              :placeholder="t('searchUser')"
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

    <!-- User List -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('username') }}</th>
              <th>{{ t('password') }}</th>
              <th>{{ t('status') }}</th>
              <th class="w-48">{{ t('actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="4" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
              </td>
            </tr>
            <tr v-else-if="users.length === 0">
              <td colspan="4" class="text-center py-6 text-text-secondary">
                {{ t('noData') }}
              </td>
            </tr>
            <tr v-for="user in users" :key="user.username" class="hover:bg-bg-secondary">
              <td class="font-medium">{{ user.username }}</td>
              <td class="text-text-secondary">******</td>
              <td>
                <span
                  :class="user.enabled !== false ? 'badge badge-success' : 'badge badge-danger'"
                >
                  {{ user.enabled !== false ? t('enabled') : t('disabled') }}
                </span>
              </td>
              <td>
                <div class="flex items-center gap-1">
                  <button
                    @click="handleResetPassword(user)"
                    class="btn btn-ghost btn-sm"
                    :title="t('resetPassword')"
                  >
                    <Key class="w-3.5 h-3.5" />
                  </button>
                  <button
                    v-if="user.username !== 'nacos'"
                    @click="handleDelete(user)"
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

      <!-- Pagination -->
      <AppPagination
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        @change="handlePageChange"
      />
    </div>

    <!-- Create User Modal -->
    <FormModal
      v-model="showCreateModal"
      :title="t('createUser')"
      :submit-text="t('create')"
      :loading="saving"
      @submit="submitCreate"
    >
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('username') }} <span class="text-danger">*</span>
          </label>
          <input v-model="createForm.username" type="text" class="input" />
        </div>
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('password') }} <span class="text-danger">*</span>
          </label>
          <input v-model="createForm.password" type="password" class="input" />
        </div>
      </div>
    </FormModal>

    <!-- Reset Password Modal -->
    <FormModal
      v-model="showPasswordModal"
      :title="t('resetPassword')"
      :submit-text="t('confirm')"
      :loading="saving"
      @submit="submitResetPassword"
    >
      <div class="space-y-3">
        <p class="text-text-secondary">
          {{ t('resetPasswordFor') }}
          <span class="font-medium text-text-primary">{{ userToReset?.username }}</span>
        </p>
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('newPassword') }} <span class="text-danger">*</span>
          </label>
          <input v-model="newPassword" type="password" class="input" />
        </div>
      </div>
    </FormModal>

    <!-- Delete Confirm Modal -->
    <ConfirmModal
      v-model="showDeleteModal"
      :title="t('confirmDelete')"
      :message="`${t('confirmDeleteUser')} ${userToDelete?.username}?`"
      :confirm-text="t('delete')"
      danger
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus, Search, Key, Trash2, Loader2 } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import FormModal from '@/components/common/FormModal.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import type { UserInfo, Namespace } from '@/types'

defineProps<{
  namespace: Namespace
}>()

const { t } = useI18n()

// State
const loading = ref(false)
const saving = ref(false)
const users = ref<UserInfo[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchKeyword = ref('')
const fuzzySearch = ref(false)

// Modals
const showCreateModal = ref(false)
const showPasswordModal = ref(false)
const showDeleteModal = ref(false)
const userToReset = ref<UserInfo | null>(null)
const userToDelete = ref<UserInfo | null>(null)
const newPassword = ref('')

const createForm = reactive({
  username: '',
  password: '',
})

// Methods
const fetchUsers = async () => {
  loading.value = true
  try {
    const response = await batataApi.getUserList({
      pageNo: currentPage.value,
      pageSize: pageSize.value,
      username: searchKeyword.value || undefined,
      search: fuzzySearch.value ? 'blur' : 'accurate',
    })
    users.value = response.data.data.pageItems || []
    total.value = response.data.data.totalCount || 0
  } catch (error) {
    logger.error('Failed to fetch users:', error)
    toast.error(t('operationFailed'))
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchUsers()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchUsers()
}

const submitCreate = async () => {
  if (!createForm.username || !createForm.password) {
    toast.warning(t('requiredFieldsMissing'))
    return
  }

  saving.value = true
  try {
    await batataApi.createUser(createForm)
    showCreateModal.value = false
    Object.assign(createForm, { username: '', password: '' })
    fetchUsers()
  } catch (error) {
    logger.error('Failed to create user:', error)
    toast.error(t('operationFailed'))
  } finally {
    saving.value = false
  }
}

const handleResetPassword = (user: UserInfo) => {
  userToReset.value = user
  newPassword.value = ''
  showPasswordModal.value = true
}

const submitResetPassword = async () => {
  if (!userToReset.value || !newPassword.value) return

  saving.value = true
  try {
    await batataApi.updateUser({
      username: userToReset.value.username,
      newPassword: newPassword.value,
    })
    showPasswordModal.value = false
  } catch (error) {
    logger.error('Failed to reset password:', error)
    toast.error(t('operationFailed'))
  } finally {
    saving.value = false
  }
}

const handleDelete = (user: UserInfo) => {
  userToDelete.value = user
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!userToDelete.value) return
  try {
    await batataApi.deleteUser(userToDelete.value.username)
    showDeleteModal.value = false
    fetchUsers()
  } catch (error) {
    logger.error('Failed to delete user:', error)
    toast.error(t('operationFailed'))
  }
}

// Lifecycle
onMounted(() => {
  fetchUsers()
})
</script>
