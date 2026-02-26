<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button v-if="isLinkedMode" @click="goBack" class="btn btn-ghost btn-sm">
          <ArrowLeft class="w-3.5 h-3.5" />
        </button>
        <div>
          <h1 class="text-base font-semibold text-text-primary">{{ t('historyVersion') }}</h1>
          <p v-if="isLinkedMode" class="text-xs text-text-secondary mt-0.5">
            {{ route.query.dataId }}
          </p>
          <p v-if="retentionDays > 0" class="text-xs text-text-tertiary mt-0.5">
            {{ t('historyRetentionHint').replace('{days}', String(retentionDays)) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Search Form (standalone mode or always visible) -->
    <div class="card">
      <div class="p-3">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div>
            <label class="block text-xs font-medium text-text-secondary mb-1">{{
              t('dataId')
            }}</label>
            <select v-model="selectedDataId" class="input" :disabled="isLinkedMode">
              <option value="">{{ t('selectDataId') }}</option>
              <option v-for="item in dataIdOptions" :key="item" :value="item">{{ item }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-text-secondary mb-1">{{
              t('group')
            }}</label>
            <select v-model="selectedGroup" class="input" :disabled="isLinkedMode">
              <option value="">{{ t('selectGroup') }}</option>
              <option v-for="item in groupOptions" :key="item" :value="item">{{ item }}</option>
            </select>
          </div>
          <div class="flex items-end">
            <button
              @click="handleSearch"
              class="btn btn-primary"
              :disabled="!selectedDataId || !selectedGroup"
            >
              <Search class="w-3.5 h-3.5" />
              {{ t('queryHistory') }}
            </button>
          </div>
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
              <th>{{ t('publishType') }}</th>
              <th>{{ t('srcUser') }}</th>
              <th>{{ t('srcIp') }}</th>
              <th>{{ t('modifyTime') }}</th>
              <th class="w-48">{{ t('actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
              </td>
            </tr>
            <tr v-else-if="histories.length === 0">
              <td colspan="7" class="text-center py-6 text-text-secondary">
                {{ t('noData') }}
              </td>
            </tr>
            <tr v-for="item in histories" :key="item.id" class="hover:bg-bg-secondary">
              <td class="font-mono text-sm">{{ item.id }}</td>
              <td>
                <span :class="getOpTypeClass(item.opType)">{{ getOpTypeLabel(item.opType) }}</span>
              </td>
              <td>
                <span :class="getPublishTypeClass(item.publishType)">{{
                  getPublishTypeLabel(item.publishType)
                }}</span>
                <span v-if="item.grayName" class="ml-1 text-text-tertiary text-xs"
                  >({{ item.grayName }})</span
                >
              </td>
              <td>{{ item.srcUser || '-' }}</td>
              <td class="font-mono text-sm">{{ item.srcIp || '-' }}</td>
              <td class="text-text-secondary text-sm">
                {{ formatTimestamp(item.modifyTime) }}
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
                    @click="handleRollback(item)"
                    class="btn btn-ghost btn-sm text-warning"
                    :disabled="isGrayPublish(item)"
                    :title="isGrayPublish(item) ? t('grayRollbackDisabled') : t('rollback')"
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
    <Teleport to="body">
      <div v-if="showViewModal" class="modal-backdrop" @click="showViewModal = false">
        <div class="modal !max-w-3xl" @click.stop>
          <div class="modal-header">
            <h3 class="text-sm font-semibold text-text-primary">{{ t('historyDetail') }}</h3>
            <button @click="showViewModal = false" class="btn btn-ghost btn-sm">
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
          <div class="modal-body space-y-4">
            <!-- Info Grid -->
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-xs text-text-tertiary mb-0.5">{{ t('namespace') }}</label>
                <p class="text-sm font-medium text-text-primary truncate">
                  {{ selectedHistory?.namespaceId || '-' }}
                </p>
              </div>
              <div>
                <label class="block text-xs text-text-tertiary mb-0.5">{{ t('dataId') }}</label>
                <p class="text-sm font-medium text-text-primary truncate">
                  {{ selectedHistory?.dataId || activeDataId }}
                </p>
              </div>
              <div>
                <label class="block text-xs text-text-tertiary mb-0.5">{{ t('group') }}</label>
                <p class="text-sm font-medium text-text-primary truncate">
                  {{ selectedHistory?.groupName || activeGroupName }}
                </p>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-xs text-text-tertiary mb-0.5">{{ t('appName') }}</label>
                <p class="text-sm font-medium text-text-primary">
                  {{ selectedHistory?.appName || '-' }}
                </p>
              </div>
              <div>
                <label class="block text-xs text-text-tertiary mb-0.5">{{
                  t('publishType')
                }}</label>
                <span
                  v-if="selectedHistory"
                  :class="getPublishTypeClass(selectedHistory.publishType)"
                  >{{ getPublishTypeLabel(selectedHistory.publishType) }}</span
                >
              </div>
              <div>
                <label class="block text-xs text-text-tertiary mb-0.5">{{ t('grayName') }}</label>
                <p class="text-sm font-medium text-text-primary">
                  {{ selectedHistory?.grayName || '-' }}
                </p>
              </div>
            </div>
            <div
              v-if="parseGrayRule(selectedHistory?.extInfo)"
              class="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg"
            >
              <label class="block text-xs text-text-tertiary mb-0.5">{{ t('grayRule') }}</label>
              <p class="text-sm font-mono text-text-primary break-all">
                {{ parseGrayRule(selectedHistory?.extInfo) }}
              </p>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-xs text-text-tertiary mb-0.5">{{ t('srcUser') }}</label>
                <p class="text-sm font-medium text-text-primary">
                  {{ selectedHistory?.srcUser || '-' }}
                </p>
              </div>
              <div>
                <label class="block text-xs text-text-tertiary mb-0.5">{{ t('srcIp') }}</label>
                <p class="text-sm font-medium font-mono text-text-primary">
                  {{ selectedHistory?.srcIp || '-' }}
                </p>
              </div>
              <div>
                <label class="block text-xs text-text-tertiary mb-0.5">{{ t('opType') }}</label>
                <span v-if="selectedHistory" :class="getOpTypeClass(selectedHistory.opType)">{{
                  getOpTypeLabel(selectedHistory.opType)
                }}</span>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-text-tertiary mb-0.5">MD5</label>
                <p class="text-sm font-medium font-mono text-text-primary truncate">
                  {{ selectedHistory?.md5 || '-' }}
                </p>
              </div>
              <div>
                <label class="block text-xs text-text-tertiary mb-0.5">{{ t('modifyTime') }}</label>
                <p class="text-sm font-medium text-text-primary">
                  {{ formatTimestamp(selectedHistory?.modifyTime) }}
                </p>
              </div>
            </div>
            <!-- Config Content -->
            <div>
              <label class="block text-xs text-text-tertiary mb-1">{{ t('configContent') }}</label>
              <CodeEditor
                :model-value="selectedHistory?.content || ''"
                :language="configType"
                readonly
                min-height="200px"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button @click="showViewModal = false" class="btn btn-primary">{{ t('close') }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Compare Modal -->
    <Teleport to="body">
      <div v-if="showCompareModal" class="modal-backdrop" @click="showCompareModal = false">
        <div class="modal !max-w-4xl" @click.stop>
          <div class="modal-header">
            <h3 class="text-sm font-semibold text-text-primary">{{ t('compareVersion') }}</h3>
            <button @click="showCompareModal = false" class="btn btn-ghost btn-sm">
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
          <div class="modal-body">
            <div class="flex items-center gap-4 mb-2">
              <div class="flex items-center gap-2">
                <span class="badge badge-success text-[10px]">{{ t('currentVersion') }}</span>
                <span class="text-xs text-text-tertiary">{{ t('current') }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="badge badge-info text-[10px]">{{ t('selectedVersion') }}</span>
                <span class="text-xs text-text-tertiary">{{
                  formatTimestamp(selectedHistory?.modifyTime)
                }}</span>
              </div>
            </div>
            <DiffEditor
              :original="currentContent"
              :modified="selectedHistory?.content || ''"
              :language="configType"
              min-height="350px"
            />
          </div>
          <div class="modal-footer">
            <button @click="showCompareModal = false" class="btn btn-primary">
              {{ t('close') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
    <!-- Rollback Confirm Modal -->
    <ConfirmModal
      v-model="showRollbackModal"
      :title="t('rollbackPreview')"
      :confirm-text="t('rollback')"
      :loading="rollbackLoading"
      danger
      @confirm="confirmRollback"
    >
      <div class="space-y-3">
        <p class="text-xs text-text-secondary">
          {{ t('confirmRollback') }}
          <span class="font-mono font-bold">#{{ historyToRollback?.id }}</span>
        </p>
        <p class="text-xs text-text-tertiary">{{ t('confirmRollbackDesc') }}</p>
        <div>
          <label class="block text-xs text-text-tertiary mb-1">{{ t('configContent') }}</label>
          <CodeEditor
            :model-value="rollbackContent"
            :language="configType"
            readonly
            min-height="200px"
          />
        </div>
      </div>
    </ConfirmModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Loader2, Eye, GitCompare, RotateCcw, Search, X } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import CodeEditor from '@/components/common/CodeEditor.vue'
import DiffEditor from '@/components/common/DiffEditor.vue'
import type { ConfigBasicInfo, ConfigHistoryInfo, ConfigType, Namespace } from '@/types'

const props = defineProps<{
  namespace: Namespace
}>()

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

// Linked mode: navigated from config list with query params
const isLinkedMode = computed(() => !!(route.query.dataId && route.query.groupName))

// History retention days
const retentionDays = ref(0)

const fetchRetentionDays = async () => {
  try {
    const response = await batataApi.getServerState()
    const days = response.data?.config_retention_days
    if (days) {
      retentionDays.value = parseInt(String(days), 10) || 30
    } else {
      retentionDays.value = 30
    }
  } catch {
    retentionDays.value = 30
  }
}

// Parse gray rule from extInfo JSON
const parseGrayRule = (extInfo?: string): string => {
  if (!extInfo) return ''
  try {
    const parsed = JSON.parse(extInfo)
    return parsed.gray_rule || parsed.grayRule || ''
  } catch {
    return ''
  }
}

// State
const loading = ref(false)
const histories = ref<ConfigHistoryInfo[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const currentContent = ref('')
const configType = ref<ConfigType>('text')

// Search state
const historyConfigs = ref<ConfigBasicInfo[]>([])
const selectedDataId = ref('')
const selectedGroup = ref('')

const dataIdOptions = computed(() => {
  const ids = new Set(historyConfigs.value.map((c) => c.dataId))
  return Array.from(ids).sort()
})

const groupOptions = computed(() => {
  if (!selectedDataId.value) {
    const groups = new Set(historyConfigs.value.map((c) => c.groupName))
    return Array.from(groups).sort()
  }
  const groups = new Set(
    historyConfigs.value.filter((c) => c.dataId === selectedDataId.value).map((c) => c.groupName),
  )
  return Array.from(groups).sort()
})

// Modals
const showViewModal = ref(false)
const showCompareModal = ref(false)
const selectedHistory = ref<ConfigHistoryInfo | null>(null)

// Methods
const goBack = () => {
  router.back()
}

// Active dataId and groupName used for API calls
const activeDataId = computed(() =>
  isLinkedMode.value ? (route.query.dataId as string) : selectedDataId.value,
)
const activeGroupName = computed(() =>
  isLinkedMode.value ? (route.query.groupName as string) : selectedGroup.value,
)
const activeNamespaceId = computed(
  () => (route.query.namespaceId as string) || props.namespace.namespace,
)

const fetchHistories = async () => {
  if (!activeDataId.value || !activeGroupName.value) return

  loading.value = true
  try {
    const response = await batataApi.getConfigHistoryList({
      dataId: activeDataId.value,
      groupName: activeGroupName.value,
      namespaceId: activeNamespaceId.value,
      pageNo: currentPage.value,
      pageSize: pageSize.value,
    })
    histories.value = response.data.data.pageItems || []
    total.value = response.data.data.totalCount || 0
  } catch (error) {
    logger.error('Failed to fetch histories:', error)
    toast.apiError(error)
  } finally {
    loading.value = false
  }
}

const fetchCurrentConfig = async () => {
  if (!activeDataId.value || !activeGroupName.value) return

  try {
    const response = await batataApi.getConfig(
      activeDataId.value,
      activeGroupName.value,
      activeNamespaceId.value,
    )
    currentContent.value = response.data.data.content || ''
    configType.value = response.data.data.type || 'text'
  } catch (error) {
    logger.error('Failed to fetch current config:', error)
    toast.apiError(error)
  }
}

const fetchHistoryConfigs = async () => {
  try {
    const response = await batataApi.getHistoryConfigs(props.namespace.namespace)
    historyConfigs.value = response.data.data || []
  } catch (error) {
    logger.error('Failed to fetch history configs:', error)
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchHistories()
  fetchCurrentConfig()
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

const getOpTypeLabel = (opType: string) => {
  const labels: Record<string, string> = {
    I: t('opTypeInsert'),
    U: t('opTypeUpdate'),
    D: t('opTypeDelete'),
  }
  return labels[opType] || opType
}

const getPublishTypeLabel = (publishType: string) => {
  return publishType === 'gray' ? t('publishTypeGray') : t('publishTypeFormal')
}

const getPublishTypeClass = (publishType: string) => {
  return publishType === 'gray' ? 'badge badge-warning' : 'badge badge-info'
}

const isGrayPublish = (item: ConfigHistoryInfo) => {
  return item.publishType === 'gray'
}

const viewHistory = async (item: ConfigHistoryInfo) => {
  selectedHistory.value = item
  if (!item.content) {
    try {
      const response = await batataApi.getConfigHistory(
        item.id,
        activeDataId.value,
        activeGroupName.value,
        activeNamespaceId.value,
      )
      selectedHistory.value = response.data.data
    } catch (error) {
      logger.error('Failed to fetch history detail:', error)
      toast.apiError(error)
    }
  }
  showViewModal.value = true
}

const compareHistory = async (item: ConfigHistoryInfo) => {
  selectedHistory.value = item

  try {
    // Fetch selected version detail if needed
    if (!item.content) {
      const response = await batataApi.getConfigHistory(
        item.id,
        activeDataId.value,
        activeGroupName.value,
        activeNamespaceId.value,
      )
      selectedHistory.value = response.data.data
    }

    // Ensure current config is loaded for comparison
    if (!currentContent.value) {
      await fetchCurrentConfig()
    }
  } catch (error) {
    logger.error('Failed to fetch history for compare:', error)
  }
  showCompareModal.value = true
}

// Rollback
const showRollbackModal = ref(false)
const historyToRollback = ref<ConfigHistoryInfo | null>(null)
const rollbackContent = ref('')
const rollbackLoading = ref(false)

const handleRollback = async (item: ConfigHistoryInfo) => {
  historyToRollback.value = item
  rollbackContent.value = ''

  // Fetch content for preview
  try {
    if (item.content) {
      rollbackContent.value = item.content
    } else {
      const response = await batataApi.getConfigHistory(
        item.id,
        activeDataId.value,
        activeGroupName.value,
        activeNamespaceId.value,
      )
      rollbackContent.value = response.data.data.content || ''
    }
  } catch (error) {
    logger.error('Failed to fetch rollback content:', error)
  }
  showRollbackModal.value = true
}

const confirmRollback = async () => {
  if (!historyToRollback.value) return
  rollbackLoading.value = true
  try {
    await batataApi.rollbackConfig(
      historyToRollback.value.id,
      activeDataId.value,
      activeGroupName.value,
      activeNamespaceId.value,
    )
    showRollbackModal.value = false
    fetchHistories()
    fetchCurrentConfig()
  } catch (error) {
    logger.error('Failed to rollback config:', error)
    toast.apiError(error)
  } finally {
    rollbackLoading.value = false
  }
}

// When selectedDataId changes, auto-select group if only one option
watch(selectedDataId, () => {
  if (groupOptions.value.length === 1 && groupOptions.value[0]) {
    selectedGroup.value = groupOptions.value[0]
  } else if (!groupOptions.value.includes(selectedGroup.value)) {
    selectedGroup.value = ''
  }
})

// Lifecycle
onMounted(() => {
  if (isLinkedMode.value) {
    // Linked mode: pre-fill from query params and auto-fetch
    selectedDataId.value = route.query.dataId as string
    selectedGroup.value = route.query.groupName as string
    fetchHistories()
    fetchCurrentConfig()
  }
  // Always fetch history configs for the dropdown
  fetchHistoryConfigs()
  fetchRetentionDays()
})
</script>
