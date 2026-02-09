<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('multiDatacenter') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('multiDatacenterDesc') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="fetchDatacenters" class="btn btn-secondary" :disabled="loading">
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
          {{ t('refresh') }}
        </button>
        <button @click="showAddModal = true" class="btn btn-primary">
          <Plus class="w-3.5 h-3.5" />
          {{ t('addDatacenter') }}
        </button>
      </div>
    </div>

    <!-- Datacenter Overview Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              {{ t('totalDatacenters') }}
            </p>
            <p class="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {{ datacenters.length }}
            </p>
          </div>
          <div
            class="w-12 h-12 bg-blue-50 dark:bg-blue-950/30 rounded-lg flex items-center justify-center"
          >
            <Globe :size="24" class="text-blue-500" />
          </div>
        </div>
      </div>

      <div
        class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              {{ t('healthyDatacenters') }}
            </p>
            <p class="text-2xl font-bold text-emerald-600 mt-1">{{ healthyCount }}</p>
          </div>
          <div
            class="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg flex items-center justify-center"
          >
            <CheckCircle :size="24" class="text-emerald-500" />
          </div>
        </div>
      </div>

      <div
        class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              {{ t('syncPending') }}
            </p>
            <p class="text-2xl font-bold text-amber-600 mt-1">{{ pendingSyncCount }}</p>
          </div>
          <div
            class="w-12 h-12 bg-amber-50 dark:bg-amber-950/30 rounded-lg flex items-center justify-center"
          >
            <RefreshCw :size="24" class="text-amber-500" />
          </div>
        </div>
      </div>

      <div
        class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              {{ t('syncErrors') }}
            </p>
            <p class="text-2xl font-bold text-red-600 mt-1">{{ errorCount }}</p>
          </div>
          <div
            class="w-12 h-12 bg-red-50 dark:bg-red-950/30 rounded-lg flex items-center justify-center"
          >
            <AlertTriangle :size="24" class="text-red-500" />
          </div>
        </div>
      </div>
    </div>

    <!-- Datacenter List -->
    <div class="card">
      <div class="p-3 border-b border-border">
        <h3 class="text-sm font-semibold text-text-primary">{{ t('datacenterList') }}</h3>
      </div>

      <div v-if="loading" class="p-8 text-center">
        <Loader2 class="w-6 h-6 animate-spin mx-auto text-primary" />
      </div>

      <div v-else-if="datacenters.length === 0" class="p-8 text-center text-text-secondary">
        <Globe class="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p class="text-sm">{{ t('noDatacenters') }}</p>
      </div>

      <div v-else class="divide-y divide-border">
        <div
          v-for="dc in datacenters"
          :key="dc.id"
          class="p-4 hover:bg-bg-secondary transition-colors"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-start gap-4">
              <!-- Status Indicator -->
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center"
                :class="{
                  'bg-emerald-50 dark:bg-emerald-950/30': dc.status === 'healthy',
                  'bg-amber-50 dark:bg-amber-950/30': dc.status === 'syncing',
                  'bg-red-50 dark:bg-red-950/30': dc.status === 'error',
                  'bg-gray-100 dark:bg-gray-800': dc.status === 'offline',
                }"
              >
                <CheckCircle v-if="dc.status === 'healthy'" class="w-5 h-5 text-emerald-500" />
                <RefreshCw
                  v-else-if="dc.status === 'syncing'"
                  class="w-5 h-5 text-amber-500 animate-spin"
                />
                <AlertTriangle v-else-if="dc.status === 'error'" class="w-5 h-5 text-red-500" />
                <XCircle v-else class="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>

              <!-- Datacenter Info -->
              <div>
                <div class="flex items-center gap-2">
                  <h4 class="text-sm font-semibold text-text-primary">{{ dc.name }}</h4>
                  <span
                    v-if="dc.isPrimary"
                    class="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 text-[10px] font-medium rounded"
                  >
                    {{ t('primary') }}
                  </span>
                  <span
                    class="px-1.5 py-0.5 rounded text-[10px] font-medium"
                    :class="{
                      'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400':
                        dc.status === 'healthy',
                      'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400':
                        dc.status === 'syncing',
                      'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400':
                        dc.status === 'error',
                      'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400':
                        dc.status === 'offline',
                    }"
                  >
                    {{ getStatusLabel(dc.status) }}
                  </span>
                </div>
                <p class="text-xs text-text-secondary mt-1">{{ dc.region }} - {{ dc.endpoint }}</p>
                <div class="flex items-center gap-4 mt-2 text-xs text-text-tertiary">
                  <span class="flex items-center gap-1">
                    <Server class="w-3 h-3" />
                    {{ dc.nodeCount }} {{ t('nodes') }}
                  </span>
                  <span class="flex items-center gap-1">
                    <FileCode class="w-3 h-3" />
                    {{ dc.configCount }} {{ t('configs') }}
                  </span>
                  <span class="flex items-center gap-1">
                    <Clock class="w-3 h-3" />
                    {{ t('lastSync') }}: {{ formatTime(dc.lastSyncTime) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-1">
              <button
                @click="syncDatacenter(dc)"
                class="btn btn-ghost btn-sm"
                :disabled="dc.status === 'syncing'"
                :title="t('syncNow')"
              >
                <RefreshCw class="w-3.5 h-3.5" />
              </button>
              <button
                @click="showDatacenterDetail(dc)"
                class="btn btn-ghost btn-sm"
                :title="t('viewDetails')"
              >
                <Eye class="w-3.5 h-3.5" />
              </button>
              <button @click="editDatacenter(dc)" class="btn btn-ghost btn-sm" :title="t('edit')">
                <Pencil class="w-3.5 h-3.5" />
              </button>
              <button
                v-if="!dc.isPrimary"
                @click="confirmDeleteDatacenter(dc)"
                class="btn btn-ghost btn-sm text-danger"
                :title="t('delete')"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Sync Progress -->
          <div v-if="dc.status === 'syncing' && dc.syncProgress" class="mt-3 ml-14">
            <div class="flex items-center justify-between text-xs mb-1">
              <span class="text-text-secondary">{{ t('syncProgress') }}</span>
              <span class="text-text-primary font-medium">{{ dc.syncProgress }}%</span>
            </div>
            <div class="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                class="h-full bg-amber-500 rounded-full transition-all duration-300"
                :style="{ width: `${dc.syncProgress}%` }"
              ></div>
            </div>
          </div>

          <!-- Error Message -->
          <div
            v-if="dc.status === 'error' && dc.errorMessage"
            class="mt-3 ml-14 p-2 bg-red-50 dark:bg-red-950/30 rounded-lg"
          >
            <p class="text-xs text-red-700 dark:text-red-400">{{ dc.errorMessage }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Sync Status Map -->
    <div class="card">
      <div class="p-3 border-b border-border">
        <h3 class="text-sm font-semibold text-text-primary">{{ t('syncTopology') }}</h3>
      </div>
      <div class="p-4">
        <div class="flex items-center justify-center gap-8 py-8">
          <!-- Primary Datacenter -->
          <div class="text-center">
            <div
              class="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center mx-auto border-4 border-blue-500"
            >
              <Globe class="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <p class="text-sm font-semibold text-text-primary mt-2">
              {{ primaryDatacenter?.name || 'Primary' }}
            </p>
            <p class="text-xs text-text-secondary">{{ t('primary') }}</p>
          </div>

          <!-- Sync Arrows -->
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2">
              <ArrowRight class="w-8 h-8 text-emerald-500" />
              <span class="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{{
                t('replicating')
              }}</span>
            </div>
            <div class="flex items-center gap-2">
              <ArrowLeft class="w-8 h-8 text-blue-500" />
              <span class="text-xs text-blue-600 dark:text-blue-400 font-medium">{{
                t('receiving')
              }}</span>
            </div>
          </div>

          <!-- Secondary Datacenters -->
          <div class="flex flex-col gap-4">
            <div v-for="dc in secondaryDatacenters" :key="dc.id" class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-full flex items-center justify-center"
                :class="{
                  'bg-emerald-100 dark:bg-emerald-950/30 border-2 border-emerald-400':
                    dc.status === 'healthy',
                  'bg-amber-100 dark:bg-amber-950/30 border-2 border-amber-400':
                    dc.status === 'syncing',
                  'bg-red-100 dark:bg-red-950/30 border-2 border-red-400': dc.status === 'error',
                  'bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600':
                    dc.status === 'offline',
                }"
              >
                <MapPin
                  class="w-5 h-5"
                  :class="{
                    'text-emerald-600 dark:text-emerald-400': dc.status === 'healthy',
                    'text-amber-600 dark:text-amber-400': dc.status === 'syncing',
                    'text-red-600 dark:text-red-400': dc.status === 'error',
                    'text-gray-500 dark:text-gray-400': dc.status === 'offline',
                  }"
                />
              </div>
              <div>
                <p class="text-xs font-medium text-text-primary">{{ dc.name }}</p>
                <p class="text-[10px] text-text-secondary">{{ dc.region }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Datacenter Modal -->
    <FormModal
      v-model="showFormModal"
      :title="showEditModal ? t('editDatacenter') : t('addDatacenter')"
      :submit-text="showEditModal ? t('save') : t('create')"
      @submit="saveDatacenter"
    >
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('datacenterName') }} <span class="text-danger">*</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            class="input"
            :placeholder="t('datacenterNamePlaceholder')"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('region') }} <span class="text-danger">*</span>
          </label>
          <select v-model="form.region" class="input">
            <option value="">{{ t('selectRegion') }}</option>
            <option value="us-east-1">{{ t('regionUsEast1') }}</option>
            <option value="us-west-2">{{ t('regionUsWest2') }}</option>
            <option value="eu-west-1">{{ t('regionEuWest1') }}</option>
            <option value="ap-northeast-1">{{ t('regionApNortheast1') }}</option>
            <option value="ap-southeast-1">{{ t('regionApSoutheast1') }}</option>
            <option value="cn-north-1">{{ t('regionCnNorth1') }}</option>
            <option value="cn-east-1">{{ t('regionCnEast1') }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('endpoint') }} <span class="text-danger">*</span>
          </label>
          <input
            v-model="form.endpoint"
            type="text"
            class="input"
            placeholder="https://batata.example.com:8848"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('accessToken') }}
          </label>
          <input
            v-model="form.accessToken"
            type="password"
            class="input"
            :placeholder="t('accessTokenPlaceholder')"
          />
        </div>
        <div class="flex items-center gap-2">
          <input
            type="checkbox"
            v-model="form.isPrimary"
            id="isPrimary"
            class="w-4 h-4 rounded"
            :disabled="showEditModal && selectedDatacenter?.isPrimary"
          />
          <label for="isPrimary" class="text-xs text-text-primary">
            {{ t('setAsPrimary') }}
          </label>
        </div>
      </div>
    </FormModal>

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      v-model="showDeleteModal"
      :title="t('confirmDelete')"
      :confirm-text="t('delete')"
      danger
      @confirm="deleteDatacenter"
    >
      <div>
        <p class="text-xs text-text-secondary">
          {{ t('confirmDeleteDatacenter') }}
          <span class="font-medium text-text-primary">{{ datacenterToDelete?.name }}</span
          >?
        </p>
        <p class="text-xs text-amber-600 mt-2">{{ t('deleteDatacenterWarning') }}</p>
      </div>
    </ConfirmModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import {
  Globe,
  RefreshCw,
  Plus,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Server,
  FileCode,
  Clock,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  ArrowRight,
  ArrowLeft,
  MapPin,
} from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import FormModal from '@/components/common/FormModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import type { Namespace, NodeInfo } from '@/types'

// Types
interface Datacenter {
  id: string
  name: string
  region: string
  endpoint: string
  status: 'healthy' | 'syncing' | 'error' | 'offline'
  isPrimary: boolean
  nodeCount: number
  configCount: number
  lastSyncTime: number
  syncProgress?: number
  errorMessage?: string
  nodes?: NodeInfo[]
}

// Props
defineProps<{
  namespace?: Namespace
}>()

const { t } = useI18n()

// State
const loading = ref(false)
const datacenters = ref<Datacenter[]>([])
const showAddModal = ref(false)
const showEditModal = ref(false)
const showFormModal = ref(false)
const showDeleteModal = ref(false)
const selectedDatacenter = ref<Datacenter | null>(null)
const datacenterToDelete = ref<Datacenter | null>(null)

const form = reactive({
  name: '',
  region: '',
  endpoint: '',
  accessToken: '',
  isPrimary: false,
})

// Sync showFormModal with showAddModal / showEditModal
watch(showAddModal, (val) => {
  if (val) showFormModal.value = true
})
watch(showEditModal, (val) => {
  if (val) showFormModal.value = true
})
watch(showFormModal, (val) => {
  if (!val) {
    showAddModal.value = false
    showEditModal.value = false
  }
})

// Computed
const healthyCount = computed(
  () => datacenters.value.filter((dc) => dc.status === 'healthy').length,
)
const pendingSyncCount = computed(
  () => datacenters.value.filter((dc) => dc.status === 'syncing').length,
)
const errorCount = computed(() => datacenters.value.filter((dc) => dc.status === 'error').length)
const primaryDatacenter = computed(() => datacenters.value.find((dc) => dc.isPrimary))
const secondaryDatacenters = computed(() => datacenters.value.filter((dc) => !dc.isPrimary))

// Methods
const fetchDatacenters = async () => {
  loading.value = true
  try {
    // Fetch cluster nodes and derive datacenter info from them
    const response = await batataApi.getClusterNodes({})
    const nodes = response.data.data || []

    // Group nodes by datacenter (from extendInfo or metadata)
    const dcMap = new Map<string, { nodes: NodeInfo[]; region: string }>()

    for (const node of nodes) {
      // Get datacenter info from node's extendInfo or metadata
      const extendInfo = node.extendInfo as Record<string, string> | undefined
      const metadata = node.metadata || {}
      const dcName = extendInfo?.datacenter || metadata.datacenter || 'default'
      const region = extendInfo?.region || metadata.region || 'default'

      if (!dcMap.has(dcName)) {
        dcMap.set(dcName, { nodes: [], region })
      }
      dcMap.get(dcName)!.nodes.push(node)
    }

    // Convert to Datacenter array
    const dcs: Datacenter[] = []
    let isFirst = true

    for (const [dcName, data] of dcMap) {
      const healthyNodes = data.nodes.filter((n) => n.state === 'UP')
      const hasError = data.nodes.some((n) => n.state === 'DOWN')
      const hasSuspicious = data.nodes.some((n) => n.state === 'SUSPICIOUS')

      let status: Datacenter['status'] = 'healthy'
      if (healthyNodes.length === 0) {
        status = 'offline'
      } else if (hasError) {
        status = 'error'
      } else if (hasSuspicious) {
        status = 'syncing'
      }

      // Use first node's address as endpoint
      const endpoint = data.nodes[0]?.address || ''

      dcs.push({
        id: `dc-${dcName}`,
        name: dcName,
        region: data.region,
        endpoint,
        status,
        isPrimary: isFirst, // First datacenter is considered primary
        nodeCount: data.nodes.length,
        configCount: 0, // Would need separate API call
        lastSyncTime: Date.now(),
        nodes: data.nodes,
        errorMessage: hasError ? t('someNodesDown') : undefined,
      })

      isFirst = false
    }

    datacenters.value = dcs

    // If no datacenters found from cluster, show empty state
    if (dcs.length === 0) {
      datacenters.value = []
    }
  } catch (error) {
    logger.error('Failed to fetch datacenters:', error)
    toast.error(t('operationFailed'))
    datacenters.value = []
  } finally {
    loading.value = false
  }
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    healthy: t('healthy'),
    syncing: t('syncing'),
    error: t('error'),
    offline: t('offline'),
  }
  return labels[status] || status
}

const formatTime = (timestamp: number) => {
  const diff = Date.now() - timestamp
  if (diff < 60000) return t('justNow')
  if (diff < 3600000) return `${Math.floor(diff / 60000)} ${t('minutesAgo')}`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} ${t('hoursAgo')}`
  return new Date(timestamp).toLocaleString()
}

const syncDatacenter = async (_dc: Datacenter) => {
  toast.warning(t('featureNotSupported'))
}

const showDatacenterDetail = (dc: Datacenter) => {
  selectedDatacenter.value = dc
  // Could open a detail modal or navigate to detail page
  logger.info('Show detail for:', dc)
}

const editDatacenter = (dc: Datacenter) => {
  selectedDatacenter.value = dc
  Object.assign(form, {
    name: dc.name,
    region: dc.region,
    endpoint: dc.endpoint,
    accessToken: '',
    isPrimary: dc.isPrimary,
  })
  showEditModal.value = true
}

const confirmDeleteDatacenter = (dc: Datacenter) => {
  datacenterToDelete.value = dc
  showDeleteModal.value = true
}

const deleteDatacenter = () => {
  if (!datacenterToDelete.value) return
  datacenters.value = datacenters.value.filter((dc) => dc.id !== datacenterToDelete.value?.id)
  showDeleteModal.value = false
  datacenterToDelete.value = null
}

const closeModals = () => {
  showAddModal.value = false
  showEditModal.value = false
  showFormModal.value = false
  selectedDatacenter.value = null
  Object.assign(form, {
    name: '',
    region: '',
    endpoint: '',
    accessToken: '',
    isPrimary: false,
  })
}

const saveDatacenter = () => {
  if (!form.name || !form.region || !form.endpoint) return

  if (showEditModal.value && selectedDatacenter.value) {
    // Update existing datacenter
    const dc = datacenters.value.find((d) => d.id === selectedDatacenter.value?.id)
    if (dc) {
      Object.assign(dc, {
        name: form.name,
        region: form.region,
        endpoint: form.endpoint,
        isPrimary: form.isPrimary,
      })
    }
  } else {
    // Add new datacenter
    datacenters.value.push({
      id: `dc-${Date.now()}`,
      name: form.name,
      region: form.region,
      endpoint: form.endpoint,
      status: 'offline',
      isPrimary: form.isPrimary,
      nodeCount: 0,
      configCount: 0,
      lastSyncTime: 0,
    })
  }

  closeModals()
}

// Lifecycle
onMounted(() => {
  fetchDatacenters()
})
</script>
