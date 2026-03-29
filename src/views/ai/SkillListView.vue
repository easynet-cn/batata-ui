<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('skills') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('skillsDesc') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="showUploadModal = true" class="btn btn-secondary btn-sm">
          <Upload class="w-3.5 h-3.5" />
          {{ t('uploadSkill') }}
        </button>
        <button @click="router.push('/skill/new')" class="btn btn-primary btn-sm">
          <Plus class="w-3.5 h-3.5" />
          {{ t('createSkill') }}
        </button>
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

    <!-- Search Bar -->
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
          <button @click="handleSearch" class="btn btn-primary">
            <Search class="w-3.5 h-3.5" />
            {{ t('search') }}
          </button>
          <button @click="handleReset" class="btn btn-secondary">
            {{ t('refresh') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="card p-8 flex-center">
      <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>

    <!-- Empty State -->
    <div v-else-if="items.length === 0" class="card empty-state">
      {{ t('noData') }}
    </div>

    <!-- Card Grid -->
    <template v-else>
      <div class="card-grid">
        <div v-for="skill in items" :key="skill.name" class="card p-4 flex flex-col gap-3">
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <h3 class="text-sm font-semibold text-text-primary truncate">{{ skill.name }}</h3>
              <p class="text-xs text-text-secondary mt-0.5 line-clamp-2">
                {{ skill.description || '-' }}
              </p>
            </div>
            <span :class="skill.scope === 'public' ? 'badge badge-success' : 'badge badge-info'">
              {{ skill.scope === 'public' ? t('skillScopePublic') : t('skillScopePrivate') }}
            </span>
          </div>

          <div class="flex items-center gap-4 text-xs text-text-tertiary">
            <span class="flex items-center gap-1">
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

          <div
            v-if="skill.labels && Object.keys(skill.labels).length > 0"
            class="flex flex-wrap gap-1"
          >
            <span v-for="(value, key) in skill.labels" :key="key" class="badge badge-info">
              {{ key }}={{ value }}
            </span>
          </div>

          <div v-if="skill.bizTags" class="flex flex-wrap gap-1">
            <span v-for="tag in skill.bizTags.split(',')" :key="tag" class="badge">
              {{ tag.trim() }}
            </span>
          </div>

          <div class="flex items-center gap-1 mt-auto pt-2 border-t border-border">
            <button
              @click="router.push(`/skill/detail?skillName=${encodeURIComponent(skill.name)}`)"
              class="btn btn-ghost btn-sm flex-1"
            >
              <Eye class="w-3.5 h-3.5" />
              {{ t('details') }}
            </button>
            <button @click="handleDelete(skill)" class="btn btn-ghost btn-sm text-danger">
              <Trash2 class="w-3.5 h-3.5" />
              {{ t('delete') }}
            </button>
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
  Eye,
  Trash2,
  Loader2,
  Upload,
  Download,
  Globe,
  Clock,
  Sparkles,
} from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import { useListView } from '@/composables/useListView'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import FormModal from '@/components/common/FormModal.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import type { SkillListItem } from '@/types'

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
} = useListView<SkillListItem>({
  fetchFn: (params) =>
    batataApi.getSkillList({
      pageNo: params.pageNo,
      pageSize: params.pageSize,
      namespaceId: params.namespaceId as string,
      skillName: params.skillName as string | undefined,
    }),
  deleteFn: (ns, name) => batataApi.deleteSkill(ns, name),
  uploadFn: (formData) => batataApi.uploadSkill(formData),
  getItemName: (item) => item.name,
  searchParamKey: 'skillName',
  pageSize: 12,
})

const onlineCount = computed(() => items.value.filter((s) => s.onlineCnt > 0).length)
</script>
