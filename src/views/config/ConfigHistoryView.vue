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
      <div class="flex items-center justify-between p-4 border-t border-border">
        <div class="text-sm text-text-secondary">
          {{ t('total') }}: {{ total }} {{ t('items') }}
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="handlePageChange(currentPage - 1)"
            :disabled="currentPage <= 1"
            class="btn btn-secondary btn-sm"
          >
            <ChevronLeft class="w-3.5 h-3.5" />
          </button>
          <span class="text-sm text-text-primary px-3"> {{ currentPage }} / {{ totalPages }} </span>
          <button
            @click="handlePageChange(currentPage + 1)"
            :disabled="currentPage >= totalPages"
            class="btn btn-secondary btn-sm"
          >
            <ChevronRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- View History Modal -->
    <div v-if="showViewModal" class="modal-backdrop" @click="showViewModal = false">
      <div class="modal max-w-4xl" @click.stop>
        <div class="modal-header">
          <h3 class="text-sm font-semibold text-text-primary">{{ t('historyDetail') }}</h3>
          <button @click="showViewModal = false" class="btn btn-ghost btn-sm">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
        <div class="modal-body">
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
            <pre class="bg-bg-tertiary rounded-lg p-4 overflow-x-auto text-sm font-mono max-h-96">{{
              selectedHistory?.content
            }}</pre>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showViewModal = false" class="btn btn-secondary">
            {{ t('close') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Compare Modal -->
    <div v-if="showCompareModal" class="modal-backdrop" @click="showCompareModal = false">
      <div class="modal max-w-6xl" @click.stop>
        <div class="modal-header">
          <h3 class="text-sm font-semibold text-text-primary">{{ t('compareVersion') }}</h3>
          <button @click="showCompareModal = false" class="btn btn-ghost btn-sm">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
        <div class="modal-body">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="text-xs font-medium text-text-primary">{{
                  t('historyVersion')
                }}</label>
                <span class="text-xs text-text-tertiary">{{
                  selectedHistory?.lastModifiedTime
                }}</span>
              </div>
              <pre
                class="bg-bg-tertiary rounded-lg p-4 overflow-x-auto text-sm font-mono max-h-96"
                >{{ selectedHistory?.content }}</pre
              >
            </div>
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="text-xs font-medium text-text-primary">{{
                  t('currentVersion')
                }}</label>
                <span class="text-xs text-text-tertiary">{{ t('current') }}</span>
              </div>
              <pre
                class="bg-bg-tertiary rounded-lg p-4 overflow-x-auto text-sm font-mono max-h-96"
                >{{ currentContent }}</pre
              >
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showCompareModal = false" class="btn btn-secondary">
            {{ t('close') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Rollback Confirm Modal -->
    <div v-if="showRollbackModal" class="modal-backdrop" @click="showRollbackModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3 class="text-sm font-semibold text-text-primary">{{ t('confirmRollback') }}</h3>
          <button @click="showRollbackModal = false" class="btn btn-ghost btn-sm">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
        <div class="modal-body">
          <p class="text-text-secondary">
            {{ t('confirmRollbackDesc') }}
          </p>
        </div>
        <div class="modal-footer">
          <button @click="showRollbackModal = false" class="btn btn-secondary">
            {{ t('cancel') }}
          </button>
          <button @click="confirmRollback" class="btn btn-warning">
            {{ t('rollback') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Loader2,
  Eye,
  GitCompare,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import type { ConfigHistoryInfo, Namespace } from '@/types'

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

// Modals
const showViewModal = ref(false)
const showCompareModal = ref(false)
const showRollbackModal = ref(false)
const selectedHistory = ref<ConfigHistoryInfo | null>(null)

// Computed
const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1)

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
    console.error('Failed to fetch histories:', error)
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
  } catch (error) {
    console.error('Failed to fetch current config:', error)
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
      console.error('Failed to fetch history detail:', error)
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
      console.error('Failed to fetch history detail:', error)
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
    console.error('Failed to rollback:', error)
  }
}

// Lifecycle
onMounted(() => {
  fetchHistories()
  fetchCurrentConfig()
})
</script>
