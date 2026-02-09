<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('tracing') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('tracingDesc') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="fetchTraces" class="btn btn-secondary" :disabled="loading">
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
          {{ t('refresh') }}
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="card">
      <div class="p-3">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-2">
          <div>
            <label class="block text-xs font-medium text-text-secondary mb-1">{{
              t('serviceName')
            }}</label>
            <select v-model="filters.serviceName" class="input">
              <option value="">{{ t('all') }}</option>
              <option v-for="service in services" :key="service" :value="service">
                {{ service }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-text-secondary mb-1">{{
              t('operationName')
            }}</label>
            <input
              v-model="filters.operationName"
              type="text"
              class="input"
              :placeholder="t('operationNamePlaceholder')"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-text-secondary mb-1">{{
              t('traceId')
            }}</label>
            <input
              v-model="filters.traceId"
              type="text"
              class="input"
              :placeholder="t('traceIdPlaceholder')"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-text-secondary mb-1">{{
              t('timeRange')
            }}</label>
            <select v-model="filters.timeRange" class="input">
              <option value="15m">{{ t('last15Minutes') }}</option>
              <option value="1h">{{ t('lastHour') }}</option>
              <option value="6h">{{ t('last6Hours') }}</option>
              <option value="24h">{{ t('last24Hours') }}</option>
            </select>
          </div>
          <div class="flex items-end gap-1.5">
            <button @click="handleSearch" class="btn btn-primary flex-1">
              <Search class="w-3.5 h-3.5" />
              {{ t('search') }}
            </button>
            <button @click="handleReset" class="btn btn-secondary">
              <RotateCcw class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Advanced Filters -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-2 mt-3 pt-3 border-t border-border">
          <div>
            <label class="block text-xs font-medium text-text-secondary mb-1">{{
              t('minDuration')
            }}</label>
            <div class="flex items-center gap-1">
              <input
                v-model.number="filters.minDuration"
                type="number"
                class="input"
                placeholder="0"
                min="0"
              />
              <span class="text-xs text-text-secondary">ms</span>
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-text-secondary mb-1">{{
              t('maxDuration')
            }}</label>
            <div class="flex items-center gap-1">
              <input
                v-model.number="filters.maxDuration"
                type="number"
                class="input"
                placeholder="∞"
                min="0"
              />
              <span class="text-xs text-text-secondary">ms</span>
            </div>
          </div>
          <div class="flex items-center gap-4 md:col-span-2">
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                v-model="filters.errorsOnly"
                class="w-3.5 h-3.5 text-red-600 rounded"
              />
              <span class="text-xs text-text-primary">{{ t('errorsOnly') }}</span>
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                v-model="filters.rootSpansOnly"
                class="w-3.5 h-3.5 text-primary rounded"
              />
              <span class="text-xs text-text-primary">{{ t('rootSpansOnly') }}</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Trace List -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('traceId') }}</th>
              <th>{{ t('rootService') }}</th>
              <th>{{ t('rootOperation') }}</th>
              <th>{{ t('spanCount') }}</th>
              <th>{{ t('duration') }}</th>
              <th>{{ t('startTime') }}</th>
              <th>{{ t('status') }}</th>
              <th class="w-20">{{ t('actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="8" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
              </td>
            </tr>
            <tr v-else-if="traces.length === 0">
              <td colspan="8" class="text-center py-6 text-text-secondary">
                {{ t('noData') }}
              </td>
            </tr>
            <tr v-for="trace in traces" :key="trace.traceId" class="hover:bg-bg-secondary">
              <td class="font-mono text-xs">
                <span
                  class="text-primary cursor-pointer hover:underline"
                  @click="showTraceDetail(trace)"
                >
                  {{ trace.traceId.substring(0, 16) }}...
                </span>
              </td>
              <td>
                <span class="badge badge-info">{{ trace.rootService }}</span>
              </td>
              <td class="max-w-[200px] truncate" :title="trace.rootOperation">
                {{ trace.rootOperation }}
              </td>
              <td>{{ trace.spanCount }}</td>
              <td>
                <span
                  class="font-mono text-xs px-1.5 py-0.5 rounded"
                  :class="getDurationClass(trace.duration)"
                >
                  {{ formatDuration(trace.duration) }}
                </span>
              </td>
              <td class="text-text-secondary whitespace-nowrap">
                {{ formatTime(trace.startTime) }}
              </td>
              <td>
                <span
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                  :class="
                    trace.hasError
                      ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                  "
                >
                  <XCircle v-if="trace.hasError" class="w-3 h-3" />
                  <CheckCircle v-else class="w-3 h-3" />
                  {{ trace.hasError ? t('error') : t('success') }}
                </span>
              </td>
              <td>
                <button
                  @click="showTraceDetail(trace)"
                  class="btn btn-ghost btn-sm"
                  :title="t('viewDetails')"
                >
                  <Eye class="w-3.5 h-3.5" />
                </button>
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

    <!-- Trace Detail Modal -->
    <ConfirmModal
      v-model="showDetailModal"
      :title="t('traceDetail')"
      :confirm-text="t('close')"
      @confirm="showDetailModal = false"
    >
      <template v-if="selectedTrace">
        <p class="text-xs text-text-secondary font-mono mb-3">
          {{ selectedTrace.traceId }}
        </p>

        <!-- Trace Summary -->
        <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
          <div class="grid grid-cols-4 gap-4">
            <div>
              <p class="text-xs text-text-secondary">{{ t('duration') }}</p>
              <p class="text-sm font-semibold text-text-primary">
                {{ formatDuration(selectedTrace.duration) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-text-secondary">{{ t('spanCount') }}</p>
              <p class="text-sm font-semibold text-text-primary">{{ selectedTrace.spanCount }}</p>
            </div>
            <div>
              <p class="text-xs text-text-secondary">{{ t('servicesInvolved') }}</p>
              <p class="text-sm font-semibold text-text-primary">
                {{ getUniqueServices(selectedTrace.spans).length }}
              </p>
            </div>
            <div>
              <p class="text-xs text-text-secondary">{{ t('status') }}</p>
              <span
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                :class="
                  selectedTrace.hasError
                    ? 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                "
              >
                {{ selectedTrace.hasError ? t('error') : t('success') }}
              </span>
            </div>
          </div>
        </div>

        <!-- Span Timeline -->
        <div class="mb-4">
          <h4 class="text-xs font-semibold text-text-primary mb-3">{{ t('spanTimeline') }}</h4>
          <div class="space-y-1">
            <div v-for="(span, index) in selectedTrace.spans" :key="span.spanId" class="relative">
              <div
                class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                :style="{ paddingLeft: `${span.depth * 20 + 8}px` }"
              >
                <div
                  class="w-2 h-2 rounded-full shrink-0"
                  :class="span.hasError ? 'bg-red-500' : 'bg-emerald-500'"
                ></div>
                <span
                  class="px-1.5 py-0.5 text-[10px] font-medium rounded shrink-0"
                  :style="{
                    backgroundColor: getServiceColor(span.serviceName, 0.1),
                    color: getServiceColor(span.serviceName, 1),
                  }"
                >
                  {{ span.serviceName }}
                </span>
                <span class="text-xs text-text-primary truncate flex-1">
                  {{ span.operationName }}
                </span>
                <div class="w-32 h-4 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden shrink-0">
                  <div
                    class="h-full rounded"
                    :class="span.hasError ? 'bg-red-400' : 'bg-blue-400'"
                    :style="{ width: `${(span.duration / selectedTrace.duration) * 100}%` }"
                  ></div>
                </div>
                <span class="text-xs text-text-secondary font-mono w-16 text-right shrink-0">
                  {{ formatDuration(span.duration) }}
                </span>
              </div>
              <div
                v-if="index < selectedTrace.spans.length - 1"
                class="absolute left-0 top-full h-1 w-px bg-gray-200 dark:bg-gray-800"
                :style="{ left: `${span.depth * 20 + 12}px` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Service Dependency -->
        <div class="border-t border-border pt-4">
          <h4 class="text-xs font-semibold text-text-primary mb-3">
            {{ t('serviceDependency') }}
          </h4>
          <div class="flex items-center justify-center gap-3 py-4 flex-wrap">
            <template
              v-for="(service, index) in getUniqueServices(selectedTrace.spans)"
              :key="service"
            >
              <div
                class="px-3 py-2 rounded-lg border-2 text-xs font-medium"
                :style="{
                  borderColor: getServiceColor(service, 0.5),
                  backgroundColor: getServiceColor(service, 0.1),
                  color: getServiceColor(service, 1),
                }"
              >
                {{ service }}
              </div>
              <ArrowRight
                v-if="index < getUniqueServices(selectedTrace.spans).length - 1"
                class="w-4 h-4 text-gray-400 dark:text-gray-500"
              />
            </template>
          </div>
        </div>

        <div class="flex justify-end mt-3">
          <button @click="copyTraceId" class="btn btn-primary btn-sm">
            <Copy class="w-3.5 h-3.5" />
            {{ t('copyTraceId') }}
          </button>
        </div>
      </template>
    </ConfirmModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  Search,
  RotateCcw,
  RefreshCw,
  Loader2,
  Eye,
  CheckCircle,
  XCircle,
  ArrowRight,
  Copy,
} from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { logger } from '@/utils/logger'
import batataApi from '@/api/batata'
import { ApiError } from '@/utils/error'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import type { Namespace } from '@/types'

// Types
interface Span {
  spanId: string
  parentSpanId?: string
  serviceName: string
  operationName: string
  duration: number
  startTime: number
  hasError: boolean
  depth: number
  tags?: Record<string, string>
}

interface Trace {
  traceId: string
  rootService: string
  rootOperation: string
  spanCount: number
  duration: number
  startTime: number
  hasError: boolean
  spans: Span[]
}

// Props
defineProps<{
  namespace?: Namespace
}>()

const { t } = useI18n()

// State
const loading = ref(false)
const traces = ref<Trace[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const showDetailModal = ref(false)
const selectedTrace = ref<Trace | null>(null)

const services = ref<string[]>([])

// Filters
const filters = reactive({
  serviceName: '',
  operationName: '',
  traceId: '',
  timeRange: '1h',
  minDuration: undefined as number | undefined,
  maxDuration: undefined as number | undefined,
  errorsOnly: false,
  rootSpansOnly: false,
})

// Service colors for visualization
const serviceColors: Record<string, string> = {}
const colorPalette = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#ef4444',
  '#14b8a6',
  '#f97316',
  '#84cc16',
]

const getServiceColor = (serviceName: string, alpha: number): string => {
  if (!serviceColors[serviceName]) {
    const index = Object.keys(serviceColors).length % colorPalette.length
    serviceColors[serviceName] = colorPalette[index] as string
  }
  const hex = serviceColors[serviceName]
  if (alpha === 1) return hex
  // Convert hex to rgba
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Methods
const fetchTraces = async () => {
  loading.value = true
  try {
    await batataApi.getTraceList({
      serviceName: filters.serviceName || undefined,
      operationName: filters.operationName || undefined,
      traceId: filters.traceId || undefined,
      timeRange: filters.timeRange,
      minDuration: filters.minDuration,
      maxDuration: filters.maxDuration,
      errorsOnly: filters.errorsOnly,
      rootSpansOnly: filters.rootSpansOnly,
      page: currentPage.value,
      pageSize: pageSize.value,
    })
  } catch (error) {
    if (!(error instanceof ApiError && error.code === 501)) {
      logger.error('Failed to fetch traces:', error)
    }
    traces.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const fetchServices = async () => {
  try {
    await batataApi.getTraceServices()
  } catch (error) {
    if (!(error instanceof ApiError && error.code === 501)) {
      logger.error('Failed to fetch trace services:', error)
    }
    services.value = []
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchTraces()
}

const handleReset = () => {
  Object.assign(filters, {
    serviceName: '',
    operationName: '',
    traceId: '',
    timeRange: '1h',
    minDuration: undefined,
    maxDuration: undefined,
    errorsOnly: false,
    rootSpansOnly: false,
  })
  handleSearch()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchTraces()
}

const showTraceDetail = (trace: Trace) => {
  selectedTrace.value = trace
  showDetailModal.value = true
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString()
}

const formatDuration = (ms: number) => {
  if (ms < 1) return '<1ms'
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

const getDurationClass = (duration: number) => {
  if (duration < 100)
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
  if (duration < 500) return 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
  return 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
}

const getUniqueServices = (spans: Span[]) => {
  return [...new Set(spans.map((s) => s.serviceName))]
}

const copyTraceId = () => {
  if (selectedTrace.value) {
    navigator.clipboard.writeText(selectedTrace.value.traceId)
  }
}

// Lifecycle
onMounted(() => {
  fetchTraces()
  fetchServices()
})
</script>
