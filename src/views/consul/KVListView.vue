<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
          {{ t('consulKVStore') }}
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ t('consulKVStoreDesc') }}
        </p>
      </div>
      <RouterLink
        to="/consul/kv/editor"
        class="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-fuchsia-600 rounded-xl hover:bg-fuchsia-700 transition-colors"
      >
        <Plus :size="16" />
        {{ t('consulCreateKV') }}
      </RouterLink>
    </div>

    <!-- Search and Breadcrumb -->
    <div
      class="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
    >
      <!-- Search Bar -->
      <div class="flex items-center gap-3 mb-4">
        <div class="relative flex-1">
          <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('consulSearchKVPlaceholder')"
            class="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            @keydown.enter="handleSearch"
          />
        </div>
        <button
          @click="handleSearch"
          class="px-5 py-2.5 text-sm font-bold text-white bg-fuchsia-600 rounded-xl hover:bg-fuchsia-700 transition-colors"
        >
          {{ t('search') }}
        </button>
        <button
          @click="refreshData"
          :disabled="consulStore.loading"
          class="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw :size="14" :class="{ 'animate-spin': consulStore.loading }" />
        </button>
      </div>

      <!-- Breadcrumb -->
      <div class="flex items-center gap-1 text-sm mb-4">
        <button
          @click="navigateToPrefix('')"
          class="font-medium text-fuchsia-600 dark:text-fuchsia-400 hover:underline"
        >
          /
        </button>
        <template v-for="(segment, index) in breadcrumbSegments" :key="index">
          <ChevronRight :size="14" class="text-gray-400" />
          <button
            @click="navigateToPrefix(breadcrumbPath(index))"
            :class="[
              'font-medium',
              index === breadcrumbSegments.length - 1
                ? 'text-gray-900 dark:text-gray-100'
                : 'text-fuchsia-600 dark:text-fuchsia-400 hover:underline',
            ]"
          >
            {{ segment }}
          </button>
        </template>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <div v-if="loading" class="text-center py-12 text-gray-400 dark:text-gray-500">
          <RefreshCw :size="24" class="mx-auto mb-2 animate-spin" />
          <p class="text-sm">{{ t('loading') }}</p>
        </div>

        <div
          v-else-if="displayItems.length === 0"
          class="text-center py-12 text-gray-400 dark:text-gray-500"
        >
          <Database :size="32" class="mx-auto mb-2 opacity-50" />
          <p class="text-sm">{{ t('noData') }}</p>
        </div>

        <table v-else class="w-full">
          <thead>
            <tr>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('consulKVKey') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('consulKVValue') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('consulKVFlags') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('consulKVModifyIndex') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-right"
              >
                {{ t('actions') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in displayItems" :key="item.key">
              <!-- Key column -->
              <td class="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                <button
                  v-if="item.isFolder"
                  @click="navigateToPrefix(item.fullKey)"
                  class="flex items-center gap-2 text-sm font-medium text-fuchsia-600 dark:text-fuchsia-400 hover:underline"
                >
                  <Folder :size="16" />
                  {{ item.displayKey }}
                </button>
                <span
                  v-else
                  class="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100"
                >
                  <FileText :size="16" class="text-gray-400" />
                  {{ item.displayKey }}
                </span>
              </td>

              <!-- Value column -->
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate"
              >
                <span v-if="item.isFolder" class="text-gray-400 italic">-</span>
                <span v-else>{{ item.decodedValue }}</span>
              </td>

              <!-- Flags column -->
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400"
              >
                {{ item.isFolder ? '-' : item.flags }}
              </td>

              <!-- ModifyIndex column -->
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400"
              >
                {{ item.isFolder ? '-' : item.modifyIndex }}
              </td>

              <!-- Actions column -->
              <td class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-right">
                <div v-if="!item.isFolder" class="flex items-center justify-end gap-2">
                  <RouterLink
                    :to="{ path: '/consul/kv/detail', query: { key: item.fullKey } }"
                    class="p-1.5 text-gray-400 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 transition-colors"
                    :title="t('view')"
                  >
                    <Eye :size="16" />
                  </RouterLink>
                  <RouterLink
                    :to="{ path: '/consul/kv/editor', query: { key: item.fullKey, mode: 'edit' } }"
                    class="p-1.5 text-gray-400 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 transition-colors"
                    :title="t('edit')"
                  >
                    <Pencil :size="16" />
                  </RouterLink>
                  <button
                    @click="confirmDelete(item.fullKey)"
                    class="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    :title="t('delete')"
                  >
                    <Trash2 :size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="deleteModalVisible"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="deleteModalVisible = false"
    >
      <div
        class="bg-white rounded-3xl shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-800 w-full max-w-md p-6"
      >
        <div class="flex items-center gap-3 mb-4">
          <div
            class="w-10 h-10 bg-red-50 dark:bg-red-950/30 rounded-lg flex items-center justify-center"
          >
            <AlertTriangle :size="20" class="text-red-500" />
          </div>
          <h3 class="text-lg font-extrabold text-gray-900 dark:text-gray-100">
            {{ t('confirmDelete') }}
          </h3>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {{ t('consulConfirmDeleteKV') }}
          <span class="font-bold text-gray-900 dark:text-gray-100 break-all">{{
            deleteTargetKey
          }}</span>
        </p>
        <div class="flex items-center justify-end gap-3">
          <button
            @click="deleteModalVisible = false"
            class="px-5 py-2 text-sm font-bold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {{ t('cancel') }}
          </button>
          <button
            @click="handleDelete"
            :disabled="deleting"
            class="px-5 py-2 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {{ t('delete') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import {
  Plus,
  Search,
  RefreshCw,
  Database,
  Folder,
  FileText,
  Eye,
  Pencil,
  Trash2,
  AlertTriangle,
  ChevronRight,
} from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useConsulStore } from '@/stores/consul'
import consulApi from '@/api/consul'
import type { ConsulKVPair } from '@/types/consul'

const { t } = useI18n()
const consulStore = useConsulStore()

const loading = ref(false)
const searchQuery = ref('')
const currentPrefix = ref('')
const deleteModalVisible = ref(false)
const deleteTargetKey = ref('')
const deleting = ref(false)

// KV data loaded for the current prefix
const kvKeys = ref<string[]>([])
const kvDetails = ref<Map<string, ConsulKVPair>>(new Map())

interface DisplayItem {
  key: string
  fullKey: string
  displayKey: string
  isFolder: boolean
  decodedValue: string
  flags: number
  modifyIndex: number
}

// Breadcrumb segments
const breadcrumbSegments = computed(() => {
  if (!currentPrefix.value) return []
  return currentPrefix.value.replace(/\/$/, '').split('/')
})

function breadcrumbPath(index: number): string {
  return breadcrumbSegments.value.slice(0, index + 1).join('/') + '/'
}

// Decode base64 value safely
function decodeValue(value: string | null): string {
  if (!value) return ''
  try {
    return atob(value)
  } catch {
    return value
  }
}

// Truncate string to 100 chars
function truncate(str: string, maxLen: number = 100): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen) + '...'
}

// Build display items from keys
const displayItems = computed<DisplayItem[]>(() => {
  const prefix = currentPrefix.value
  const items: DisplayItem[] = []
  const seenFolders = new Set<string>()

  for (const key of kvKeys.value) {
    // Remove current prefix from key for relative display
    const relative = key.startsWith(prefix) ? key.slice(prefix.length) : key
    if (!relative) continue

    // Check if this key is a folder (has further segments)
    const slashIndex = relative.indexOf('/')
    if (slashIndex !== -1 && slashIndex < relative.length - 1) {
      // It's inside a subfolder
      const folderName = relative.slice(0, slashIndex + 1)
      if (!seenFolders.has(folderName)) {
        seenFolders.add(folderName)
        items.push({
          key: folderName,
          fullKey: prefix + folderName,
          displayKey: folderName,
          isFolder: true,
          decodedValue: '',
          flags: 0,
          modifyIndex: 0,
        })
      }
    } else if (relative.endsWith('/')) {
      // Folder itself
      if (!seenFolders.has(relative)) {
        seenFolders.add(relative)
        items.push({
          key: relative,
          fullKey: key,
          displayKey: relative,
          isFolder: true,
          decodedValue: '',
          flags: 0,
          modifyIndex: 0,
        })
      }
    } else {
      // Regular key
      const detail = kvDetails.value.get(key)
      items.push({
        key: relative,
        fullKey: key,
        displayKey: relative,
        isFolder: false,
        decodedValue: truncate(decodeValue(detail?.Value ?? null)),
        flags: detail?.Flags ?? 0,
        modifyIndex: detail?.ModifyIndex ?? 0,
      })
    }
  }

  // Sort: folders first, then alphabetical
  items.sort((a, b) => {
    if (a.isFolder && !b.isFolder) return -1
    if (!a.isFolder && b.isFolder) return 1
    return a.displayKey.localeCompare(b.displayKey)
  })

  return items
})

// Navigate to a prefix folder
function navigateToPrefix(prefix: string) {
  currentPrefix.value = prefix
  searchQuery.value = ''
  fetchKeys()
}

// Search handler
function handleSearch() {
  if (searchQuery.value.trim()) {
    currentPrefix.value = searchQuery.value.trim()
    if (!currentPrefix.value.endsWith('/')) {
      currentPrefix.value += '/'
    }
  } else {
    currentPrefix.value = ''
  }
  fetchKeys()
}

// Fetch keys for current prefix
async function fetchKeys() {
  loading.value = true
  try {
    const prefix = currentPrefix.value || undefined
    const response = await consulApi.listKVKeys(prefix, '/')
    kvKeys.value = response.data || []

    // Fetch details for non-folder keys
    kvDetails.value.clear()
    const leafKeys = kvKeys.value.filter((k) => !k.endsWith('/'))
    await Promise.allSettled(
      leafKeys.map(async (key) => {
        try {
          const detail = await consulApi.getKV(key)
          if (detail.data && detail.data.length > 0) {
            kvDetails.value.set(key, detail.data[0]!)
          }
        } catch {
          // Skip keys that can't be fetched
        }
      }),
    )
  } catch (err) {
    console.error('Failed to fetch KV keys:', err)
    kvKeys.value = []
  } finally {
    loading.value = false
  }
}

// Refresh data
function refreshData() {
  fetchKeys()
}

// Delete confirmation
function confirmDelete(key: string) {
  deleteTargetKey.value = key
  deleteModalVisible.value = true
}

async function handleDelete() {
  if (!deleteTargetKey.value) return
  deleting.value = true
  try {
    await consulStore.deleteKV(deleteTargetKey.value)
    deleteModalVisible.value = false
    deleteTargetKey.value = ''
    await fetchKeys()
  } catch (err) {
    console.error('Failed to delete KV:', err)
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  fetchKeys()
})
</script>
