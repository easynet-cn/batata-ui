<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('agents') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('agentsDesc') }}</p>
      </div>
      <button @click="handleCreate" class="btn btn-primary btn-sm">
        <Plus class="w-3.5 h-3.5" />
        {{ t('createAgent') }}
      </button>
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
              :placeholder="t('searchAgent')"
              @keyup.enter="handleSearch"
            />
          </div>
          <button @click="handleSearch" class="btn btn-primary">
            <Search class="w-3.5 h-3.5" />
            {{ t('search') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Agent List -->
    <div v-if="loading" class="card p-8 flex-center">
      <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
    </div>
    <div v-else-if="items.length === 0" class="card empty-state">
      {{ t('noData') }}
    </div>
    <div v-else class="card-grid">
      <div v-for="agent in items" :key="agent.id" class="card hover:shadow-md transition-shadow">
        <div class="p-3">
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-2">
              <div class="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center">
                <Bot class="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 class="font-medium text-text-primary">{{ agent.name }}</h3>
                <p class="text-xs text-text-tertiary">{{ agent.model || 'default' }}</p>
              </div>
            </div>
            <span :class="agent.enabled ? 'badge badge-success' : 'badge badge-danger'">
              {{ agent.enabled ? t('enabled') : t('disabled') }}
            </span>
          </div>

          <p class="text-sm text-text-secondary mb-4 line-clamp-2">
            {{ agent.description || t('noDescription') }}
          </p>

          <div class="flex items-center gap-2 text-xs text-text-tertiary mb-4">
            <span class="flex items-center gap-1">
              <Server class="w-3 h-3" />
              {{ agent.mcpServers?.length || 0 }} {{ t('mcpServers') }}
            </span>
            <span class="flex items-center gap-1">
              <Wrench class="w-3 h-3" />
              {{ agent.tools?.length || 0 }} {{ t('tools') }}
            </span>
          </div>

          <div class="flex items-center justify-end gap-1 pt-3 border-t border-border">
            <button @click="handleEdit(agent)" class="btn btn-ghost btn-sm" :title="t('edit')">
              <Pencil class="w-3.5 h-3.5" />
            </button>
            <button
              @click="handleToggleStatus(agent)"
              class="btn btn-ghost btn-sm"
              :title="agent.enabled ? t('disable') : t('enable')"
            >
              <component :is="agent.enabled ? PowerOff : Power" class="w-3.5 h-3.5" />
            </button>
            <button
              @click="handleDelete(agent)"
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
      :title="t('confirmDelete')"
      :message="`${t('confirmDeleteAgent')} ${itemToDelete?.name}?`"
      :confirm-text="t('delete')"
      danger
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Power,
  PowerOff,
  Bot,
  Server,
  Wrench,
} from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import { useListView } from '@/composables/useListView'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import type { AgentInfo } from '@/types'

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
  fetchItems,
  handleSearch,
  handlePageChange,
} = useListView<AgentInfo>({
  fetchFn: (params) => batataApi.getAgentList({ ...params }),
  deleteFn: (ns, name) => batataApi.deleteAgent(ns, name),
  getItemName: (item) => item.name,
  searchParamKey: 'name',
})

const handleCreate = () => {
  router.push('/agent/new')
}

const handleEdit = (agent: AgentInfo) => {
  router.push(
    `/agent/edit?namespace=${encodeURIComponent(agent.namespace || 'default')}&name=${encodeURIComponent(agent.name)}`,
  )
}

const handleToggleStatus = async (agent: AgentInfo) => {
  try {
    const ns = agent.namespace || 'default'
    await batataApi.updateAgent(ns, agent.name, {
      ...agent,
      enabled: !agent.enabled,
    })
    fetchItems()
  } catch (error) {
    logger.error('Failed to toggle agent status:', error)
    toast.apiError(error)
  }
}
</script>
