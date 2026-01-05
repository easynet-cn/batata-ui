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
            <label class="block text-xs font-medium text-text-secondary mb-1">Data ID</label>
            <input
              v-model="searchParams.dataId"
              type="text"
              class="input"
              placeholder="Data ID"
              @keyup.enter="handleSearch"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-text-secondary mb-1">Group</label>
            <input
              v-model="searchParams.group"
              type="text"
              class="input"
              placeholder="Group"
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
            <input v-model="searchParams.tags" type="text" class="input" :placeholder="t('tags')" />
          </div>
          <div>
            <label class="block text-xs font-medium text-text-secondary mb-1">{{
              t('configType')
            }}</label>
            <select v-model="searchParams.types" class="input">
              <option value="">{{ t('all') }}</option>
              <option value="json">JSON</option>
              <option value="yaml">YAML</option>
              <option value="properties">Properties</option>
              <option value="xml">XML</option>
              <option value="text">Text</option>
            </select>
          </div>
          <div class="flex items-center gap-2 md:col-span-2">
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
              <th>Data ID</th>
              <th>Group</th>
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
                      group: config.group,
                      tenant: namespace.namespace,
                    },
                  }"
                  class="text-primary hover:underline font-medium"
                >
                  {{ config.dataId }}
                </router-link>
              </td>
              <td>{{ config.group }}</td>
              <td>{{ config.appName || '-' }}</td>
              <td>
                <span class="badge badge-info">{{ config.type?.toUpperCase() || 'TEXT' }}</span>
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
                        group: config.group,
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
                        group: config.group,
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
                        group: config.group,
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
} from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import nacosApi from '@/api/nacos'
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
  group: '',
  appName: '',
  tags: '',
  types: '',
  search: 'blur' as 'accurate' | 'blur',
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
    const response = await nacosApi.getConfigList({
      pageNo: currentPage.value,
      pageSize: pageSize.value,
      tenant: props.namespace.namespace,
      ...searchParams,
    })
    configs.value = response.data.data.pageItems || []
    total.value = response.data.data.totalCount || 0
  } catch (error) {
    console.error('Failed to fetch configs:', error)
  } finally {
    loading.value = false
  }
}

const fetchNamespaces = async () => {
  try {
    const response = await nacosApi.getNamespaceList()
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
    group: '',
    appName: '',
    tags: '',
    types: '',
    search: 'blur',
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
    await nacosApi.deleteConfig(
      configToDelete.value.dataId,
      configToDelete.value.group,
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
    await nacosApi.importConfig(importFile.value, props.namespace.namespace, importPolicy.value)
    showImportModal.value = false
    fetchConfigs()
  } catch (error) {
    console.error('Failed to import config:', error)
  }
}

const handleExport = async () => {
  if (selectedIds.value.length === 0) return
  try {
    const response = await nacosApi.exportConfig(selectedIds.value)
    const blob = new Blob([response.data as BlobPart], { type: 'application/zip' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nacos_config_export_${Date.now()}.zip`
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
    await nacosApi.cloneConfig({
      ids: [configToClone.value.id],
      targetTenant: cloneTargetNs.value,
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
