<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
          {{ t('apolloApps') }}
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ t('apolloAppsDesc') }}
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
          {{ t('apolloCreateApp') }}
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
            v-model="searchQuery"
            :placeholder="t('apolloSearchApp')"
            class="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
          />
        </div>
      </div>
    </div>

    <!-- Apps Table -->
    <div
      class="bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800 overflow-hidden"
    >
      <div
        v-if="filteredApps.length === 0 && !loading"
        class="text-center py-12 text-gray-400 dark:text-gray-500"
      >
        <Box :size="40" class="mx-auto mb-3 opacity-50" />
        <p class="text-sm">{{ t('apolloNoApps') }}</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('apolloAppId') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('apolloAppName') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('apolloOrgName') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('apolloOwnerName') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('apolloOwnerEmail') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('actions') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="app in filteredApps" :key="app.appId">
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                <RouterLink
                  :to="`/app/${app.appId}`"
                  class="text-orange-600 dark:text-orange-400 hover:underline"
                >
                  {{ app.appId }}
                </RouterLink>
              </td>
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400"
              >
                {{ app.name }}
              </td>
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400"
              >
                {{ app.orgName || '-' }}
              </td>
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400"
              >
                {{ app.ownerName || '-' }}
              </td>
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400"
              >
                {{ app.ownerEmail || '-' }}
              </td>
              <td class="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                <div class="flex items-center gap-2">
                  <button
                    @click="editApp(app)"
                    class="p-1.5 text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    :title="t('edit')"
                  >
                    <Pencil :size="14" />
                  </button>
                  <button
                    @click="confirmDelete(app)"
                    class="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    :title="t('delete')"
                  >
                    <Trash2 :size="14" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer -->
      <div
        v-if="filteredApps.length > 0"
        class="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400"
      >
        {{ t('total') }} {{ filteredApps.length }} {{ t('items') }}
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <template v-if="showCreateModal || showEditModal">
      <div class="fixed inset-0 bg-black/50 z-40" @click="closeModal" />
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="closeModal">
        <div
          class="bg-white rounded-3xl shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-800 w-full max-w-lg"
        >
          <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100">
              {{ showEditModal ? t('apolloEditApp') : t('apolloCreateApp') }}
            </h3>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label
                class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
              >
                {{ t('apolloAppId') }}
              </label>
              <input
                v-model="formData.appId"
                :disabled="showEditModal"
                :placeholder="t('apolloAppIdPlaceholder')"
                class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 disabled:opacity-50"
              />
            </div>
            <div>
              <label
                class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
              >
                {{ t('apolloAppName') }}
              </label>
              <input
                v-model="formData.name"
                :placeholder="t('apolloAppNamePlaceholder')"
                class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label
                  class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
                >
                  {{ t('apolloOrgId') }}
                </label>
                <input
                  v-model="formData.orgId"
                  :placeholder="t('apolloOrgIdPlaceholder')"
                  class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label
                  class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
                >
                  {{ t('apolloOrgName') }}
                </label>
                <input
                  v-model="formData.orgName"
                  :placeholder="t('apolloOrgNamePlaceholder')"
                  class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label
                  class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
                >
                  {{ t('apolloOwnerName') }}
                </label>
                <input
                  v-model="formData.ownerName"
                  :placeholder="t('apolloOwnerNamePlaceholder')"
                  class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label
                  class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
                >
                  {{ t('apolloOwnerEmail') }}
                </label>
                <input
                  v-model="formData.ownerEmail"
                  :placeholder="t('apolloOwnerEmailPlaceholder')"
                  class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                />
              </div>
            </div>
          </div>
          <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-b-3xl flex justify-end gap-3">
            <button
              @click="closeModal"
              class="px-5 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              {{ t('cancel') }}
            </button>
            <button
              @click="saveApp"
              class="px-5 py-2 text-sm font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-colors"
            >
              {{ t('save') }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Delete Confirmation Modal -->
    <template v-if="showDeleteModal">
      <div class="fixed inset-0 bg-black/50 z-40" @click="showDeleteModal = false" />
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="showDeleteModal = false"
      >
        <div
          class="bg-white rounded-3xl shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-800 w-full max-w-md"
        >
          <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100">
              {{ t('confirmDelete') }}
            </h3>
          </div>
          <div class="p-6">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ t('apolloConfirmDeleteApp') }}
            </p>
            <p class="text-xs text-red-500 dark:text-red-400 mt-2">
              {{ t('apolloDeleteAppWarning') }}
            </p>
          </div>
          <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-b-3xl flex justify-end gap-3">
            <button
              @click="showDeleteModal = false"
              class="px-5 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              {{ t('cancel') }}
            </button>
            <button
              @click="handleDelete"
              class="px-5 py-2 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
            >
              {{ t('delete') }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Box, RefreshCw, Plus, Search, Pencil, Trash2 } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useApolloStore } from '@/stores/apollo'
import type { ApolloApp, ApolloAppPayload } from '@/types/apollo'
import { logger } from '@/utils/logger'

const { t } = useI18n()
const apolloStore = useApolloStore()

const loading = ref(false)
const searchQuery = ref('')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const deleteTarget = ref<ApolloApp | null>(null)

const emptyForm = (): ApolloAppPayload => ({
  appId: '',
  name: '',
  orgId: '',
  orgName: '',
  ownerName: '',
  ownerEmail: '',
})

const formData = ref<ApolloAppPayload>(emptyForm())

const filteredApps = computed(() => {
  if (!searchQuery.value) return apolloStore.apps
  const q = searchQuery.value.toLowerCase()
  return apolloStore.apps.filter(
    (app) => app.appId.toLowerCase().includes(q) || app.name.toLowerCase().includes(q),
  )
})

async function refreshData() {
  loading.value = true
  try {
    await apolloStore.fetchApps()
  } catch (err) {
    logger.error('Failed to fetch apps:', err)
  } finally {
    loading.value = false
  }
}

function editApp(app: ApolloApp) {
  formData.value = {
    appId: app.appId,
    name: app.name,
    orgId: app.orgId,
    orgName: app.orgName,
    ownerName: app.ownerName,
    ownerEmail: app.ownerEmail,
  }
  showEditModal.value = true
}

function confirmDelete(app: ApolloApp) {
  deleteTarget.value = app
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  try {
    await apolloStore.deleteApp(deleteTarget.value.appId)
    await apolloStore.fetchApps()
  } catch (err) {
    logger.error('Failed to delete app:', err)
  } finally {
    showDeleteModal.value = false
    deleteTarget.value = null
  }
}

async function saveApp() {
  try {
    if (showEditModal.value) {
      await apolloStore.updateApp(formData.value.appId, formData.value)
    } else {
      await apolloStore.createApp(formData.value)
    }
    await apolloStore.fetchApps()
    closeModal()
  } catch (err) {
    logger.error('Failed to save app:', err)
  }
}

function closeModal() {
  showCreateModal.value = false
  showEditModal.value = false
  formData.value = emptyForm()
}

onMounted(() => {
  refreshData()
})
</script>
