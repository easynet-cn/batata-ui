<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('prompts') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('promptsDesc') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="selectedKeys.size > 0"
          @click="handleBatchDelete"
          class="btn btn-danger btn-sm"
        >
          <Trash2 class="w-3.5 h-3.5" />
          {{ t('batchDelete') }} ({{ selectedKeys.size }})
        </button>
        <button @click="handleCreate" class="btn btn-primary btn-sm">
          <Plus class="w-3.5 h-3.5" />
          {{ t('createPrompt') }}
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
              :placeholder="t('promptKeyPlaceholder')"
              @keyup.enter="handleSearch"
            />
          </div>
          <div class="flex items-center gap-1.5">
            <button
              @click="searchMode = 'blur'"
              :class="['btn btn-sm', searchMode === 'blur' ? 'btn-primary' : 'btn-secondary']"
            >
              {{ t('fuzzySearch') }}
            </button>
            <button
              @click="searchMode = 'accurate'"
              :class="['btn btn-sm', searchMode === 'accurate' ? 'btn-primary' : 'btn-secondary']"
            >
              {{ t('exactSearch') }}
            </button>
          </div>
          <button @click="handleSearch" class="btn btn-primary">
            <Search class="w-3.5 h-3.5" />
            {{ t('search') }}
          </button>
          <button v-if="searchKeyword" @click="handleResetSearch" class="btn btn-secondary">
            <RotateCcw class="w-3.5 h-3.5" />
            {{ t('reset') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="card p-8 flex-center">
      <Loader2 class="w-8 h-8 animate-spin mx-auto text-primary" />
    </div>

    <!-- Empty State -->
    <div v-else-if="items.length === 0" class="card p-8 empty-state">
      <FileText class="w-10 h-10 mx-auto text-text-tertiary mb-2" />
      <p class="text-sm text-text-secondary">{{ t('noData') }}</p>
    </div>

    <!-- Card Grid -->
    <template v-else>
      <!-- Select All -->
      <div class="flex items-center gap-2">
        <input
          type="checkbox"
          :checked="selectedKeys.size === items.length && items.length > 0"
          @change="toggleSelectAll"
          class="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary"
        />
        <span class="text-xs text-text-secondary">
          {{ selectedKeys.size > 0 ? `${selectedKeys.size} ${t('items')}` : t('selectAll') }}
        </span>
      </div>

      <div class="card-grid">
        <div
          v-for="prompt in items"
          :key="prompt.promptKey"
          class="card hover:shadow-md transition-shadow"
        >
          <div class="p-4">
            <div class="flex items-start justify-between mb-2">
              <div class="flex items-center gap-2 min-w-0">
                <input
                  type="checkbox"
                  :checked="selectedKeys.has(prompt.promptKey)"
                  @change="toggleSelect(prompt.promptKey)"
                  class="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary flex-shrink-0"
                />
                <h3
                  class="text-sm font-semibold text-text-primary truncate cursor-pointer hover:text-primary"
                  @click="handleViewDetail(prompt)"
                >
                  {{ prompt.promptKey }}
                </h3>
              </div>
              <span v-if="prompt.latestVersion" class="badge badge-info flex-shrink-0 ml-2">
                v{{ prompt.latestVersion }}
              </span>
            </div>

            <p class="text-xs text-text-secondary mb-3 line-clamp-2">
              {{ prompt.description || '-' }}
            </p>

            <!-- Biz Tags -->
            <div
              v-if="prompt.bizTags && prompt.bizTags.length > 0"
              class="flex flex-wrap gap-1 mb-3"
            >
              <span
                v-for="tag in prompt.bizTags.slice(0, 3)"
                :key="tag"
                class="badge badge-default"
              >
                {{ tag }}
              </span>
              <span v-if="prompt.bizTags.length > 3" class="text-[10px] text-text-tertiary">
                +{{ prompt.bizTags.length - 3 }}
              </span>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-between pt-2 border-t border-border">
              <span class="text-[10px] text-text-tertiary">
                {{ new Date(prompt.gmtModified).toLocaleString() }}
              </span>
              <div class="flex items-center gap-1">
                <button
                  @click="handleViewDetail(prompt)"
                  class="btn btn-ghost btn-sm"
                  :title="t('viewDetail')"
                >
                  <Eye class="w-3.5 h-3.5" />
                </button>
                <button
                  @click="handleDelete(prompt)"
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
      <div class="card">
        <AppPagination
          :current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          @change="handlePageChange"
        />
      </div>
    </template>

    <!-- Delete Confirm Modal -->
    <ConfirmModal
      v-model="showDeleteModal"
      :title="t('confirmDelete')"
      :message="`${t('deletePromptConfirm')} ${itemToDelete?.promptKey}?`"
      :confirm-text="t('delete')"
      danger
      @confirm="confirmDelete"
    />

    <!-- Batch Delete Confirm Modal -->
    <ConfirmModal
      v-model="showBatchDeleteModal"
      :title="t('confirmDelete')"
      :message="`${t('batchDelete')} ${selectedKeys.size} ${t('items')}?`"
      :confirm-text="t('delete')"
      danger
      @confirm="confirmBatchDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Search, Trash2, Loader2, Eye, FileText, RotateCcw } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import { useListView } from '@/composables/useListView'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import type { PromptMetaSummary } from '@/types'

const router = useRouter()
const { t } = useI18n()

// Local state: search mode (blur/accurate)
const searchMode = ref<'blur' | 'accurate'>('blur')

// Use list view composable (with batch selection)
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
  handleSearch,
  handlePageChange,
  // Batch selection from composable
  selectedNames: selectedKeys,
  showBatchDeleteModal,
  toggleSelect,
  toggleSelectAll,
  confirmBatchDelete,
} = useListView<PromptMetaSummary>({
  fetchFn: (params) =>
    batataApi.getPromptList({
      ...params,
      promptKey: params.promptKey as string | undefined,
      search: params.promptKey ? searchMode.value : undefined,
    }),
  deleteFn: (ns, name) => batataApi.deletePrompt(name, ns),
  getItemName: (item) => item.promptKey,
  searchParamKey: 'promptKey',
})

const handleResetSearch = () => {
  searchKeyword.value = ''
  handleSearch()
}

const handleBatchDelete = () => {
  showBatchDeleteModal.value = true
}

// Navigation
const handleCreate = () => {
  router.push('/prompt/editor')
}

const handleViewDetail = (prompt: PromptMetaSummary) => {
  router.push(`/prompt/detail?promptKey=${encodeURIComponent(prompt.promptKey)}`)
}
</script>
