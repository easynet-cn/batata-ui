<template>
  <div class="space-y-4 md:space-y-5">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <button
        @click="goBack"
        class="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
      >
        <ArrowLeft :size="16" />
      </button>
      <div>
        <h1 class="text-xl font-extrabold text-gray-900 dark:text-white">
          {{ t('historyDetail') }}
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {{ route.query.dataId }} / {{ route.query.groupName }}
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
    >
      <div class="flex items-center justify-center py-12">
        <Loader2 :size="24" class="animate-spin text-blue-600" />
      </div>
    </div>

    <template v-else-if="detail">
      <!-- Metadata Card -->
      <div
        class="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
      >
        <div class="flex items-center gap-2 mb-4">
          <FileText :size="18" class="text-blue-600" />
          <h2 class="text-base font-bold text-gray-900 dark:text-white">{{ detail.dataId }}</h2>
          <span :class="opTypeBadgeClass">{{ opTypeLabel }}</span>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p
              class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1"
            >
              {{ t('group') }}
            </p>
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
              {{ detail.groupName || '-' }}
            </p>
          </div>
          <div>
            <p
              class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1"
            >
              {{ t('namespace') }}
            </p>
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
              {{ detail.namespaceId || 'public' }}
            </p>
          </div>
          <div>
            <p
              class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1"
            >
              {{ t('operationType') }}
            </p>
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ opTypeLabel }}</p>
          </div>
          <div>
            <p
              class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1"
            >
              {{ t('publishType') }}
            </p>
            <span :class="publishTypeBadgeClass">{{ publishTypeLabel }}</span>
          </div>
          <div>
            <p
              class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1"
            >
              {{ t('srcUser') }}
            </p>
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
              {{ detail.srcUser || '-' }}
            </p>
          </div>
          <div>
            <p
              class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1"
            >
              {{ t('sourceIp') }}
            </p>
            <p class="text-sm font-mono text-gray-900 dark:text-gray-100">
              {{ detail.srcIp || '-' }}
            </p>
          </div>
          <div>
            <p
              class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1"
            >
              MD5
            </p>
            <p class="text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
              {{ detail.md5 || '-' }}
            </p>
          </div>
          <div>
            <p
              class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1"
            >
              {{ t('modifyTime') }}
            </p>
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
              {{ formatTime(detail.modifyTime) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Content Card -->
      <div
        class="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
      >
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base font-bold text-gray-900 dark:text-white">{{ t('content') }}</h2>
          <div class="flex items-center gap-2">
            <button
              @click="copyContent"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Copy :size="14" class="inline mr-1" />
              {{ t('copy') }}
            </button>
            <button
              @click="handleRollback"
              class="px-4 py-2 text-sm font-medium text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-xl transition-colors"
            >
              <RotateCcw :size="14" class="inline mr-1" />
              {{ t('rollbackConfig') }}
            </button>
          </div>
        </div>
        <CodeEditor
          :model-value="detail.content || ''"
          :language="configType"
          :readonly="true"
          class="min-h-[300px]"
        />
      </div>
    </template>

    <!-- Not found -->
    <div
      v-else
      class="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
    >
      <p class="text-center text-gray-500 dark:text-gray-400 py-12">{{ t('noData') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import type { ConfigHistoryInfo } from '@/types'
import CodeEditor from '@/components/common/CodeEditor.vue'
import { ArrowLeft, Loader2, FileText, Copy, RotateCcw } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const loading = ref(false)
const detail = ref<ConfigHistoryInfo | null>(null)

const opTypeLabel = computed(() => {
  if (!detail.value) return '-'
  const map: Record<string, string> = { I: t('opInsert'), U: t('opUpdate'), D: t('opDelete') }
  return map[detail.value.opType] || detail.value.opType
})

const opTypeBadgeClass = computed(() => {
  if (!detail.value) return ''
  const map: Record<string, string> = {
    I: 'px-2.5 py-1 text-xs font-bold rounded-lg bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400',
    U: 'px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
    D: 'px-2.5 py-1 text-xs font-bold rounded-lg bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  }
  return (
    map[detail.value.opType] ||
    'px-2.5 py-1 text-xs font-bold rounded-lg bg-gray-50 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400'
  )
})

const publishTypeLabel = computed(() => {
  if (!detail.value) return '-'
  return detail.value.publishType === 'gray' ? t('publishTypeGray') : t('publishTypeFormal')
})

const publishTypeBadgeClass = computed(() => {
  if (!detail.value) return ''
  return detail.value.publishType === 'gray'
    ? 'px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
    : 'px-2.5 py-1 text-xs font-bold rounded-lg bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400'
})

const configType = computed(() => {
  if (!detail.value?.extInfo) return 'text'
  try {
    const ext = JSON.parse(detail.value.extInfo)
    return ext.type || 'text'
  } catch {
    return 'text'
  }
})

const formatTime = (ts: number | string) => {
  if (!ts) return '-'
  return new Date(ts).toLocaleString()
}

const goBack = () => {
  router.back()
}

const copyContent = async () => {
  if (!detail.value?.content) return
  try {
    await navigator.clipboard.writeText(detail.value.content)
    toast.success(t('copySuccess'))
  } catch {
    toast.error(t('copyFailed'))
  }
}

const handleRollback = () => {
  if (!detail.value) return
  router.push({
    path: '/config/rollback',
    query: {
      nid: String(detail.value.id),
      dataId: detail.value.dataId,
      groupName: detail.value.groupName,
      namespaceId: detail.value.namespaceId,
    },
  })
}

const fetchDetail = async () => {
  const nid = route.query.nid as string
  const dataId = route.query.dataId as string
  const groupName = route.query.groupName as string
  if (!nid || !dataId || !groupName) return

  loading.value = true
  try {
    const response = await batataApi.getConfigHistory(nid, dataId, groupName)
    detail.value = response.data.data
  } catch (err) {
    logger.error('Failed to fetch history detail:', err)
    toast.apiError(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDetail()
})
</script>
