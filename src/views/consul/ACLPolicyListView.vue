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
        <RouterLink to="/consul/acl/policy/new" class="btn btn-primary btn-sm">
          <Plus class="w-3.5 h-3.5" />
          {{ t('createPolicy') }}
        </RouterLink>
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
                  <RouterLink
                    :to="`/consul/acl/policy/${policy.ID}/edit`"
                    class="btn btn-ghost btn-sm text-text-secondary"
                    :title="t('edit')"
                  >
                    <Pencil class="w-3.5 h-3.5" />
                  </RouterLink>
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
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Plus, RefreshCw, Trash2, Pencil, Loader2, Search } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useConsulStore } from '@/stores/consul'
import consulApi from '@/api/consul'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import type { ConsulACLPolicy } from '@/types/consul'

const { t } = useI18n()
const store = useConsulStore()

// State
const showDeleteModal = ref(false)
const policyToDelete = ref<ConsulACLPolicy | null>(null)
const searchQuery = ref('')
const kindFilter = ref('')
const sortBy = ref('name-asc')

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

// Actions
async function loadPolicies() {
  try {
    await store.fetchACLPolicies()
  } catch (error) {
    logger.error('Failed to fetch ACL policies:', error)
    toast.apiError(error)
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
