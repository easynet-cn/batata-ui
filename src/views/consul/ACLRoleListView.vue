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
        <RouterLink to="/consul/acl/role/new" class="btn btn-primary btn-sm">
          <Plus class="w-3.5 h-3.5" />
          {{ t('createRole') }}
        </RouterLink>
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
                  <RouterLink
                    :to="`/consul/acl/role/${role.ID}/edit`"
                    class="btn btn-ghost btn-sm text-text-secondary"
                    :title="t('edit')"
                  >
                    <Pencil class="w-3.5 h-3.5" />
                  </RouterLink>
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
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Plus, RefreshCw, Trash2, Pencil, Loader2, Search } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useConsulStore } from '@/stores/consul'
import consulApi from '@/api/consul'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import type { ConsulACLRole } from '@/types/consul'

const { t } = useI18n()
const store = useConsulStore()

// State
const showDeleteModal = ref(false)
const roleToDelete = ref<ConsulACLRole | null>(null)
const searchQuery = ref('')
const sortBy = ref('name-asc')

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
