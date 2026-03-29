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
          {{ t('configRollback') }}
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
      <!-- Warning Banner -->
      <div :class="warningBannerClass">
        <div class="flex items-start gap-3">
          <AlertTriangle :size="20" class="shrink-0 mt-0.5" />
          <div>
            <p class="font-bold text-sm">{{ t('rollbackWarning') }}</p>
            <p class="text-sm mt-1">{{ rollbackWarningDetail }}</p>
          </div>
        </div>
      </div>

      <!-- Metadata Card -->
      <div
        class="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
      >
        <h2 class="text-base font-bold text-gray-900 dark:text-white mb-4">
          {{ t('historyDetail') }}
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p
              class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1"
            >
              {{ t('dataId') }}
            </p>
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ detail.dataId }}</p>
          </div>
          <div>
            <p
              class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1"
            >
              {{ t('group') }}
            </p>
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
              {{ detail.groupName }}
            </p>
          </div>
          <div>
            <p
              class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1"
            >
              {{ t('operationType') }}
            </p>
            <span :class="opTypeBadgeClass">{{ opTypeLabel }}</span>
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
        </div>
      </div>

      <!-- Content Preview -->
      <div
        class="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
      >
        <h2 class="text-base font-bold text-gray-900 dark:text-white mb-4">{{ t('content') }}</h2>
        <CodeEditor
          :model-value="detail.content || ''"
          :language="configType"
          :readonly="true"
          class="min-h-[300px]"
        />
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center justify-end gap-3">
        <button
          @click="goBack"
          class="px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          {{ t('cancel') }}
        </button>
        <button
          @click="showConfirmModal = true"
          :disabled="rolling"
          class="px-5 py-2 bg-amber-600 text-white text-sm font-bold rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50"
        >
          <RotateCcw :size="14" class="inline mr-1" />
          {{ t('confirmRollback') }}
        </button>
      </div>
    </template>

    <!-- Not found -->
    <div
      v-else
      class="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
    >
      <p class="text-center text-gray-500 dark:text-gray-400 py-12">{{ t('noData') }}</p>
    </div>

    <!-- Confirm Modal -->
    <ConfirmModal
      v-model="showConfirmModal"
      :title="t('confirmRollback')"
      :message="rollbackWarningDetail"
      :confirm-text="t('confirmRollback')"
      danger
      @confirm="executeRollback"
    />
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
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { ArrowLeft, Loader2, AlertTriangle, RotateCcw } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const loading = ref(false)
const rolling = ref(false)
const showConfirmModal = ref(false)
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

const rollbackWarningDetail = computed(() => {
  if (!detail.value) return ''
  const warnings: Record<string, string> = {
    I: 'Rolling back an insert will delete this configuration.',
    U: 'Rolling back will restore the configuration to this historical version.',
    D: 'Rolling back a delete will re-create this configuration with historical content.',
  }
  return warnings[detail.value.opType] || 'This operation will rollback the configuration.'
})

const warningBannerClass = computed(() => {
  if (!detail.value) return ''
  const base = 'p-4 rounded-2xl border'
  switch (detail.value.opType) {
    case 'I':
      return `${base} bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-900 dark:text-red-300`
    case 'D':
      return `${base} bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-300`
    default:
      return `${base} bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-300`
  }
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

const goBack = () => {
  router.back()
}

const extractExtInfo = (extInfo: string | undefined): Record<string, string> => {
  if (!extInfo) return {}
  try {
    return JSON.parse(extInfo)
  } catch {
    return {}
  }
}

const executeRollback = async () => {
  if (!detail.value) return
  rolling.value = true
  try {
    if (detail.value.opType === 'I') {
      // Rolling back an insert means deleting the config
      await batataApi.deleteConfig(
        detail.value.dataId,
        detail.value.groupName,
        detail.value.namespaceId,
      )
    } else {
      // Rolling back an update or delete means restoring the content
      const extInfo = extractExtInfo(detail.value.extInfo)
      await batataApi.publishConfig({
        dataId: detail.value.dataId,
        groupName: detail.value.groupName,
        content: detail.value.content || '',
        namespaceId: detail.value.namespaceId,
        type: extInfo.type || configType.value,
        desc: extInfo.description,
        configTags: extInfo.config_tags,
      })
    }
    toast.success(t('rollbackSuccess'))
    router.push('/configs')
  } catch (err) {
    logger.error('Failed to rollback config:', err)
    toast.apiError(err)
  } finally {
    rolling.value = false
    showConfirmModal.value = false
  }
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
