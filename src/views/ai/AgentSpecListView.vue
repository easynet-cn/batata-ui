<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('agentSpecs') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('agentSpecsDesc') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="showUploadModal = true" class="btn btn-secondary btn-sm">
          <Upload class="w-3.5 h-3.5" />
          {{ t('uploadAgentSpec') }}
        </button>
        <button @click="handleCreate" class="btn btn-primary btn-sm">
          <Plus class="w-3.5 h-3.5" />
          {{ t('createAgentSpec') }}
        </button>
      </div>
    </div>

    <!-- Search Bar -->
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
          <button @click="handleSearch" class="btn btn-primary">
            <Search class="w-3.5 h-3.5" />
            {{ t('search') }}
          </button>
          <button @click="handleReset" class="btn btn-secondary">
            <RotateCcw class="w-3.5 h-3.5" />
            {{ t('reset') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Card Grid -->
    <div v-if="loading" class="card p-8 flex-center">
      <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
    </div>
    <div v-else-if="items.length === 0" class="card empty-state">
      {{ t('noData') }}
    </div>
    <div v-else class="card-grid">
      <div v-for="item in items" :key="item.name" class="card hover:shadow-md transition-shadow">
        <div class="p-3">
          <!-- Card Header -->
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-2">
              <div
                class="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center"
              >
                <FileCode class="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 class="font-medium text-text-primary">{{ item.name }}</h3>
                <span
                  :class="item.scope === 'public' ? 'badge badge-success' : 'badge badge-warning'"
                >
                  {{ item.scope === 'public' ? t('skillScopePublic') : t('skillScopePrivate') }}
                </span>
              </div>
            </div>
            <span :class="item.enable ? 'badge badge-success' : 'badge badge-danger'">
              {{ item.enable ? t('enabled') : t('disabled') }}
            </span>
          </div>

          <!-- Description -->
          <p class="text-sm text-text-secondary mb-3 line-clamp-2">
            {{ item.description || t('noDescription') }}
          </p>

          <!-- Stats -->
          <div class="flex items-center gap-3 text-xs text-text-tertiary mb-3">
            <span class="flex items-center gap-1">
              <Globe class="w-3 h-3" />
              {{ item.onlineCnt }} {{ t('onlineCnt') }}
            </span>
            <span class="flex items-center gap-1">
              <Download class="w-3 h-3" />
              {{ item.downloadCount }} {{ t('downloadCount') }}
            </span>
          </div>

          <!-- Update Time -->
          <div class="text-xs text-text-tertiary mb-3">
            {{ new Date(item.updateTime).toLocaleString() }}
          </div>

          <!-- Labels -->
          <div
            v-if="item.labels && Object.keys(item.labels).length > 0"
            class="flex flex-wrap gap-1 mb-2"
          >
            <span v-for="(value, key) in item.labels" :key="key" class="badge badge-info">
              {{ key }}={{ value }}
            </span>
          </div>

          <!-- Biz Tags -->
          <div v-if="item.bizTags" class="flex flex-wrap gap-1 mb-3">
            <span v-for="tag in item.bizTags.split(',')" :key="tag" class="badge">
              {{ tag.trim() }}
            </span>
          </div>

          <!-- Card Actions -->
          <div class="flex items-center justify-end gap-1 pt-3 border-t border-border">
            <button
              @click="handleViewDetail(item)"
              class="btn btn-ghost btn-sm"
              :title="t('viewDetail')"
            >
              <Eye class="w-3.5 h-3.5" />
            </button>
            <button
              @click="handleDelete(item)"
              class="btn btn-ghost btn-sm text-danger"
              :title="t('delete')"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
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
import { useRouter } from 'vue-router'
import {
  Plus,
  Search,
  RotateCcw,
  Trash2,
  Loader2,
  Upload,
  Download,
  Eye,
  Globe,
  FileCode,
} from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import { useListView } from '@/composables/useListView'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import FormModal from '@/components/common/FormModal.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import type { AgentSpecListItem } from '@/types'

const router = useRouter()
const { t } = useI18n()

const {
  loading,
  items,
  total,
  currentPage,
  pageSize,
  searchKeyword,
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
  handleReset,
  handlePageChange,
} = useListView<AgentSpecListItem>({
  fetchFn: (params) => batataApi.getAgentSpecList({ ...params }),
  deleteFn: (ns, name) => batataApi.deleteAgentSpec(ns, name),
  uploadFn: (fd) => batataApi.uploadAgentSpec(fd),
  getItemName: (item) => item.name,
  searchParamKey: 'agentSpecName',
})

const handleCreate = () => {
  router.push('/ai/agent-specs/new')
}

const handleViewDetail = (item: AgentSpecListItem) => {
  router.push(`/ai/agent-specs/detail?agentSpecName=${encodeURIComponent(item.name)}`)
}
</script>
