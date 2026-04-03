<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('agentSpecs') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('agentSpecsDesc') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <!-- Batch Delete -->
        <template v-if="selectedNames.size > 0">
          <span class="text-xs text-text-secondary">{{ selectedNames.size }} {{ t('items') }}</span>
          <button @click="showBatchDeleteModal = true" class="btn btn-danger btn-sm">
            <Trash2 class="w-3.5 h-3.5" />
            {{ t('batchDelete') }}
          </button>
          <button @click="selectedNames.clear()" class="btn btn-secondary btn-sm">
            {{ t('cancel') }}
          </button>
        </template>
        <template v-else>
          <button @click="showUploadModal = true" class="btn btn-secondary btn-sm">
            <Upload class="w-3.5 h-3.5" />
            {{ t('uploadAgentSpec') }}
          </button>
          <button @click="handleCreate" class="btn btn-primary btn-sm">
            <Plus class="w-3.5 h-3.5" />
            {{ t('createAgentSpec') }}
          </button>
        </template>
      </div>
    </div>

    <!-- Search & Filters -->
    <div class="card">
      <div class="p-3">
        <div class="flex items-center gap-3">
          <div class="flex-1">
            <input
              v-model="searchKeyword"
              type="text"
              class="input"
              :placeholder="t('agentSpecNamePlaceholder')"
              @keyup.enter="handleSearch"
            />
          </div>
          <!-- Scope Filter -->
          <select v-model="scopeFilter" class="input w-32" @change="handleSearch">
            <option value="">{{ t('scopeAll') }}</option>
            <option value="public">{{ t('skillScopePublic') }}</option>
            <option value="private">{{ t('skillScopePrivate') }}</option>
          </select>
          <!-- Sort -->
          <select v-model="sortOrder" class="input w-32" @change="handleSearch">
            <option value="">{{ t('sortDefault') }}</option>
            <option value="downloadCount">{{ t('sortDownloads') }}</option>
          </select>
          <button @click="handleSearch" class="btn btn-primary">
            <Search class="w-3.5 h-3.5" />
            {{ t('search') }}
          </button>
          <button
            v-if="searchKeyword || scopeFilter || sortOrder"
            @click="handleReset"
            class="btn btn-secondary"
          >
            <RotateCcw class="w-3.5 h-3.5" />
            {{ t('reset') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Card Grid -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      <div v-for="i in 8" :key="i" class="card p-4 animate-pulse">
        <div class="h-10 bg-bg-secondary rounded-lg mb-3" />
        <div class="h-4 bg-bg-secondary rounded w-3/4 mb-2" />
        <div class="h-4 bg-bg-secondary rounded w-1/2" />
      </div>
    </div>
    <div v-else-if="items.length === 0" class="card empty-state">
      <FileCode class="w-10 h-10 mx-auto text-text-tertiary mb-2" />
      <p class="text-sm text-text-secondary">{{ t('noData') }}</p>
      <button @click="handleCreate" class="btn btn-primary btn-sm mt-3">
        <Plus class="w-3.5 h-3.5" />
        {{ t('createAgentSpec') }}
      </button>
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      <div
        v-for="item in items"
        :key="item.name"
        class="card hover:shadow-sm transition-all cursor-pointer"
        :class="{
          'ring-2 ring-primary border-primary/40': selectedNames.has(item.name),
        }"
        @click="handleViewDetail(item)"
      >
        <div class="p-3">
          <!-- Card Header -->
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-center gap-2 min-w-0">
              <input
                type="checkbox"
                :checked="selectedNames.has(item.name)"
                @click.stop
                @change.stop="toggleSelect(item.name)"
                class="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary flex-shrink-0"
              />
              <div
                class="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0"
              >
                <FileCode class="w-4 h-4 text-white" />
              </div>
              <h3 class="font-medium text-text-primary truncate text-sm">{{ item.name }}</h3>
            </div>
          </div>

          <!-- Status Row -->
          <div class="flex items-center gap-1.5 mb-2">
            <span :class="item.enable ? 'badge badge-success' : 'badge badge-secondary'">
              {{ item.enable ? t('enabled') : t('disabled') }}
            </span>
            <span :class="item.scope === 'public' ? 'badge badge-info' : 'badge badge-warning'">
              {{ item.scope === 'public' ? t('skillScopePublic') : t('skillScopePrivate') }}
            </span>
            <span v-if="item.editingVersion" class="badge badge-warning">
              {{ t('hasDraft') }}
            </span>
          </div>

          <!-- Description -->
          <p class="text-xs text-text-secondary mb-2 line-clamp-2">
            {{ item.description || t('noDescription') }}
          </p>

          <!-- Meta -->
          <div class="flex items-center flex-wrap gap-2 text-xs text-text-tertiary mb-2">
            <span
              class="flex items-center gap-1"
              :class="item.onlineCnt > 0 ? 'text-emerald-600 dark:text-emerald-400' : ''"
            >
              <Globe class="w-3 h-3" />
              {{ item.onlineCnt }}
            </span>
            <span class="flex items-center gap-1">
              <Download class="w-3 h-3" />
              {{ item.downloadCount }}
            </span>
          </div>

          <!-- Biz Tags -->
          <div v-if="item.bizTags" class="flex flex-wrap gap-1 mb-2">
            <span
              v-for="tag in item.bizTags.split(',').slice(0, 2)"
              :key="tag"
              class="px-1.5 py-0.5 text-[10px] rounded bg-gray-100 dark:bg-gray-800 text-text-secondary"
            >
              {{ tag.trim() }}
            </span>
            <span v-if="item.bizTags.split(',').length > 2" class="text-[10px] text-text-tertiary">
              +{{ item.bizTags.split(',').length - 2 }}
            </span>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between pt-2 border-t border-border">
            <span class="text-[10px] text-text-tertiary">
              {{ new Date(item.updateTime).toLocaleString() }}
            </span>
            <div class="flex items-center gap-1">
              <button
                @click.stop="handleViewDetail(item)"
                class="btn btn-ghost btn-sm"
                :title="t('viewDetail')"
              >
                <ExternalLink class="w-3.5 h-3.5" />
              </button>
              <button
                @click.stop="handleDelete(item)"
                class="btn btn-ghost btn-sm text-danger"
                :title="t('delete')"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="!loading && items.length > 0" class="card">
      <AppPagination
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        @change="handlePageChange"
      />
    </div>

    <!-- Delete Confirm Modal -->
    <ConfirmModal
      v-model="showDeleteModal"
      :title="t('deleteAgentSpec')"
      :message="`${t('deleteAgentSpecConfirm')} ${itemToDelete?.name}?`"
      :confirm-text="t('delete')"
      danger
      @confirm="confirmDelete"
    />

    <!-- Batch Delete Confirm Modal -->
    <ConfirmModal
      v-model="showBatchDeleteModal"
      :title="t('batchDelete')"
      :message="`${t('batchDelete')} ${selectedNames.size} ${t('items')}?`"
      :confirm-text="t('delete')"
      danger
      @confirm="confirmBatchDelete"
    />

    <!-- Upload Modal -->
    <FormModal
      v-model="showUploadModal"
      :title="t('uploadAgentSpec')"
      :submit-text="t('upload')"
      :submit-disabled="!uploadFile"
      :loading="uploading"
      @submit="handleUpload"
    >
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-text-secondary mb-1">
            {{ t('uploadSkillZip') }}
          </label>
          <input type="file" accept=".zip" class="input" @change="handleFileChange" />
        </div>
      </div>
    </FormModal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus,
  Search,
  RotateCcw,
  Trash2,
  Upload,
  Download,
  Globe,
  FileCode,
  ExternalLink,
} from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import { useListView } from '@/composables/useListView'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import FormModal from '@/components/common/FormModal.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import type { AgentSpecListItem } from '@/types'

const router = useRouter()
const { t } = useI18n()

// Filters
const scopeFilter = ref('')
const sortOrder = ref('')

const {
  loading,
  items,
  total,
  currentPage,
  pageSize,
  searchKeyword,
  namespace,
  showDeleteModal,
  itemToDelete,
  handleDelete,
  confirmDelete,
  showUploadModal,
  uploadFile,
  uploading,
  handleFileChange,
  handleUpload,
  handleSearch,
  handlePageChange,
  fetchItems,
} = useListView<AgentSpecListItem>({
  fetchFn: (params) =>
    batataApi.getAgentSpecList({
      ...params,
      agentSpecName: params.agentSpecName as string | undefined,
      search: scopeFilter.value || undefined,
      orderBy: sortOrder.value || undefined,
    }),
  deleteFn: (ns, name) => batataApi.deleteAgentSpec(ns, name),
  uploadFn: (fd) => batataApi.uploadAgentSpec(fd),
  getItemName: (item) => item.name,
  searchParamKey: 'agentSpecName',
})

const handleReset = () => {
  searchKeyword.value = ''
  scopeFilter.value = ''
  sortOrder.value = ''
  handleSearch()
}

// Batch selection
const selectedNames = ref<Set<string>>(new Set())
const showBatchDeleteModal = ref(false)

const toggleSelect = (name: string) => {
  const newSet = new Set(selectedNames.value)
  if (newSet.has(name)) {
    newSet.delete(name)
  } else {
    newSet.add(name)
  }
  selectedNames.value = newSet
}

const confirmBatchDelete = async () => {
  try {
    const names = Array.from(selectedNames.value)
    await Promise.all(names.map((name) => batataApi.deleteAgentSpec(namespace.value, name)))
    toast.success(t('batchDelete'))
    showBatchDeleteModal.value = false
    selectedNames.value = new Set()
    fetchItems()
  } catch (error) {
    logger.error('Failed to batch delete:', error)
    toast.apiError(error)
  }
}

const handleCreate = () => {
  router.push('/ai/agent-specs/new')
}

const handleViewDetail = (item: AgentSpecListItem) => {
  router.push(`/ai/agent-specs/detail?agentSpecName=${encodeURIComponent(item.name)}`)
}
</script>
