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
              v-model="searchKeyword"
              type="text"
              class="input"
              :placeholder="t('searchRole')"
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
                  @click="handleDelete(role)"
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

    <!-- Create Role Modal -->
    <div v-if="showCreateModal" class="modal-backdrop" @click="showCreateModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3 class="text-sm font-semibold text-text-primary">{{ t('bindRole') }}</h3>
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
              {{ t('username') }} <span class="text-danger">*</span>
            </label>
            <input v-model="createForm.username" type="text" class="input" />
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
          <p class="text-text-secondary">
            {{ t('confirmDeleteRoleBinding') }}
            <span class="font-medium text-text-primary">{{ roleToDelete?.role }}</span>
            {{ t('and') }}
            <span class="font-medium text-text-primary">{{ roleToDelete?.username }}</span
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
import { Plus, Search, Trash2, Loader2, X, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import nacosApi from '@/api/nacos'
import { toast } from '@/utils/error'
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
const searchKeyword = ref('')

// Modals
const showCreateModal = ref(false)
const showDeleteModal = ref(false)
const roleToDelete = ref<RoleInfo | null>(null)

const createForm = reactive({
  role: '',
  username: '',
})

// Computed
const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1)

// Methods
const fetchRoles = async () => {
  loading.value = true
  try {
    const response = await nacosApi.getRoleList({
      pageNo: currentPage.value,
      pageSize: pageSize.value,
      search: searchKeyword.value || undefined,
    })
    roles.value = response.data.data.pageItems || []
    total.value = response.data.data.totalCount || 0
  } catch (error) {
    console.error('Failed to fetch roles:', error)
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
    await nacosApi.createRole(createForm)
    showCreateModal.value = false
    Object.assign(createForm, { role: '', username: '' })
    fetchRoles()
  } catch (error) {
    console.error('Failed to create role:', error)
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
    await nacosApi.deleteRole(roleToDelete.value.role, roleToDelete.value.username)
    showDeleteModal.value = false
    fetchRoles()
  } catch (error) {
    console.error('Failed to delete role:', error)
  }
}

// Lifecycle
onMounted(() => {
  fetchRoles()
})
</script>
