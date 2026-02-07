<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('auditLog') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('auditLogDesc') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="handleExport" class="btn btn-secondary" :disabled="logs.length === 0">
          <Download class="w-3.5 h-3.5" />
          {{ t('export') }}
        </button>
        <button @click="fetchLogs" class="btn btn-secondary" :disabled="loading">
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
              t('username')
            }}</label>
            <input
              v-model="filters.username"
              type="text"
              class="input"
              :placeholder="t('username')"
              @keyup.enter="handleSearch"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-text-secondary mb-1">{{
              t('resourceType')
            }}</label>
            <select v-model="filters.resourceType" class="input">
              <option value="">{{ t('all') }}</option>
              <option value="config">{{ t('configuration') }}</option>
              <option value="service">{{ t('services') }}</option>
              <option value="namespace">{{ t('namespaces') }}</option>
              <option value="user">{{ t('users') }}</option>
              <option value="role">{{ t('roles') }}</option>
              <option value="permission">{{ t('permissions') }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-text-secondary mb-1">{{
              t('actionType')
            }}</label>
            <select v-model="filters.action" class="input">
              <option value="">{{ t('all') }}</option>
              <option value="create">{{ t('create') }}</option>
              <option value="update">{{ t('edit') }}</option>
              <option value="delete">{{ t('delete') }}</option>
              <option value="login">{{ t('login') }}</option>
              <option value="logout">{{ t('logout') }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-text-secondary mb-1">{{
              t('timeRange')
            }}</label>
            <select v-model="filters.timeRange" class="input">
              <option value="1h">{{ t('lastHour') }}</option>
              <option value="24h">{{ t('last24Hours') }}</option>
              <option value="7d">{{ t('last7Days') }}</option>
              <option value="30d">{{ t('last30Days') }}</option>
              <option value="custom">{{ t('customRange') }}</option>
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
      </div>
    </div>

    <!-- Audit Log List -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('timestamp') }}</th>
              <th>{{ t('username') }}</th>
              <th>{{ t('ipAddress') }}</th>
              <th>{{ t('resourceType') }}</th>
              <th>{{ t('action') }}</th>
              <th>{{ t('resourceName') }}</th>
              <th>{{ t('result') }}</th>
              <th class="w-24">{{ t('details') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="8" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
              </td>
            </tr>
            <tr v-else-if="logs.length === 0">
              <td colspan="8" class="text-center py-6 text-text-secondary">
                {{ t('noData') }}
              </td>
            </tr>
            <tr v-for="log in logs" :key="log.id" class="hover:bg-bg-secondary">
              <td class="text-text-secondary whitespace-nowrap">
                {{ formatTime(log.timestamp) }}
              </td>
              <td>
                <div class="flex items-center gap-2">
                  <div
                    class="w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 text-xs font-semibold uppercase"
                  >
                    {{ log.username.charAt(0) }}
                  </div>
                  <span class="font-medium">{{ log.username }}</span>
                </div>
              </td>
              <td class="text-text-secondary font-mono text-xs">{{ log.ip }}</td>
              <td>
                <span
                  class="badge"
                  :class="{
                    'badge-info': log.resourceType === 'config',
                    'badge-success': log.resourceType === 'service',
                    'badge-warning': log.resourceType === 'namespace',
                    'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400':
                      log.resourceType === 'user',
                    'bg-pink-100 text-pink-700 dark:bg-pink-950/30 dark:text-pink-400':
                      log.resourceType === 'role',
                    'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400':
                      log.resourceType === 'permission',
                  }"
                >
                  {{ getResourceTypeLabel(log.resourceType) }}
                </span>
              </td>
              <td>
                <span
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                  :class="getActionClass(log.action)"
                >
                  <component :is="getActionIcon(log.action)" class="w-3 h-3" />
                  {{ getActionLabel(log.action) }}
                </span>
              </td>
              <td class="max-w-[200px] truncate" :title="log.resourceName">
                {{ log.resourceName }}
              </td>
              <td>
                <span
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                  :class="
                    log.success
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                      : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                  "
                >
                  <CheckCircle v-if="log.success" class="w-3 h-3" />
                  <XCircle v-else class="w-3 h-3" />
                  {{ log.success ? t('success') : t('failed') }}
                </span>
              </td>
              <td>
                <button
                  @click="showLogDetail(log)"
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
      <div class="flex items-center justify-between p-3 border-t border-border">
        <div class="text-xs text-text-secondary">
          {{ t('total') }}: {{ total }} {{ t('items') }}
        </div>
        <div class="flex items-center gap-1.5">
          <button
            @click="handlePageChange(currentPage - 1)"
            :disabled="currentPage <= 1"
            class="btn btn-secondary btn-sm"
          >
            <ChevronLeft class="w-3.5 h-3.5" />
          </button>
          <span class="text-xs text-text-primary px-2"> {{ currentPage }} / {{ totalPages }} </span>
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

    <!-- Detail Modal -->
    <div v-if="showDetailModal" class="modal-backdrop" @click="showDetailModal = false">
      <div class="modal max-w-lg" @click.stop>
        <div class="modal-header">
          <h3 class="text-sm font-semibold text-text-primary">{{ t('auditLogDetail') }}</h3>
          <button @click="showDetailModal = false" class="btn btn-ghost btn-sm">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
        <div v-if="selectedLog" class="modal-body space-y-4">
          <!-- Basic Info -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-text-secondary">{{ t('timestamp') }}</label>
              <p class="text-sm font-medium text-text-primary">
                {{ formatTime(selectedLog.timestamp) }}
              </p>
            </div>
            <div>
              <label class="text-xs text-text-secondary">{{ t('username') }}</label>
              <p class="text-sm font-medium text-text-primary">{{ selectedLog.username }}</p>
            </div>
            <div>
              <label class="text-xs text-text-secondary">{{ t('ipAddress') }}</label>
              <p class="text-sm font-medium text-text-primary font-mono">{{ selectedLog.ip }}</p>
            </div>
            <div>
              <label class="text-xs text-text-secondary">{{ t('result') }}</label>
              <span
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                :class="
                  selectedLog.success
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                    : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                "
              >
                <CheckCircle v-if="selectedLog.success" class="w-3 h-3" />
                <XCircle v-else class="w-3 h-3" />
                {{ selectedLog.success ? t('success') : t('failed') }}
              </span>
            </div>
          </div>

          <!-- Resource Info -->
          <div class="border-t border-border pt-3">
            <label class="text-xs text-text-secondary">{{ t('resourceInfo') }}</label>
            <div class="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs text-text-secondary">{{ t('resourceType') }}:</span>
                <span
                  class="badge"
                  :class="{
                    'badge-info': selectedLog.resourceType === 'config',
                    'badge-success': selectedLog.resourceType === 'service',
                    'badge-warning': selectedLog.resourceType === 'namespace',
                  }"
                >
                  {{ getResourceTypeLabel(selectedLog.resourceType) }}
                </span>
              </div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs text-text-secondary">{{ t('action') }}:</span>
                <span class="text-xs font-medium">{{ getActionLabel(selectedLog.action) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-text-secondary">{{ t('resourceName') }}:</span>
                <span class="text-xs font-medium font-mono">{{ selectedLog.resourceName }}</span>
              </div>
            </div>
          </div>

          <!-- Details/Changes -->
          <div v-if="selectedLog.details" class="border-t border-border pt-3">
            <label class="text-xs text-text-secondary">{{ t('changeDetails') }}</label>
            <pre
              class="mt-2 p-3 bg-gray-900 text-gray-100 rounded-lg text-xs font-mono overflow-auto max-h-48"
              >{{ JSON.stringify(selectedLog.details, null, 2) }}</pre
            >
          </div>

          <!-- Error Message -->
          <div
            v-if="!selectedLog.success && selectedLog.errorMessage"
            class="border-t border-border pt-3"
          >
            <label class="text-xs text-text-secondary">{{ t('errorMessage') }}</label>
            <p
              class="mt-2 p-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-lg text-xs"
            >
              {{ selectedLog.errorMessage }}
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showDetailModal = false" class="btn btn-secondary">
            {{ t('close') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  Search,
  RotateCcw,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Eye,
  Plus,
  Pencil,
  Trash2,
  LogIn,
  LogOut,
  CheckCircle,
  XCircle,
} from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import type { Namespace, AuditLogItem } from '@/types'

// Internal view type that maps from API response
interface AuditLog {
  id: string
  timestamp: number
  username: string
  ip: string
  resourceType: 'config' | 'service' | 'namespace' | 'user' | 'role' | 'permission'
  action: 'create' | 'update' | 'delete' | 'login' | 'logout'
  resourceName: string
  success: boolean
  details?: Record<string, unknown>
  errorMessage?: string
}

// Props
defineProps<{
  namespace?: Namespace
}>()

const { t } = useI18n()

// State
const loading = ref(false)
const logs = ref<AuditLog[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const showDetailModal = ref(false)
const selectedLog = ref<AuditLog | null>(null)

// Filters
const filters = reactive({
  username: '',
  resourceType: '',
  action: '',
  timeRange: '24h',
})

// Computed
const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1)

// Helper to calculate time range
const getTimeRange = (): { startTime?: string; endTime?: string } => {
  const now = new Date()
  const endTime = now.toISOString().slice(0, 19).replace('T', ' ')

  let startTime: string | undefined
  switch (filters.timeRange) {
    case '1h':
      startTime = new Date(now.getTime() - 3600000).toISOString().slice(0, 19).replace('T', ' ')
      break
    case '24h':
      startTime = new Date(now.getTime() - 86400000).toISOString().slice(0, 19).replace('T', ' ')
      break
    case '7d':
      startTime = new Date(now.getTime() - 7 * 86400000)
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ')
      break
    case '30d':
      startTime = new Date(now.getTime() - 30 * 86400000)
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ')
      break
    default:
      startTime = undefined
  }

  return { startTime, endTime }
}

// Map API response to internal type
const mapApiLogToInternal = (item: AuditLogItem): AuditLog => {
  const operationMap: Record<string, AuditLog['action']> = {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    LOGIN: 'login',
    LOGOUT: 'logout',
    PUBLISH: 'update',
    ROLLBACK: 'update',
    IMPORT: 'create',
    EXPORT: 'create',
    CLONE: 'create',
    QUERY: 'create',
  }

  const resourceTypeMap: Record<string, AuditLog['resourceType']> = {
    CONFIG: 'config',
    SERVICE: 'service',
    INSTANCE: 'service',
    NAMESPACE: 'namespace',
    USER: 'user',
    ROLE: 'role',
    PERMISSION: 'permission',
    CAPACITY: 'config',
    CLUSTER: 'service',
  }

  return {
    id: String(item.id),
    timestamp: new Date(item.gmtCreate).getTime(),
    username: item.operator,
    ip: item.sourceIp || 'unknown',
    resourceType: resourceTypeMap[item.resourceType] || 'config',
    action: operationMap[item.operation] || 'create',
    resourceName: item.resourceId || '',
    success: item.result === 'SUCCESS',
    details: item.details ? JSON.parse(item.details) : undefined,
    errorMessage: item.errorMessage,
  }
}

// Methods
const fetchLogs = async () => {
  loading.value = true
  try {
    const timeRange = getTimeRange()
    const response = await batataApi.getAuditLogList({
      operator: filters.username || undefined,
      resourceType: filters.resourceType?.toUpperCase() || undefined,
      operation: filters.action?.toUpperCase() || undefined,
      startTime: timeRange.startTime,
      endTime: timeRange.endTime,
      pageNo: currentPage.value,
      pageSize: pageSize.value,
    })

    const data = response.data.data
    logs.value = data.pageItems.map(mapApiLogToInternal)
    total.value = data.totalCount
  } catch (error) {
    console.error('Failed to fetch audit logs:', error)
    logs.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchLogs()
}

const handleReset = () => {
  Object.assign(filters, {
    username: '',
    resourceType: '',
    action: '',
    timeRange: '24h',
  })
  handleSearch()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchLogs()
}

const handleExport = () => {
  // Export audit logs as JSON
  const data = JSON.stringify(logs.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `audit_log_${Date.now()}.json`
  a.click()
  window.URL.revokeObjectURL(url)
}

const showLogDetail = (log: AuditLog) => {
  selectedLog.value = log
  showDetailModal.value = true
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString()
}

const getResourceTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    config: t('configuration'),
    service: t('services'),
    namespace: t('namespaces'),
    user: t('users'),
    role: t('roles'),
    permission: t('permissions'),
  }
  return labels[type] || type
}

const getActionLabel = (action: string) => {
  const labels: Record<string, string> = {
    create: t('create'),
    update: t('edit'),
    delete: t('delete'),
    login: t('login'),
    logout: t('logout'),
  }
  return labels[action] || action
}

const getActionClass = (action: string) => {
  const classes: Record<string, string> = {
    create: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
    update: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
    delete: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400',
    login: 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400',
    logout: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200',
  }
  return classes[action] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200'
}

const getActionIcon = (action: string) => {
  const icons: Record<string, unknown> = {
    create: Plus,
    update: Pencil,
    delete: Trash2,
    login: LogIn,
    logout: LogOut,
  }
  return icons[action] || Plus
}

// Lifecycle
onMounted(() => {
  fetchLogs()
})
</script>
