<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
          {{ t('apolloConsumerManagement') }}
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ t('apolloConsumerManagementDesc') }}
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
          {{ t('apolloCreateConsumer') }}
        </button>
      </div>
    </div>

    <!-- Consumers Table -->
    <div
      class="bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800 overflow-hidden"
    >
      <div
        v-if="consumerList.length === 0 && !loading"
        class="text-center py-12 text-gray-400 dark:text-gray-500"
      >
        <Key :size="40" class="mx-auto mb-3 opacity-50" />
        <p class="text-sm">{{ t('apolloNoConsumers') }}</p>
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
                {{ t('name') }}
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
                {{ t('actions') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="consumer in consumerList" :key="consumer.id">
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                {{ consumer.appId }}
              </td>
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400"
              >
                {{ consumer.name }}
              </td>
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400"
              >
                {{ consumer.orgName || '-' }}
              </td>
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400"
              >
                {{ consumer.ownerName || '-' }}
              </td>
              <td class="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                <div class="flex items-center gap-2">
                  <button
                    @click="viewToken(consumer)"
                    class="px-3 py-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-lg transition-colors"
                  >
                    {{ t('apolloViewToken') }}
                  </button>
                  <button
                    @click="confirmDeleteConsumer(consumer)"
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

      <!-- Pagination -->
      <div
        v-if="consumerList.length > 0"
        class="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400"
      >
        <span>{{ t('total') }} {{ portalStore.consumers?.total || 0 }} {{ t('items') }}</span>
        <div class="flex items-center gap-2">
          <button
            :disabled="currentPage <= 0"
            @click="changePage(currentPage - 1)"
            class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {{ t('previous') }}
          </button>
          <button
            :disabled="!hasNextPage"
            @click="changePage(currentPage + 1)"
            class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {{ t('next') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Create Consumer Modal -->
    <template v-if="showCreateModal">
      <div class="fixed inset-0 bg-black/50 z-40" @click="showCreateModal = false" />
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="showCreateModal = false"
      >
        <div
          class="bg-white rounded-3xl shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-800 w-full max-w-lg"
        >
          <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100">
              {{ t('apolloCreateConsumer') }}
            </h3>
          </div>
          <div class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label
                  class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
                >
                  {{ t('apolloAppId') }}
                </label>
                <input
                  v-model="createForm.appId"
                  class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label
                  class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
                >
                  {{ t('name') }}
                </label>
                <input
                  v-model="createForm.name"
                  class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label
                  class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
                >
                  {{ t('apolloOrgId') }}
                </label>
                <input
                  v-model="createForm.orgId"
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
                  v-model="createForm.orgName"
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
                  v-model="createForm.ownerName"
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
                  v-model="createForm.ownerEmail"
                  class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                />
              </div>
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
              @click="handleCreate"
              class="px-5 py-2 text-sm font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-colors"
            >
              {{ t('create') }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Token Modal -->
    <template v-if="showTokenModal">
      <div class="fixed inset-0 bg-black/50 z-40" @click="showTokenModal = false" />
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="showTokenModal = false"
      >
        <div
          class="bg-white rounded-3xl shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-800 w-full max-w-md"
        >
          <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100">
              {{ t('apolloConsumerToken') }}
            </h3>
          </div>
          <div class="p-6">
            <div
              class="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm font-mono text-gray-900 dark:text-gray-100 break-all"
            >
              {{ tokenValue || t('loading') }}
            </div>
          </div>
          <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-b-3xl flex justify-end">
            <button
              @click="showTokenModal = false"
              class="px-5 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              {{ t('close') }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Delete Confirmation -->
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
              {{ t('apolloConfirmDeleteConsumer') }}
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
import { RefreshCw, Plus, Key, Trash2 } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useApolloPortalStore } from '@/stores/apollo-portal'
import type { ApolloConsumer, ApolloConsumerPayload } from '@/types/apollo'
import { logger } from '@/utils/logger'

const { t } = useI18n()
const portalStore = useApolloPortalStore()

const loading = ref(false)
const currentPage = ref(0)
const showCreateModal = ref(false)
const showTokenModal = ref(false)
const showDeleteModal = ref(false)
const tokenValue = ref('')
const deleteTarget = ref<ApolloConsumer | null>(null)

const emptyForm = (): ApolloConsumerPayload => ({
  appId: '',
  name: '',
  orgId: '',
  orgName: '',
  ownerName: '',
  ownerEmail: '',
})

const createForm = ref<ApolloConsumerPayload>(emptyForm())

const consumerList = computed(() => portalStore.consumers?.content || [])
const hasNextPage = computed(() => {
  if (!portalStore.consumers) return false
  return (currentPage.value + 1) * portalStore.consumers.size < portalStore.consumers.total
})

async function refreshData() {
  loading.value = true
  try {
    await portalStore.fetchConsumers(currentPage.value)
  } catch (err) {
    logger.error('Failed to fetch consumers:', err)
  } finally {
    loading.value = false
  }
}

function changePage(page: number) {
  currentPage.value = page
  refreshData()
}

async function handleCreate() {
  try {
    await portalStore.createConsumer(createForm.value)
    showCreateModal.value = false
    createForm.value = emptyForm()
    await refreshData()
  } catch (err) {
    logger.error('Failed to create consumer:', err)
  }
}

async function viewToken(consumer: ApolloConsumer) {
  tokenValue.value = ''
  showTokenModal.value = true
  try {
    if (consumer.id) {
      const result = await portalStore.getConsumerToken(consumer.id)
      tokenValue.value = result.token
    }
  } catch (err) {
    logger.error('Failed to get token:', err)
    tokenValue.value = 'Error loading token'
  }
}

function confirmDeleteConsumer(consumer: ApolloConsumer) {
  deleteTarget.value = consumer
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!deleteTarget.value?.id) return
  try {
    await portalStore.deleteConsumer(deleteTarget.value.id)
    await refreshData()
  } catch (err) {
    logger.error('Failed to delete consumer:', err)
  } finally {
    showDeleteModal.value = false
    deleteTarget.value = null
  }
}

onMounted(() => {
  refreshData()
})
</script>
