<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
          {{ t('consulKVDetail') }}
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ t('consulKVDetailDesc') }}
        </p>
      </div>
      <div class="flex items-center gap-3">
        <RouterLink
          :to="{ path: '/consul/kv/editor', query: { key: kvKey, mode: 'edit' } }"
          class="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-fuchsia-600 rounded-xl hover:bg-fuchsia-700 transition-colors"
        >
          <Pencil :size="16" />
          {{ t('edit') }}
        </RouterLink>
        <button
          @click="deleteModalVisible = true"
          class="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
        >
          <Trash2 :size="16" />
          {{ t('delete') }}
        </button>
        <RouterLink
          to="/consul/kv"
          class="flex items-center gap-2 px-5 py-2 text-sm font-bold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft :size="16" />
          {{ t('consulBackToKVList') }}
        </RouterLink>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
    >
      <div class="text-center py-12 text-gray-400 dark:text-gray-500">
        <RefreshCw :size="24" class="mx-auto mb-2 animate-spin" />
        <p class="text-sm">{{ t('loading') }}</p>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="errorMsg"
      class="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
    >
      <div class="text-center py-12 text-gray-400 dark:text-gray-500">
        <AlertTriangle :size="32" class="mx-auto mb-2 opacity-50" />
        <p class="text-sm">{{ errorMsg }}</p>
      </div>
    </div>

    <!-- KV Detail -->
    <template v-else-if="kvPair">
      <!-- Key Info Card -->
      <div
        class="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
      >
        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {{ t('basicInfo') }}
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Key -->
          <div>
            <p
              class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1"
            >
              {{ t('consulKVKey') }}
            </p>
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100 break-all">
              {{ kvPair.Key }}
            </p>
          </div>

          <!-- Flags -->
          <div>
            <p
              class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1"
            >
              {{ t('consulKVFlags') }}
            </p>
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
              {{ kvPair.Flags }}
            </p>
          </div>

          <!-- CreateIndex -->
          <div>
            <p
              class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1"
            >
              {{ t('consulKVCreateIndex') }}
            </p>
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
              {{ kvPair.CreateIndex }}
            </p>
          </div>

          <!-- ModifyIndex -->
          <div>
            <p
              class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1"
            >
              {{ t('consulKVModifyIndex') }}
            </p>
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
              {{ kvPair.ModifyIndex }}
            </p>
          </div>

          <!-- LockIndex -->
          <div>
            <p
              class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1"
            >
              {{ t('consulKVLockIndex') }}
            </p>
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
              {{ kvPair.LockIndex }}
            </p>
          </div>

          <!-- Session -->
          <div>
            <p
              class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1"
            >
              {{ t('consulKVSession') }}
            </p>
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
              {{ kvPair.Session || '-' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Value Card -->
      <div
        class="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {{ t('consulKVValue') }}
          </h3>
          <button
            @click="copyValue"
            class="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Copy :size="13" />
            {{ t('copy') }}
          </button>
        </div>
        <pre
          class="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto text-sm text-gray-900 dark:text-gray-100 font-mono whitespace-pre-wrap break-all"
        ><code>{{ decodedValue }}</code></pre>
      </div>
    </template>

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
          <span class="font-bold text-gray-900 dark:text-gray-100 break-all">{{ kvKey }}</span>
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
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Pencil, Trash2, ArrowLeft, RefreshCw, AlertTriangle, Copy } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useConsulStore } from '@/stores/consul'
import type { ConsulKVPair } from '@/types/consul'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const consulStore = useConsulStore()

const kvKey = computed(() => (route.query.key as string) || '')
const loading = ref(false)
const errorMsg = ref('')
const kvPair = ref<ConsulKVPair | null>(null)
const deleteModalVisible = ref(false)
const deleting = ref(false)

// Decode base64 value safely
const decodedValue = computed(() => {
  if (!kvPair.value?.Value) return ''
  try {
    return atob(kvPair.value.Value)
  } catch {
    return kvPair.value.Value
  }
})

// Load KV pair data
async function loadKVDetail() {
  if (!kvKey.value) {
    errorMsg.value = t('consulKVNotFound')
    return
  }

  loading.value = true
  errorMsg.value = ''
  try {
    const pairs = await consulStore.fetchKV(kvKey.value)
    if (pairs && pairs.length > 0) {
      kvPair.value = pairs[0] ?? null
    } else {
      errorMsg.value = t('consulKVNotFound')
    }
  } catch (err) {
    console.error('Failed to load KV detail:', err)
    errorMsg.value = t('consulKVLoadError')
  } finally {
    loading.value = false
  }
}

// Copy value to clipboard
async function copyValue() {
  try {
    await navigator.clipboard.writeText(decodedValue.value)
  } catch {
    console.error('Failed to copy value')
  }
}

// Delete handler
async function handleDelete() {
  if (!kvKey.value) return
  deleting.value = true
  try {
    await consulStore.deleteKV(kvKey.value)
    deleteModalVisible.value = false
    router.push('/consul/kv')
  } catch (err) {
    console.error('Failed to delete KV:', err)
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  loadKVDetail()
})
</script>
