<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div>
      <h1 class="text-base font-semibold text-text-primary">{{ t('listeningQuery') }}</h1>
      <p class="text-xs text-text-secondary mt-0.5">{{ t('listeningQueryDesc') }}</p>
    </div>

    <!-- Query Mode Tabs -->
    <div class="card">
      <div class="p-3 space-y-3">
        <div class="flex items-center gap-2 border-b border-border pb-2">
          <button
            @click="queryMode = 'config'"
            :class="[
              'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
              queryMode === 'config'
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:bg-bg-secondary',
            ]"
          >
            {{ t('queryByConfig') }}
          </button>
          <button
            @click="queryMode = 'ip'"
            :class="[
              'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
              queryMode === 'ip'
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:bg-bg-secondary',
            ]"
          >
            {{ t('queryByIp') }}
          </button>
        </div>

        <!-- Config Mode Search -->
        <div v-if="queryMode === 'config'" class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label class="block text-xs font-medium text-text-secondary mb-1">{{
              t('dataId')
            }}</label>
            <input
              v-model="searchParams.dataId"
              type="text"
              class="input"
              :placeholder="t('dataId')"
              @keyup.enter="handleSearch"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-text-secondary mb-1">{{
              t('group')
            }}</label>
            <input
              v-model="searchParams.groupName"
              type="text"
              class="input"
              :placeholder="t('group')"
              @keyup.enter="handleSearch"
            />
          </div>
          <div class="md:col-span-2 flex items-end gap-2">
            <button @click="handleSearch" class="btn btn-primary">
              <Search class="w-3.5 h-3.5" />
              {{ t('search') }}
            </button>
            <button @click="handleReset" class="btn btn-secondary">
              <RotateCcw class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- IP Mode Search -->
        <div v-else class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div class="md:col-span-2">
            <label class="block text-xs font-medium text-text-secondary mb-1">{{
              t('clientIp')
            }}</label>
            <input
              v-model="searchParams.ip"
              type="text"
              class="input"
              :placeholder="t('clientIpPlaceholder')"
              @keyup.enter="handleSearch"
            />
          </div>
          <div class="md:col-span-2 flex items-end gap-2">
            <button @click="handleSearch" class="btn btn-primary">
              <Search class="w-3.5 h-3.5" />
              {{ t('search') }}
            </button>
            <button @click="handleReset" class="btn btn-secondary">
              <RotateCcw class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Config Mode: Listener List -->
    <div v-if="queryMode === 'config'" class="card">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('dataId') }}</th>
              <th>{{ t('group') }}</th>
              <th>{{ t('md5') }}</th>
              <th>{{ t('listeningIp') }}</th>
              <th>{{ t('status') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="5" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
              </td>
            </tr>
            <tr v-else-if="listeners.length === 0">
              <td colspan="5" class="text-center py-6 text-text-secondary">
                {{ t('noData') }}
              </td>
            </tr>
            <tr v-for="(item, index) in listeners" :key="index" class="hover:bg-bg-secondary">
              <td class="font-medium">{{ item.dataId }}</td>
              <td>{{ item.groupName }}</td>
              <td class="font-mono text-sm text-text-secondary">{{ item.md5 }}</td>
              <td class="font-mono text-sm">{{ item.listeningIp || '-' }}</td>
              <td>
                <span :class="getStatusClass(item.lisentersGroupkeyStatus)">
                  {{ item.lisentersGroupkeyStatus }}
                </span>
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

    <!-- IP Mode: Listener Status Map -->
    <div v-else class="card">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('dataId') }} (Group)</th>
              <th>MD5</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="2" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
              </td>
            </tr>
            <tr v-else-if="ipListenerEntries.length === 0">
              <td colspan="2" class="text-center py-6 text-text-secondary">
                {{ t('noData') }}
              </td>
            </tr>
            <tr
              v-for="(entry, index) in ipListenerEntries"
              :key="index"
              class="hover:bg-bg-secondary"
            >
              <td class="font-medium">{{ entry.key }}</td>
              <td class="font-mono text-sm text-text-secondary">{{ entry.md5 }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Search, RotateCcw, Loader2, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import { logger } from '@/utils/logger'
import type { ConfigListenerInfo, Namespace } from '@/types'

const props = defineProps<{
  namespace: Namespace
}>()

const { t } = useI18n()

// State
const loading = ref(false)
const queryMode = ref<'config' | 'ip'>('config')
const listeners = ref<ConfigListenerInfo[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// IP mode state
const ipListenerEntries = ref<Array<{ key: string; md5: string }>>([])

const searchParams = reactive({
  dataId: '',
  groupName: '',
  ip: '',
})

// Computed
const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1)

// Methods
const fetchListeners = async () => {
  loading.value = true
  try {
    if (queryMode.value === 'ip' && searchParams.ip) {
      // Query by IP mode
      const response = await batataApi.getConfigListenersByIp({
        ip: searchParams.ip,
        namespaceId: props.namespace.namespace,
      })
      const data = response.data.data
      // Convert listeners_status map to entries
      if (data && data.listenersStatus) {
        ipListenerEntries.value = Object.entries(data.listenersStatus).map(([key, md5]) => ({
          key,
          md5: md5 as string,
        }))
      } else {
        ipListenerEntries.value = []
      }
    } else {
      // Query by config mode
      const response = await batataApi.getConfigListeners({
        dataId: searchParams.dataId,
        groupName: searchParams.groupName,
        namespaceId: props.namespace.namespace,
        pageNo: currentPage.value,
        pageSize: pageSize.value,
      })
      listeners.value = response.data.data.pageItems || []
      total.value = response.data.data.totalCount || 0
    }
  } catch (error) {
    logger.error('Failed to fetch listeners:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchListeners()
}

const handleReset = () => {
  Object.assign(searchParams, {
    dataId: '',
    groupName: '',
    ip: '',
  })
  ipListenerEntries.value = []
  listeners.value = []
  total.value = 0
  handleSearch()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchListeners()
}

const getStatusClass = (status: string) => {
  if (status === 'SUCCESS' || status === 'OK') {
    return 'badge badge-success'
  }
  return 'badge badge-warning'
}

// Lifecycle
onMounted(() => {
  fetchListeners()
})
</script>
