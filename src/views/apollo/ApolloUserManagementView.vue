<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
          {{ t('apolloUserManagement') }}
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ t('apolloUserManagementDesc') }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="refreshData"
          :disabled="loading"
          class="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw :size="14" :class="{ 'animate-spin': loading }" />
          {{ t('refresh') }}
        </button>
        <button
          @click="showCreateModal = true"
          class="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-colors"
        >
          <Plus :size="14" />
          {{ t('apolloCreateUser') }}
        </button>
      </div>
    </div>

    <!-- Search -->
    <div
      class="p-4 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
    >
      <div class="flex items-center gap-3">
        <div class="relative flex-1">
          <Search
            :size="16"
            class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <input
            v-model="searchKeyword"
            :placeholder="t('apolloSearchUser')"
            class="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            @keyup.enter="refreshData"
          />
        </div>
        <label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <input
            type="checkbox"
            v-model="includeInactive"
            class="rounded border-gray-300 dark:border-gray-600 text-orange-600 focus:ring-orange-500"
            @change="refreshData"
          />
          {{ t('apolloIncludeInactive') }}
        </label>
      </div>
    </div>

    <!-- Users Table -->
    <div
      class="bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800 overflow-hidden"
    >
      <div
        v-if="portalStore.users.length === 0 && !loading"
        class="text-center py-12 text-gray-400 dark:text-gray-500"
      >
        <Users :size="40" class="mx-auto mb-3 opacity-50" />
        <p class="text-sm">{{ t('apolloNoUsers') }}</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('apolloUserId') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('apolloUserEmail') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('status') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('actions') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in portalStore.users" :key="user.userId">
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                {{ user.userId }}
              </td>
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400"
              >
                {{ user.email || '-' }}
              </td>
              <td class="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                <span
                  :class="[
                    'px-2.5 py-1 text-xs font-bold rounded-lg',
                    user.enabled
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
                  ]"
                >
                  {{ user.enabled ? t('enabled') : t('disabled') }}
                </span>
              </td>
              <td class="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                <button
                  @click="toggleUserEnabled(user)"
                  class="px-3 py-1.5 text-xs font-bold rounded-lg transition-colors"
                  :class="
                    user.enabled
                      ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
                      : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                  "
                >
                  {{ user.enabled ? t('disable') : t('enable') }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="portalStore.users.length > 0"
        class="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400"
      >
        {{ t('total') }} {{ portalStore.users.length }} {{ t('items') }}
      </div>
    </div>

    <!-- Create User Modal -->
    <template v-if="showCreateModal">
      <div class="fixed inset-0 bg-black/50 z-40" @click="showCreateModal = false" />
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="showCreateModal = false"
      >
        <div
          class="bg-white rounded-3xl shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-800 w-full max-w-md"
        >
          <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100">
              {{ t('apolloCreateUser') }}
            </h3>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label
                class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
              >
                {{ t('username') }}
              </label>
              <input
                v-model="createForm.username"
                :placeholder="t('apolloUsernamePlaceholder')"
                class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label
                class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
              >
                {{ t('password') }}
              </label>
              <input
                v-model="createForm.password"
                type="password"
                :placeholder="t('apolloPasswordPlaceholder')"
                class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label
                class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
              >
                {{ t('apolloUserEmail') }}
              </label>
              <input
                v-model="createForm.email"
                type="email"
                :placeholder="t('apolloEmailPlaceholder')"
                class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              />
            </div>
          </div>
          <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-b-3xl flex justify-end gap-3">
            <button
              @click="showCreateModal = false"
              class="px-5 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              {{ t('cancel') }}
            </button>
            <button
              @click="handleCreateUser"
              class="px-5 py-2 text-sm font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-colors"
            >
              {{ t('create') }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RefreshCw, Plus, Search, Users } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useApolloPortalStore } from '@/stores/apollo-portal'
import type { ApolloUser } from '@/types/apollo'
import { logger } from '@/utils/logger'

const { t } = useI18n()
const portalStore = useApolloPortalStore()

const loading = ref(false)
const searchKeyword = ref('')
const includeInactive = ref(false)
const showCreateModal = ref(false)

const createForm = ref({ username: '', password: '', email: '' })

async function refreshData() {
  loading.value = true
  try {
    await portalStore.fetchUsers(
      searchKeyword.value || undefined,
      includeInactive.value || undefined,
    )
  } catch (err) {
    logger.error('Failed to fetch users:', err)
  } finally {
    loading.value = false
  }
}

async function handleCreateUser() {
  try {
    await portalStore.createUser(createForm.value)
    showCreateModal.value = false
    createForm.value = { username: '', password: '', email: '' }
    await refreshData()
  } catch (err) {
    logger.error('Failed to create user:', err)
  }
}

async function toggleUserEnabled(user: ApolloUser) {
  try {
    await portalStore.setUserEnabled(user.userId, !user.enabled)
    await refreshData()
  } catch (err) {
    logger.error('Failed to toggle user status:', err)
  }
}

onMounted(() => {
  refreshData()
})
</script>
