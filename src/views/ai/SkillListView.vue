<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('skills') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('skillsDesc') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <!-- Batch Delete -->
        <template v-if="selectedNames.size > 0">
          <span class="text-xs text-text-secondary">{{ selectedNames.size }} {{ t('items') }}</span>
          <button @click="showBatchDeleteModal = true" class="btn btn-danger btn-sm">
            <Trash2 class="w-3.5 h-3.5" />
            {{ t('batchDelete') }}
          </button>
          <button @click="clearSelection()" class="btn btn-secondary btn-sm">
            {{ t('cancel') }}
          </button>
        </template>
        <template v-else>
          <button @click="showUploadModal = true" class="btn btn-secondary btn-sm">
            <Upload class="w-3.5 h-3.5" />
            {{ t('uploadSkill') }}
          </button>
          <button @click="router.push('/skill/new')" class="btn btn-primary btn-sm">
            <Plus class="w-3.5 h-3.5" />
            {{ t('createSkill') }}
          </button>
        </template>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="card p-3">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex-center">
            <Sparkles class="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p class="text-lg font-bold text-text-primary">{{ total }}</p>
            <p class="text-[10px] text-text-tertiary">{{ t('skills') }}</p>
          </div>
        </div>
      </div>
      <div class="card p-3">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex-center">
            <Globe class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p class="text-lg font-bold text-text-primary">{{ onlineCount }}</p>
            <p class="text-[10px] text-text-tertiary">{{ t('skillOnline') }}</p>
          </div>
        </div>
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
              :placeholder="t('skillNamePlaceholder')"
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
            @click="handleResetAll"
            class="btn btn-secondary"
          >
            <RotateCcw class="w-3.5 h-3.5" />
            {{ t('reset') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      <div v-for="i in 8" :key="i" class="card p-4 animate-pulse">
        <div class="h-10 bg-bg-secondary rounded-lg mb-3" />
        <div class="h-4 bg-bg-secondary rounded w-3/4 mb-2" />
        <div class="h-4 bg-bg-secondary rounded w-1/2" />
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="items.length === 0" class="card empty-state">
      <Sparkles class="w-10 h-10 mx-auto text-text-tertiary mb-2" />
      <p class="text-sm text-text-secondary">{{ t('noData') }}</p>
      <button @click="router.push('/skill/new')" class="btn btn-primary btn-sm mt-3">
        <Plus class="w-3.5 h-3.5" />
        {{ t('createSkill') }}
      </button>
    </div>

    <!-- Card Grid -->
    <template v-else>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        <div
          v-for="skill in items"
          :key="skill.name"
          class="card hover:shadow-sm transition-all cursor-pointer"
          :class="{
            'ring-2 ring-primary border-primary/40': selectedNames.has(skill.name),
          }"
          @click="router.push(`/skill/detail?skillName=${encodeURIComponent(skill.name)}`)"
        >
          <div class="p-3">
            <!-- Card Header -->
            <div class="flex items-start justify-between mb-2">
              <div class="flex items-center gap-2 min-w-0">
                <input
                  type="checkbox"
                  :checked="selectedNames.has(skill.name)"
                  @click.stop
                  @change.stop="toggleSelect(skill.name)"
                  class="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary flex-shrink-0"
                />
                <div
                  class="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center flex-shrink-0"
                >
                  <Sparkles class="w-4 h-4 text-white" />
                </div>
                <h3 class="font-medium text-text-primary truncate text-sm">{{ skill.name }}</h3>
              </div>
            </div>

            <!-- Status Row -->
            <div class="flex items-center gap-1.5 mb-2">
              <span :class="skill.enable ? 'badge badge-success' : 'badge badge-secondary'">
                {{ skill.enable ? t('enabled') : t('disabled') }}
              </span>
              <span :class="skill.scope === 'public' ? 'badge badge-info' : 'badge badge-warning'">
                {{ skill.scope === 'public' ? t('skillScopePublic') : t('skillScopePrivate') }}
              </span>
              <span v-if="skill.editingVersion" class="badge badge-warning">
                {{ t('hasDraft') }}
              </span>
            </div>

            <!-- Description -->
            <p class="text-xs text-text-secondary mb-2 line-clamp-2">
              {{ skill.description || '-' }}
            </p>

            <!-- Meta -->
            <div class="flex items-center flex-wrap gap-2 text-xs text-text-tertiary mb-2">
              <span
                class="flex items-center gap-1"
                :class="skill.onlineCnt > 0 ? 'text-emerald-600 dark:text-emerald-400' : ''"
              >
                <Globe class="w-3 h-3" />
                {{ skill.onlineCnt }}
              </span>
              <span class="flex items-center gap-1">
                <Download class="w-3 h-3" />
                {{ skill.downloadCount }}
              </span>
              <span class="flex items-center gap-1">
                <Clock class="w-3 h-3" />
                {{ new Date(skill.updateTime).toLocaleString() }}
              </span>
            </div>

            <!-- Biz Tags -->
            <BizTagList v-if="skill.bizTags" :biz-tags="skill.bizTags" class="mb-2" />

            <!-- Footer -->
            <div class="flex items-center justify-end gap-1 pt-2 border-t border-border">
              <button
                @click.stop="
                  router.push(`/skill/detail?skillName=${encodeURIComponent(skill.name)}`)
                "
                class="btn btn-ghost btn-sm"
              >
                <ExternalLink class="w-3.5 h-3.5" />
                {{ t('details') }}
              </button>
              <button @click.stop="handleDelete(skill)" class="btn btn-ghost btn-sm text-danger">
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <AppPagination
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        @change="handlePageChange"
      />
    </template>

    <ConfirmModal
      v-model="showDeleteModal"
      :title="t('deleteSkill')"
      :message="`${t('deleteSkillConfirm')} ${itemToDelete?.name}?`"
      :confirm-text="t('delete')"
      danger
      @confirm="confirmDelete"
    />

    <ConfirmModal
      v-model="showBatchDeleteModal"
      :title="t('batchDelete')"
      :message="`${t('batchDelete')} ${selectedNames.size} ${t('items')}?`"
      :confirm-text="t('delete')"
      danger
      @confirm="confirmBatchDelete"
    />

    <FormModal
      v-model="showUploadModal"
      :title="t('uploadSkill')"
      :submit-text="t('uploadSkill')"
      :submit-disabled="!uploadFile"
      :loading="uploading"
      @submit="handleUpload"
    >
      <div class="space-y-3">
        <p class="text-xs text-text-secondary">{{ t('uploadSkillZip') }}</p>
        <input type="file" accept=".zip" class="input" @change="handleFileChange" />
      </div>
    </FormModal>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus,
  Search,
  RotateCcw,
  Trash2,
  Upload,
  Download,
  Globe,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import { useListView } from '@/composables/useListView'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import FormModal from '@/components/common/FormModal.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import BizTagList from '@/components/common/BizTagList.vue'
import type { SkillListItem } from '@/types'

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
  // Batch selection from composable
  selectedNames,
  showBatchDeleteModal,
  toggleSelect,
  clearSelection,
  confirmBatchDelete,
} = useListView<SkillListItem>({
  fetchFn: (params) =>
    batataApi.getSkillList({
      pageNo: params.pageNo,
      pageSize: params.pageSize,
      namespaceId: params.namespaceId as string,
      skillName: params.skillName as string | undefined,
      search: scopeFilter.value || undefined,
      orderBy: sortOrder.value || undefined,
    }),
  deleteFn: (ns, name) => batataApi.deleteSkill(ns, name),
  uploadFn: (formData) => batataApi.uploadSkill(formData),
  getItemName: (item) => item.name,
  searchParamKey: 'skillName',
  pageSize: 12,
})

const onlineCount = computed(() => items.value.filter((s) => s.onlineCnt > 0).length)

const handleResetAll = () => {
  searchKeyword.value = ''
  scopeFilter.value = ''
  sortOrder.value = ''
  handleSearch()
}
</script>
