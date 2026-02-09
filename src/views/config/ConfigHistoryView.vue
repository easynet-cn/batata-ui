<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button @click="goBack" class="btn btn-ghost btn-sm">
          <ArrowLeft class="w-3.5 h-3.5" />
        </button>
        <div>
          <h1 class="text-base font-semibold text-text-primary">{{ t('historyVersion') }}</h1>
          <p class="text-xs text-text-secondary mt-0.5">{{ route.query.dataId }}</p>
        </div>
      </div>
    </div>

    <!-- History List -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>{{ t('opType') }}</th>
              <th>{{ t('srcUser') }}</th>
              <th>{{ t('srcIp') }}</th>
              <th>{{ t('modifyTime') }}</th>
              <th class="w-48">{{ t('actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="6" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
              </td>
            </tr>
            <tr v-else-if="histories.length === 0">
              <td colspan="6" class="text-center py-6 text-text-secondary">
                {{ t('noData') }}
              </td>
            </tr>
            <tr v-for="item in histories" :key="item.id" class="hover:bg-bg-secondary">
              <td class="font-mono text-sm">{{ item.id }}</td>
              <td>
                <span :class="getOpTypeClass(item.opType)">{{ item.opType }}</span>
              </td>
              <td>{{ item.srcUser || '-' }}</td>
              <td class="font-mono text-sm">{{ item.srcIp || '-' }}</td>
              <td class="text-text-secondary text-sm">
                {{ item.lastModifiedTime }}
              </td>
              <td>
                <div class="flex items-center gap-1">
                  <button
                    @click="viewHistory(item)"
                    class="btn btn-ghost btn-sm"
                    :title="t('view')"
                  >
                    <Eye class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="compareHistory(item)"
                    class="btn btn-ghost btn-sm"
                    :title="t('compare')"
                  >
                    <GitCompare class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="rollbackHistory(item)"
                    class="btn btn-ghost btn-sm text-warning"
                    :title="t('rollback')"
                  >
                    <RotateCcw class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <AppPagination
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        @change="handlePageChange"
      />
    </div>

    <!-- View History Modal -->
    <ConfirmModal
      v-model="showViewModal"
      :title="t('historyDetail')"
      :confirm-text="t('close')"
      @confirm="showViewModal = false"
    >
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label class="block text-sm text-text-tertiary">{{ t('opType') }}</label>
            <p class="font-medium">{{ selectedHistory?.opType }}</p>
          </div>
          <div>
            <label class="block text-sm text-text-tertiary">{{ t('modifyTime') }}</label>
            <p class="font-medium">{{ selectedHistory?.lastModifiedTime }}</p>
          </div>
        </div>
        <div>
          <label class="block text-sm text-text-tertiary mb-1">{{ t('configContent') }}</label>
          <CodeEditor
            :model-value="selectedHistory?.content || ''"
            :language="configType"
            readonly
            min-height="200px"
          />
        </div>
      </div>
    </ConfirmModal>

    <!-- Compare Modal -->
    <ConfirmModal
      v-model="showCompareModal"
      :title="t('compareVersion')"
      :confirm-text="t('close')"
      @confirm="showCompareModal = false"
    >
      <div class="grid grid-cols-2 gap-3">
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="text-xs font-medium text-text-primary">{{ t('historyVersion') }}</label>
            <span class="text-xs text-text-tertiary">{{ selectedHistory?.lastModifiedTime }}</span>
          </div>
          <CodeEditor
            :model-value="selectedHistory?.content || ''"
            :language="configType"
            readonly
            min-height="200px"
          />
        </div>
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="text-xs font-medium text-text-primary">{{ t('currentVersion') }}</label>
            <span class="text-xs text-text-tertiary">{{ t('current') }}</span>
          </div>
          <CodeEditor
            :model-value="currentContent"
            :language="configType"
            readonly
            min-height="200px"
          />
        </div>
      </div>
    </ConfirmModal>

    <!-- Rollback Confirm Modal -->
    <ConfirmModal
      v-model="showRollbackModal"
      :title="t('confirmRollback')"
      :message="t('confirmRollbackDesc')"
      :confirm-text="t('rollback')"
      danger
      @confirm="confirmRollback"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Loader2, Eye, GitCompare, RotateCcw } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import CodeEditor from '@/components/common/CodeEditor.vue'
import type { ConfigHistoryInfo, ConfigType, Namespace } from '@/types'

const props = defineProps<{
  namespace: Namespace
}>()

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

// State
const loading = ref(false)
const histories = ref<ConfigHistoryInfo[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const currentContent = ref('')
const configType = ref<ConfigType>('text')

// Modals
const showViewModal = ref(false)
const showCompareModal = ref(false)
const showRollbackModal = ref(false)
const selectedHistory = ref<ConfigHistoryInfo | null>(null)

// Methods
const goBack = () => {
  router.back()
}

const fetchHistories = async () => {
  const { dataId, groupName, namespaceId } = route.query
  if (!dataId || !groupName) return

  loading.value = true
  try {
    const response = await batataApi.getConfigHistoryList({
      dataId: dataId as string,
      groupName: groupName as string,
      namespaceId: (namespaceId as string) || props.namespace.namespace,
      pageNo: currentPage.value,
      pageSize: pageSize.value,
    })
    histories.value = response.data.data.pageItems || []
    total.value = response.data.data.totalCount || 0
  } catch (error) {
    logger.error('Failed to fetch histories:', error)
    toast.error(t('operationFailed'))
  } finally {
    loading.value = false
  }
}

const fetchCurrentConfig = async () => {
  const { dataId, groupName, namespaceId } = route.query
  if (!dataId || !groupName) return

  try {
    const response = await batataApi.getConfig(
      dataId as string,
      groupName as string,
      (namespaceId as string) || props.namespace.namespace,
    )
    currentContent.value = response.data.data.content || ''
    configType.value = response.data.data.type || 'text'
  } catch (error) {
    logger.error('Failed to fetch current config:', error)
    toast.error(t('operationFailed'))
  }
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchHistories()
}

const getOpTypeClass = (opType: string) => {
  const classes: Record<string, string> = {
    I: 'badge badge-success',
    U: 'badge badge-info',
    D: 'badge badge-danger',
  }
  return classes[opType] || 'badge'
}

const viewHistory = async (item: ConfigHistoryInfo) => {
  selectedHistory.value = item
  if (!item.content) {
    try {
      const { dataId, groupName, namespaceId } = route.query
      const response = await batataApi.getConfigHistory(
        item.id,
        dataId as string,
        groupName as string,
        (namespaceId as string) || props.namespace.namespace,
      )
      selectedHistory.value = response.data.data
    } catch (error) {
      logger.error('Failed to fetch history detail:', error)
      toast.error(t('operationFailed'))
    }
  }
  showViewModal.value = true
}

const compareHistory = async (item: ConfigHistoryInfo) => {
  selectedHistory.value = item
  if (!item.content) {
    try {
      const { dataId, groupName, namespaceId } = route.query
      const response = await batataApi.getConfigHistory(
        item.id,
        dataId as string,
        groupName as string,
        (namespaceId as string) || props.namespace.namespace,
      )
      selectedHistory.value = response.data.data
    } catch (error) {
      logger.error('Failed to fetch history detail:', error)
      toast.error(t('operationFailed'))
    }
  }
  showCompareModal.value = true
}

const rollbackHistory = (item: ConfigHistoryInfo) => {
  selectedHistory.value = item
  showRollbackModal.value = true
}

const confirmRollback = async () => {
  if (!selectedHistory.value) return
  const { dataId, groupName, namespaceId } = route.query

  try {
    await batataApi.rollbackConfig(
      selectedHistory.value.id,
      dataId as string,
      groupName as string,
      (namespaceId as string) || props.namespace.namespace,
    )
    showRollbackModal.value = false
    fetchHistories()
    fetchCurrentConfig()
  } catch (error) {
    logger.error('Failed to rollback:', error)
    toast.error(t('operationFailed'))
  }
}

// Lifecycle
onMounted(() => {
  fetchHistories()
  fetchCurrentConfig()
})
</script>
