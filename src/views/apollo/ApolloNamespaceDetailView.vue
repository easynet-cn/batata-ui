<template>
  <div class="space-y-6">
    <!-- Breadcrumb -->
    <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
      <RouterLink to="/apps" class="hover:text-orange-600 dark:hover:text-orange-400">
        {{ t('apolloApps') }}
      </RouterLink>
      <ChevronRight :size="12" />
      <RouterLink :to="`/app/${appId}`" class="hover:text-orange-600 dark:hover:text-orange-400">
        {{ appId }}
      </RouterLink>
      <ChevronRight :size="12" />
      <span class="text-gray-900 dark:text-gray-100 font-medium">
        {{ env }} / {{ clusterName }} / {{ namespaceName }}
      </span>
    </div>

    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
          {{ namespaceName }}
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ appId }} &middot; {{ env }} &middot; {{ clusterName }}
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
          @click="showCreateItemModal = true"
          class="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-colors"
        >
          <Plus :size="14" />
          {{ t('apolloCreateItem') }}
        </button>
        <button
          @click="showPublishModal = true"
          class="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors"
        >
          <Rocket :size="14" />
          {{ t('apolloPublish') }}
        </button>
        <RouterLink
          :to="`/releases/${appId}/${env}/${clusterName}/${namespaceName}`"
          class="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <History :size="14" />
          {{ t('apolloReleaseHistory') }}
        </RouterLink>
      </div>
    </div>

    <!-- Namespace Lock & Status Bar -->
    <div class="flex items-center gap-3 flex-wrap">
      <!-- Lock Status -->
      <div
        v-if="apolloStore.namespaceLock"
        :class="[
          'flex items-center gap-2 px-3 py-2 text-sm rounded-xl border',
          apolloStore.namespaceLock.isLocked
            ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-400'
            : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400',
        ]"
      >
        <Lock v-if="apolloStore.namespaceLock.isLocked" :size="14" />
        <Unlock v-else :size="14" />
        <span class="font-bold text-xs">
          {{
            apolloStore.namespaceLock.isLocked
              ? t('apolloNamespaceLocked')
              : t('apolloNamespaceUnlocked')
          }}
        </span>
        <span v-if="apolloStore.namespaceLock.lockedBy" class="text-xs">
          ({{ t('apolloLockedBy') }}: {{ apolloStore.namespaceLock.lockedBy }})
        </span>
      </div>

      <!-- Latest Release -->
      <div
        v-if="apolloStore.latestRelease"
        class="flex items-center gap-2 px-3 py-2 text-sm bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30 rounded-xl"
      >
        <Rocket :size="14" class="text-orange-600 dark:text-orange-400" />
        <span class="font-bold text-orange-700 dark:text-orange-400">
          {{ t('apolloReleases') }}:
        </span>
        <span class="text-orange-600 dark:text-orange-300">
          {{ apolloStore.latestRelease.name }}
        </span>
      </div>

      <!-- Quick Links -->
      <RouterLink
        :to="`/gray-release/${appId}/${env}/${clusterName}/${namespaceName}`"
        class="flex items-center gap-2 px-3 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <GitBranch :size="14" />
        {{ t('apolloGrayRelease') }}
      </RouterLink>
      <RouterLink
        :to="`/instances/${appId}/${env}/${clusterName}/${namespaceName}`"
        class="flex items-center gap-2 px-3 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Monitor :size="14" />
        {{ t('apolloInstances') }}
      </RouterLink>
    </div>

    <!-- Config Items Table -->
    <div
      class="bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800 overflow-hidden"
    >
      <!-- Search -->
      <div class="p-4 border-b border-gray-200 dark:border-gray-800">
        <div class="relative">
          <Search
            :size="16"
            class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <input
            v-model="searchQuery"
            :placeholder="t('apolloSearchItem')"
            class="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
          />
        </div>
      </div>

      <div
        v-if="filteredItems.length === 0 && !loading"
        class="text-center py-12 text-gray-400 dark:text-gray-500"
      >
        <FileCode :size="40" class="mx-auto mb-3 opacity-50" />
        <p class="text-sm">{{ t('apolloNoItems') }}</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('apolloKey') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('apolloValue') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('apolloComment') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('actions') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredItems" :key="item.key">
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                {{ item.key }}
              </td>
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate"
              >
                {{ item.value }}
              </td>
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-500"
              >
                {{ item.comment || '-' }}
              </td>
              <td class="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                <div class="flex items-center gap-2">
                  <button
                    @click="editItem(item)"
                    class="p-1.5 text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    :title="t('edit')"
                  >
                    <Pencil :size="14" />
                  </button>
                  <button
                    @click="confirmDeleteItem(item)"
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

      <div
        v-if="filteredItems.length > 0"
        class="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400"
      >
        {{ t('total') }} {{ filteredItems.length }} {{ t('items') }}
      </div>
    </div>

    <!-- Create/Edit Item Modal -->
    <template v-if="showCreateItemModal || showEditItemModal">
      <div class="fixed inset-0 bg-black/50 z-40" @click="closeItemModal" />
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="closeItemModal"
      >
        <div
          class="bg-white rounded-3xl shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-800 w-full max-w-lg"
        >
          <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100">
              {{ showEditItemModal ? t('apolloEditItem') : t('apolloCreateItem') }}
            </h3>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label
                class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
              >
                {{ t('apolloKey') }}
              </label>
              <input
                v-model="itemForm.key"
                :disabled="showEditItemModal"
                :placeholder="t('apolloKeyPlaceholder')"
                class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 disabled:opacity-50"
              />
            </div>
            <div>
              <label
                class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
              >
                {{ t('apolloValue') }}
              </label>
              <textarea
                v-model="itemForm.value"
                :placeholder="t('apolloValuePlaceholder')"
                rows="3"
                class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 resize-none"
              />
            </div>
            <div>
              <label
                class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
              >
                {{ t('apolloComment') }}
              </label>
              <input
                v-model="itemForm.comment"
                :placeholder="t('apolloCommentPlaceholder')"
                class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              />
            </div>
          </div>
          <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-b-3xl flex justify-end gap-3">
            <button
              @click="closeItemModal"
              class="px-5 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              {{ t('cancel') }}
            </button>
            <button
              @click="saveItem"
              class="px-5 py-2 text-sm font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-colors"
            >
              {{ t('save') }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Publish Modal -->
    <template v-if="showPublishModal">
      <div class="fixed inset-0 bg-black/50 z-40" @click="showPublishModal = false" />
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="showPublishModal = false"
      >
        <div
          class="bg-white rounded-3xl shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-800 w-full max-w-md"
        >
          <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100">
              {{ t('apolloPublish') }}
            </h3>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label
                class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
              >
                {{ t('apolloReleaseTitle') }}
              </label>
              <input
                v-model="releaseForm.releaseTitle"
                :placeholder="t('apolloReleaseTitlePlaceholder')"
                class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label
                class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
              >
                {{ t('apolloReleaseComment') }}
              </label>
              <textarea
                v-model="releaseForm.releaseComment"
                :placeholder="t('apolloReleaseCommentPlaceholder')"
                rows="3"
                class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 resize-none"
              />
            </div>
            <div>
              <label
                class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
              >
                {{ t('apolloReleasedBy') }}
              </label>
              <input
                v-model="releaseForm.releasedBy"
                placeholder="admin"
                class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              />
            </div>
          </div>
          <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-b-3xl flex justify-end gap-3">
            <button
              @click="showPublishModal = false"
              class="px-5 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              {{ t('cancel') }}
            </button>
            <button
              @click="handlePublish"
              class="px-5 py-2 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors"
            >
              {{ t('apolloPublish') }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Delete Item Modal -->
    <template v-if="showDeleteItemModal">
      <div class="fixed inset-0 bg-black/50 z-40" @click="showDeleteItemModal = false" />
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="showDeleteItemModal = false"
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
              {{ t('apolloConfirmDeleteItem') }}
            </p>
          </div>
          <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-b-3xl flex justify-end gap-3">
            <button
              @click="showDeleteItemModal = false"
              class="px-5 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              {{ t('cancel') }}
            </button>
            <button
              @click="handleDeleteItem"
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
import { RouterLink, useRoute } from 'vue-router'
import {
  ChevronRight,
  RefreshCw,
  Plus,
  Rocket,
  History,
  Search,
  FileCode,
  Pencil,
  Trash2,
  Lock,
  Unlock,
  GitBranch,
  Monitor,
} from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useApolloStore } from '@/stores/apollo'
import type { ApolloItem } from '@/types/apollo'
import { logger } from '@/utils/logger'

const { t } = useI18n()
const route = useRoute()
const apolloStore = useApolloStore()

const appId = route.params.appId as string
const env = route.params.env as string
const clusterName = route.params.clusterName as string
const namespaceName = route.params.namespaceName as string

const loading = ref(false)
const searchQuery = ref('')

const showCreateItemModal = ref(false)
const showEditItemModal = ref(false)
const showPublishModal = ref(false)
const showDeleteItemModal = ref(false)
const deleteTarget = ref<ApolloItem | null>(null)

const itemForm = ref({ key: '', value: '', comment: '' })
const releaseForm = ref({ releaseTitle: '', releaseComment: '', releasedBy: 'admin' })

const filteredItems = computed(() => {
  if (!searchQuery.value) return apolloStore.items
  const q = searchQuery.value.toLowerCase()
  return apolloStore.items.filter((item) => item.key.toLowerCase().includes(q))
})

function editItem(item: ApolloItem) {
  itemForm.value = { key: item.key, value: item.value, comment: item.comment || '' }
  showEditItemModal.value = true
}

function confirmDeleteItem(item: ApolloItem) {
  deleteTarget.value = item
  showDeleteItemModal.value = true
}

async function saveItem() {
  try {
    if (showEditItemModal.value) {
      await apolloStore.updateItem(env, appId, clusterName, namespaceName, itemForm.value.key, {
        key: itemForm.value.key,
        value: itemForm.value.value,
        comment: itemForm.value.comment,
      })
    } else {
      await apolloStore.createItem(env, appId, clusterName, namespaceName, {
        key: itemForm.value.key,
        value: itemForm.value.value,
        comment: itemForm.value.comment,
      })
    }
    await apolloStore.fetchItems(env, appId, clusterName, namespaceName)
    closeItemModal()
  } catch (err) {
    logger.error('Failed to save item:', err)
  }
}

async function handleDeleteItem() {
  if (!deleteTarget.value) return
  try {
    await apolloStore.deleteItem(
      env,
      appId,
      clusterName,
      namespaceName,
      deleteTarget.value.key,
      'admin',
    )
    await apolloStore.fetchItems(env, appId, clusterName, namespaceName)
  } catch (err) {
    logger.error('Failed to delete item:', err)
  } finally {
    showDeleteItemModal.value = false
    deleteTarget.value = null
  }
}

async function handlePublish() {
  try {
    await apolloStore.createRelease(env, appId, clusterName, namespaceName, releaseForm.value)
    await apolloStore.fetchLatestRelease(env, appId, clusterName, namespaceName)
    showPublishModal.value = false
    releaseForm.value = { releaseTitle: '', releaseComment: '', releasedBy: 'admin' }
  } catch (err) {
    logger.error('Failed to publish:', err)
  }
}

function closeItemModal() {
  showCreateItemModal.value = false
  showEditItemModal.value = false
  itemForm.value = { key: '', value: '', comment: '' }
}

async function refreshData() {
  loading.value = true
  try {
    await Promise.allSettled([
      apolloStore.fetchItems(env, appId, clusterName, namespaceName),
      apolloStore.fetchLatestRelease(env, appId, clusterName, namespaceName),
      apolloStore.fetchNamespaceLock(env, appId, clusterName, namespaceName),
    ])
  } catch (err) {
    logger.error('Failed to fetch namespace detail:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  refreshData()
})
</script>
