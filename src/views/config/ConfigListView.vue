<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('configuration') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('configurationDesc') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="handleImport" class="btn btn-secondary">
          <Upload class="w-3.5 h-3.5" />
          {{ t('import') }}
        </button>
        <button
          @click="handleExport"
          class="btn btn-secondary"
          :disabled="selectedIds.length === 0"
        >
          <Download class="w-3.5 h-3.5" />
          {{ t('export') }}
        </button>
        <router-link to="/config/new" class="btn btn-primary">
          <Plus class="w-3.5 h-3.5" />
          {{ t('newConfig') }}
        </router-link>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="card">
      <div class="p-3">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-2">
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
          <div>
            <label class="block text-xs font-medium text-text-secondary mb-1">{{
              t('appName')
            }}</label>
            <input
              v-model="searchParams.appName"
              type="text"
              class="input"
              :placeholder="t('appName')"
              @keyup.enter="handleSearch"
            />
          </div>
          <div class="flex items-end gap-1.5">
            <button @click="handleSearch" class="btn btn-primary flex-1">
              <Search class="w-3.5 h-3.5" />
              {{ t('search') }}
            </button>
            <button @click="handleReset" class="btn btn-secondary">
              <RotateCcw class="w-3.5 h-3.5" />
            </button>
            <button @click="showAdvanced = !showAdvanced" class="btn btn-ghost">
              <SlidersHorizontal class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Advanced Search -->
        <div
          v-if="showAdvanced"
          class="grid grid-cols-1 md:grid-cols-4 gap-2 mt-3 pt-3 border-t border-border"
        >
          <div>
            <label class="block text-xs font-medium text-text-secondary mb-1">{{
              t('tags')
            }}</label>
            <input
              v-model="searchParams.configTags"
              type="text"
              class="input"
              :placeholder="t('tags')"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-text-secondary mb-1">{{
              t('configType')
            }}</label>
            <select v-model="searchParams.type" class="input">
              <option value="">{{ t('all') }}</option>
              <option value="json">{{ t('configTypeJson') }}</option>
              <option value="yaml">{{ t('configTypeYaml') }}</option>
              <option value="properties">{{ t('configTypeProperties') }}</option>
              <option value="xml">{{ t('configTypeXml') }}</option>
              <option value="text">{{ t('configTypeText') }}</option>
            </select>
          </div>
          <div class="flex items-center gap-4 md:col-span-2">
            <div class="flex items-center gap-2">
              <label class="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  v-model="searchParams.search"
                  value="blur"
                  class="w-3.5 h-3.5 text-primary"
                />
                <span class="text-xs text-text-primary">{{ t('fuzzySearch') }}</span>
              </label>
              <label class="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  v-model="searchParams.search"
                  value="accurate"
                  class="w-3.5 h-3.5 text-primary"
                />
                <span class="text-xs text-text-primary">{{ t('exactSearch') }}</span>
              </label>
            </div>
            <label
              class="flex items-center gap-1.5 cursor-pointer border-l pl-4 border-gray-200 dark:border-gray-800"
            >
              <input
                type="checkbox"
                v-model="searchParams.showBetaOnly"
                class="w-3.5 h-3.5 text-purple-600 rounded"
              />
              <FlaskConical class="w-3 h-3 text-purple-500 dark:text-purple-400" />
              <span class="text-xs text-text-primary">{{ t('betaOnly') }}</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Config List -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th class="w-8">
                <input
                  type="checkbox"
                  :checked="isAllSelected"
                  @change="toggleSelectAll"
                  class="w-3.5 h-3.5 rounded"
                />
              </th>
              <th>{{ t('dataId') }}</th>
              <th>{{ t('group') }}</th>
              <th>{{ t('appName') }}</th>
              <th>{{ t('configType') }}</th>
              <th>{{ t('modifyTime') }}</th>
              <th class="w-36">{{ t('actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
              </td>
            </tr>
            <tr v-else-if="configs.length === 0">
              <td colspan="7" class="text-center py-6 text-text-secondary">
                {{ t('noData') }}
              </td>
            </tr>
            <tr v-for="config in configs" :key="config.id" class="hover:bg-bg-secondary">
              <td>
                <input
                  type="checkbox"
                  :checked="selectedIds.includes(config.id)"
                  @change="toggleSelect(config.id)"
                  class="w-3.5 h-3.5 rounded"
                />
              </td>
              <td>
                <router-link
                  :to="{
                    name: 'config-detail',
                    query: {
                      dataId: config.dataId,
                      groupName: config.groupName,
                      namespaceId: namespace.namespace,
                    },
                  }"
                  class="text-primary hover:underline font-medium"
                >
                  {{ config.dataId }}
                </router-link>
              </td>
              <td>{{ config.groupName }}</td>
              <td>{{ config.appName || '-' }}</td>
              <td>
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="badge badge-info">{{ config.type?.toUpperCase() || 'TEXT' }}</span>
                  <span
                    v-if="config.encryptedDataKey"
                    class="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-[10px] font-medium rounded"
                    :title="t('encrypted')"
                  >
                    <Lock class="w-2.5 h-2.5" />
                    {{ t('encrypted') }}
                  </span>
                  <span
                    v-if="isBetaConfig(config)"
                    class="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 text-[10px] font-medium rounded"
                    :title="t('betaConfig')"
                  >
                    <FlaskConical class="w-2.5 h-2.5" />
                    {{ t('beta') }}
                  </span>
                </div>
              </td>
              <td class="text-text-secondary">
                {{ formatTime(config.modifyTime) }}
              </td>
              <td>
                <div class="flex items-center gap-0.5">
                  <router-link
                    :to="{
                      name: 'config-detail',
                      query: {
                        dataId: config.dataId,
                        group: config.groupName,
                        tenant: namespace.namespace,
                      },
                    }"
                    class="btn btn-ghost btn-sm"
                    :title="t('view')"
                  >
                    <Eye class="w-3.5 h-3.5" />
                  </router-link>
                  <router-link
                    :to="{
                      name: 'config-edit',
                      query: {
                        dataId: config.dataId,
                        group: config.groupName,
                        tenant: namespace.namespace,
                      },
                    }"
                    class="btn btn-ghost btn-sm"
                    :title="t('edit')"
                  >
                    <Pencil class="w-3.5 h-3.5" />
                  </router-link>
                  <router-link
                    :to="{
                      name: 'config-history',
                      query: {
                        dataId: config.dataId,
                        group: config.groupName,
                        tenant: namespace.namespace,
                      },
                    }"
                    class="btn btn-ghost btn-sm"
                    :title="t('history')"
                  >
                    <History class="w-3.5 h-3.5" />
                  </router-link>
                  <button
                    @click="handleClone(config)"
                    class="btn btn-ghost btn-sm"
                    :title="t('clone')"
                  >
                    <Copy class="w-3.5 h-3.5" />
                  </button>
                  <button
                    v-if="isBetaConfig(config)"
                    @click="handlePromote(config)"
                    class="btn btn-ghost btn-sm text-purple-600 dark:text-purple-400"
                    :title="t('promoteToStable')"
                  >
                    <ArrowUpCircle class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="handleDelete(config)"
                    class="btn btn-ghost btn-sm text-danger"
                    :title="t('delete')"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
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

    <!-- Delete Confirm Modal -->
    <div v-if="showDeleteModal" class="modal-backdrop" @click="showDeleteModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3 class="text-sm font-semibold text-text-primary">{{ t('confirmDelete') }}</h3>
          <button @click="showDeleteModal = false" class="btn btn-ghost btn-sm">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
        <div class="modal-body">
          <p class="text-xs text-text-secondary">
            {{ t('confirmDeleteConfig') }}
            <span class="font-medium text-text-primary">{{ configToDelete?.dataId }}</span
            >?
          </p>
        </div>
        <div class="modal-footer">
          <button @click="showDeleteModal = false" class="btn btn-secondary">
            {{ t('cancel') }}
          </button>
          <button @click="confirmDelete" class="btn btn-danger">
            {{ t('delete') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Import Modal -->
    <div v-if="showImportModal" class="modal-backdrop" @click="showImportModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3 class="text-sm font-semibold text-text-primary">{{ t('importConfig') }}</h3>
          <button @click="showImportModal = false" class="btn btn-ghost btn-sm">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
        <div class="modal-body space-y-3">
          <div>
            <label class="block text-xs font-medium text-text-secondary mb-1">{{
              t('selectFile')
            }}</label>
            <input
              ref="fileInput"
              type="file"
              accept=".zip"
              @change="handleFileChange"
              class="input"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-text-secondary mb-1">{{
              t('conflictPolicy')
            }}</label>
            <select v-model="importPolicy" class="input">
              <option value="ABORT">{{ t('policyAbort') }}</option>
              <option value="SKIP">{{ t('policySkip') }}</option>
              <option value="OVERWRITE">{{ t('policyOverwrite') }}</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showImportModal = false" class="btn btn-secondary">
            {{ t('cancel') }}
          </button>
          <button @click="confirmImport" class="btn btn-primary" :disabled="!importFile">
            {{ t('import') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Clone Modal -->
    <div v-if="showCloneModal" class="modal-backdrop" @click="showCloneModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3 class="text-sm font-semibold text-text-primary">{{ t('cloneConfig') }}</h3>
          <button @click="showCloneModal = false" class="btn btn-ghost btn-sm">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
        <div class="modal-body space-y-3">
          <div>
            <label class="block text-xs font-medium text-text-secondary mb-1">{{
              t('targetNamespace')
            }}</label>
            <select v-model="cloneTargetNs" class="input">
              <option v-for="ns in namespaces" :key="ns.namespace" :value="ns.namespace">
                {{ ns.namespaceShowName }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-text-secondary mb-1">{{
              t('conflictPolicy')
            }}</label>
            <select v-model="clonePolicy" class="input">
              <option value="ABORT">{{ t('policyAbort') }}</option>
              <option value="SKIP">{{ t('policySkip') }}</option>
              <option value="OVERWRITE">{{ t('policyOverwrite') }}</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showCloneModal = false" class="btn btn-secondary">
            {{ t('cancel') }}
          </button>
          <button @click="confirmClone" class="btn btn-primary">
            {{ t('clone') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Promote Modal -->
    <div v-if="showPromoteModal" class="modal-backdrop" @click="showPromoteModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3 class="text-sm font-semibold text-text-primary">{{ t('promoteToStable') }}</h3>
          <button @click="showPromoteModal = false" class="btn btn-ghost btn-sm">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
        <div class="modal-body space-y-3">
          <div class="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
            <FlaskConical class="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
            <div>
              <p class="text-xs font-medium text-purple-900 dark:text-purple-100">
                {{ t('promoteConfirmTitle') }}
              </p>
              <p class="text-xs text-purple-700 dark:text-purple-300 mt-1">
                {{ t('promoteConfirmDesc') }}
              </p>
            </div>
          </div>
          <div class="space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="text-text-secondary">{{ t('betaConfig') }}:</span>
              <span class="font-medium text-text-primary">{{ configToPromote?.dataId }}</span>
            </div>
            <div class="flex items-center justify-between text-xs">
              <span class="text-text-secondary">{{ t('stableConfig') }}:</span>
              <span class="font-medium text-emerald-600 dark:text-emerald-400">
                {{ configToPromote?.dataId.replace('-beta', '').replace('.beta', '') }}
              </span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showPromoteModal = false" class="btn btn-secondary">
            {{ t('cancel') }}
          </button>
          <button @click="confirmPromote" class="btn btn-primary bg-purple-600 hover:bg-purple-700">
            <ArrowUpCircle class="w-3.5 h-3.5" />
            {{ t('promote') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import {
  Search,
  RotateCcw,
  Plus,
  Eye,
  Pencil,
  History,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Upload,
  Download,
  SlidersHorizontal,
  Lock,
  FlaskConical,
  ArrowUpCircle,
} from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import type { ConfigInfo, Namespace } from '@/types'

const props = defineProps<{
  namespace: Namespace
}>()

const { t } = useI18n()

// State
const loading = ref(false)
const configs = ref<ConfigInfo[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const selectedIds = ref<string[]>([])
const showAdvanced = ref(false)
const namespaces = ref<Namespace[]>([])

// Search params
const searchParams = reactive({
  dataId: '',
  groupName: '',
  appName: '',
  configTags: '',
  type: '',
  search: 'blur' as 'accurate' | 'blur',
  showBetaOnly: false,
})

// Modals
const showDeleteModal = ref(false)
const configToDelete = ref<ConfigInfo | null>(null)
const showImportModal = ref(false)
const importFile = ref<File | null>(null)
const importPolicy = ref<'ABORT' | 'SKIP' | 'OVERWRITE'>('ABORT')
const showCloneModal = ref(false)
const configToClone = ref<ConfigInfo | null>(null)
const cloneTargetNs = ref('')
const clonePolicy = ref<'ABORT' | 'SKIP' | 'OVERWRITE'>('ABORT')

// Computed
const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1)
const isAllSelected = computed(
  () => configs.value.length > 0 && selectedIds.value.length === configs.value.length,
)

// Methods
const fetchConfigs = async () => {
  loading.value = true
  try {
    const response = await batataApi.getConfigList({
      pageNo: currentPage.value,
      pageSize: pageSize.value,
      namespaceId: props.namespace.namespace,
      ...searchParams,
    })
    configs.value = response.data.data.pageItems || []
    total.value = response.data.data.totalCount || 0
    // Check beta status for configs (non-blocking)
    checkAllBetaConfigs()
  } catch (error) {
    console.error('Failed to fetch configs:', error)
  } finally {
    loading.value = false
  }
}

const fetchNamespaces = async () => {
  try {
    const response = await batataApi.getNamespaceList()
    namespaces.value = response.data.data || []
  } catch (error) {
    console.error('Failed to fetch namespaces:', error)
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchConfigs()
}

const handleReset = () => {
  Object.assign(searchParams, {
    dataId: '',
    groupName: '',
    appName: '',
    configTags: '',
    type: '',
    search: 'blur',
    showBetaOnly: false,
  })
  handleSearch()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchConfigs()
}

const toggleSelect = (id: string) => {
  const index = selectedIds.value.indexOf(id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(id)
  }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = configs.value.map((c) => c.id)
  }
}

const handleDelete = (config: ConfigInfo) => {
  configToDelete.value = config
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!configToDelete.value) return
  try {
    await batataApi.deleteConfig(
      configToDelete.value.dataId,
      configToDelete.value.groupName,
      props.namespace.namespace,
    )
    showDeleteModal.value = false
    fetchConfigs()
  } catch (error) {
    console.error('Failed to delete config:', error)
  }
}

const handleImport = () => {
  showImportModal.value = true
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  importFile.value = target.files?.[0] || null
}

const confirmImport = async () => {
  if (!importFile.value) return
  try {
    await batataApi.importConfig(importFile.value, props.namespace.namespace, importPolicy.value)
    showImportModal.value = false
    fetchConfigs()
  } catch (error) {
    console.error('Failed to import config:', error)
  }
}

const handleExport = async () => {
  if (selectedIds.value.length === 0) return
  try {
    const response = await batataApi.exportConfig(selectedIds.value)
    const blob = new Blob([response.data as BlobPart], { type: 'application/zip' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `batata_config_export_${Date.now()}.zip`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to export config:', error)
  }
}

const handleClone = (config: ConfigInfo) => {
  configToClone.value = config
  cloneTargetNs.value = namespaces.value[0]?.namespace || ''
  showCloneModal.value = true
}

const confirmClone = async () => {
  if (!configToClone.value) return
  try {
    await batataApi.cloneConfig({
      ids: configToClone.value.id,
      targetNamespaceId: cloneTargetNs.value,
      policy: clonePolicy.value,
    })
    showCloneModal.value = false
  } catch (error) {
    console.error('Failed to clone config:', error)
  }
}

const formatTime = (timestamp: number) => {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleString()
}

// Track which configs have beta versions
const betaConfigMap = ref<Map<string, boolean>>(new Map())

// Check if config has a beta version using the API
const checkBetaConfig = async (config: ConfigInfo) => {
  const key = `${config.dataId}:${config.groupName}`
  if (betaConfigMap.value.has(key)) return betaConfigMap.value.get(key)

  try {
    const response = await batataApi.getBetaConfig(
      config.dataId,
      config.groupName,
      props.namespace.namespace,
    )
    const hasBeta = !!response.data.data
    betaConfigMap.value.set(key, hasBeta)
    return hasBeta
  } catch {
    betaConfigMap.value.set(key, false)
    return false
  }
}

// Check if config is a beta config (by naming convention or has gray config)
const isBetaConfig = (config: ConfigInfo) => {
  // Check for beta tag in dataId (naming convention)
  const hasBetaTag = config.dataId.includes('-beta') || config.dataId.includes('.beta')
  // Also check the beta config map (for configs with gray release)
  const key = `${config.dataId}:${config.groupName}`
  return hasBetaTag || betaConfigMap.value.get(key) === true
}

// Check beta status for all configs after loading
const checkAllBetaConfigs = async () => {
  for (const config of configs.value) {
    await checkBetaConfig(config)
  }
}

// Promote modal
const showPromoteModal = ref(false)
const configToPromote = ref<ConfigInfo | null>(null)
const promoting = ref(false)

const handlePromote = (config: ConfigInfo) => {
  configToPromote.value = config
  showPromoteModal.value = true
}

const confirmPromote = async () => {
  if (!configToPromote.value) return
  promoting.value = true
  try {
    // Try to use the beta config API first
    try {
      await batataApi.promoteBetaConfig(
        configToPromote.value.dataId,
        configToPromote.value.groupName,
        props.namespace.namespace,
      )
    } catch {
      // Fallback: Get the current config content and publish as stable
      const response = await batataApi.getConfig(
        configToPromote.value.dataId,
        configToPromote.value.groupName,
        props.namespace.namespace,
      )
      const config = response.data.data

      // Create a new stable config (remove beta suffix if present)
      const stableDataId = config.dataId.replace('-beta', '').replace('.beta', '')

      await batataApi.publishConfig({
        dataId: stableDataId,
        groupName: config.groupName,
        content: config.content,
        type: config.type,
        namespaceId: props.namespace.namespace,
        appName: config.appName,
        desc: `Promoted from beta: ${config.dataId}`,
      })
    }

    showPromoteModal.value = false
    // Clear the beta config map and refetch
    betaConfigMap.value.clear()
    fetchConfigs()
  } catch (error) {
    console.error('Failed to promote config:', error)
  } finally {
    promoting.value = false
  }
}

// Watch namespace change
watch(
  () => props.namespace,
  () => {
    currentPage.value = 1
    fetchConfigs()
  },
)

// Lifecycle
onMounted(() => {
  fetchConfigs()
  fetchNamespaces()
})
</script>
