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
              <th>{{ t('status') }}</th>
              <th class="w-48">{{ t('actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="3" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
              </td>
            </tr>
            <tr v-else-if="users.length === 0">
              <td colspan="3" class="text-center py-6 text-text-secondary">
                {{ t('noData') }}
              </td>
            </tr>
            <tr v-for="user in users" :key="user.username" class="hover:bg-bg-secondary">
              <td class="font-medium">{{ user.username }}</td>
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

    <!-- Create User Modal -->
    <div v-if="showCreateModal" class="modal-backdrop" @click="showCreateModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3 class="text-sm font-semibold text-text-primary">{{ t('createUser') }}</h3>
          <button @click="showCreateModal = false" class="btn btn-ghost btn-sm">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
        <div class="modal-body space-y-3">
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

    <!-- Reset Password Modal -->
    <div v-if="showPasswordModal" class="modal-backdrop" @click="showPasswordModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3 class="text-sm font-semibold text-text-primary">{{ t('resetPassword') }}</h3>
          <button @click="showPasswordModal = false" class="btn btn-ghost btn-sm">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
        <div class="modal-body space-y-3">
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
        <div class="modal-footer">
          <button @click="showPasswordModal = false" class="btn btn-secondary">
            {{ t('cancel') }}
          </button>
          <button @click="submitResetPassword" class="btn btn-primary" :disabled="saving">
            <Loader2 v-if="saving" class="w-3.5 h-3.5 animate-spin" />
            {{ t('confirm') }}
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
          <p class="text-text-secondary">
            {{ t('confirmDeleteUser') }}
            <span class="font-medium text-text-primary">{{ userToDelete?.username }}</span
            >?
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
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, Search, Key, Trash2, Loader2, X, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import nacosApi from '@/api/nacos'
import { toast } from '@/utils/error'
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

// Computed
const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1)

// Methods
const fetchUsers = async () => {
  loading.value = true
  try {
    const response = await nacosApi.getUserList({
      pageNo: currentPage.value,
      pageSize: pageSize.value,
      search: searchKeyword.value || undefined,
    })
    users.value = response.data.data.pageItems || []
    total.value = response.data.data.totalCount || 0
  } catch (error) {
    console.error('Failed to fetch users:', error)
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
    await nacosApi.createUser(createForm)
    showCreateModal.value = false
    Object.assign(createForm, { username: '', password: '' })
    fetchUsers()
  } catch (error) {
    console.error('Failed to create user:', error)
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
    await nacosApi.updateUser({
      username: userToReset.value.username,
      newPassword: newPassword.value,
    })
    showPasswordModal.value = false
  } catch (error) {
    console.error('Failed to reset password:', error)
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
    await nacosApi.deleteUser(userToDelete.value.username)
    showDeleteModal.value = false
    fetchUsers()
  } catch (error) {
    console.error('Failed to delete user:', error)
  }
}

// Lifecycle
onMounted(() => {
  fetchUsers()
})
</script>
