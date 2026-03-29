<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button @click="goBack" class="btn btn-ghost btn-sm">
          <ArrowLeft class="w-3.5 h-3.5" />
        </button>
        <div>
          <h1 class="text-base font-semibold text-text-primary">
            {{ itemName || t('agentDetail') }}
          </h1>
          <p class="text-xs text-text-secondary mt-0.5">{{ t('agentDetail') }}</p>
        </div>
      </div>
      <div v-if="detail" class="flex items-center gap-2">
        <button @click="handleEdit" class="btn btn-primary btn-sm">
          <Pencil class="w-3.5 h-3.5" />
          {{ t('edit') }}
        </button>
        <button @click="showDeleteModal = true" class="btn btn-ghost btn-sm text-danger">
          <Trash2 class="w-3.5 h-3.5" />
          {{ t('delete') }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="card p-8 text-center">
      <Loader2 class="w-8 h-8 animate-spin mx-auto text-primary" />
    </div>

    <template v-else-if="detail">
      <!-- Metadata Card -->
      <div class="card">
        <div class="p-4">
          <h3 class="text-sm font-medium text-text-primary mb-4">{{ t('basicInfo') }}</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <span class="text-sm text-text-secondary">{{ t('agentName') }}</span>
              <p class="font-medium text-text-primary">{{ detail.name }}</p>
            </div>
            <div>
              <span class="text-sm text-text-secondary">{{ t('namespace') }}</span>
              <p class="font-medium text-text-primary">{{ detail.namespace || 'default' }}</p>
            </div>
            <div>
              <span class="text-sm text-text-secondary">{{ t('status') }}</span>
              <p>
                <span :class="detail.enabled ? 'badge badge-success' : 'badge badge-danger'">
                  {{ detail.enabled ? t('enabled') : t('disabled') }}
                </span>
              </p>
            </div>
            <div>
              <span class="text-sm text-text-secondary">{{ t('model') }}</span>
              <p class="font-medium text-text-primary">{{ detail.model || 'default' }}</p>
            </div>
            <div>
              <span class="text-sm text-text-secondary">{{ t('temperature') }}</span>
              <p class="font-medium text-text-primary">{{ detail.temperature ?? 0.7 }}</p>
            </div>
            <div>
              <span class="text-sm text-text-secondary">{{ t('maxTokens') }}</span>
              <p class="font-medium text-text-primary">{{ detail.maxTokens ?? 4096 }}</p>
            </div>
            <div>
              <span class="text-sm text-text-secondary">{{ t('maxIterations') }}</span>
              <p class="font-medium text-text-primary">{{ detail.maxIterations ?? 10 }}</p>
            </div>
            <div v-if="detail.createTime">
              <span class="text-sm text-text-secondary">{{ t('createTime') }}</span>
              <p class="font-medium text-text-primary">
                {{ new Date(detail.createTime).toLocaleString() }}
              </p>
            </div>
            <div v-if="detail.modifyTime">
              <span class="text-sm text-text-secondary">{{ t('modifyTime') }}</span>
              <p class="font-medium text-text-primary">
                {{ new Date(detail.modifyTime).toLocaleString() }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Description Card -->
      <div class="card">
        <div class="p-4">
          <h3 class="text-sm font-medium text-text-primary mb-3">{{ t('description') }}</h3>
          <p class="text-sm text-text-secondary whitespace-pre-wrap">
            {{ detail.description || t('noDescription') }}
          </p>
        </div>
      </div>

      <!-- System Prompt Card -->
      <div v-if="detail.systemPrompt" class="card">
        <div class="p-4">
          <h3 class="text-sm font-medium text-text-primary mb-3">{{ t('systemPrompt') }}</h3>
          <pre
            class="text-sm text-text-secondary whitespace-pre-wrap font-mono bg-bg-secondary rounded-lg p-3"
            >{{ detail.systemPrompt }}</pre
          >
        </div>
      </div>

      <!-- MCP Servers Card -->
      <div class="card">
        <div class="p-4">
          <h3 class="text-sm font-medium text-text-primary mb-3">{{ t('mcpServers') }}</h3>
          <div
            v-if="detail.mcpServers && detail.mcpServers.length > 0"
            class="flex flex-wrap gap-1"
          >
            <span v-for="server in detail.mcpServers" :key="server" class="badge badge-info">
              <Server class="w-3 h-3" />
              {{ server }}
            </span>
          </div>
          <span v-else class="text-xs text-text-tertiary">{{ t('noData') }}</span>
        </div>
      </div>

      <!-- Tools Card -->
      <div class="card">
        <div class="p-4">
          <h3 class="text-sm font-medium text-text-primary mb-3">{{ t('tools') }}</h3>
          <div v-if="detail.tools && detail.tools.length > 0" class="flex flex-wrap gap-1">
            <span v-for="tool in detail.tools" :key="tool" class="badge">
              <Wrench class="w-3 h-3" />
              {{ tool }}
            </span>
          </div>
          <span v-else class="text-xs text-text-tertiary">
            {{ t('useAllAvailableTools') }}
          </span>
        </div>
      </div>

      <!-- Metadata Card -->
      <div v-if="detail.metadata && Object.keys(detail.metadata).length > 0" class="card">
        <div class="p-4">
          <h3 class="text-sm font-medium text-text-primary mb-3">{{ t('metadata') }}</h3>
          <div class="flex flex-wrap gap-1">
            <span v-for="(value, key) in detail.metadata" :key="key" class="badge badge-info">
              {{ key }}={{ value }}
            </span>
          </div>
        </div>
      </div>
    </template>

    <!-- Delete Confirm Modal -->
    <ConfirmModal
      v-model="showDeleteModal"
      :title="t('confirmDelete')"
      :message="`${t('confirmDeleteAgent')} ${itemName}?`"
      :confirm-text="t('delete')"
      danger
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowLeft, Pencil, Trash2, Loader2, Server, Wrench } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import { useDetailView } from '@/composables/useDetailView'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import type { AgentInfo } from '@/types'

const router = useRouter()
const { t } = useI18n()

const { namespace, itemName, loading, detail, showDeleteModal, goBack, confirmDelete } =
  useDetailView<AgentInfo>({
    fetchFn: (ns, name) => batataApi.getAgentDetail(ns, name),
    deleteFn: (ns, name) => batataApi.deleteAgent(ns, name),
    queryKey: 'agentName',
    listRoute: '/agents',
  })

const handleEdit = () => {
  router.push(
    `/agent/edit?namespace=${encodeURIComponent(namespace.value)}&name=${encodeURIComponent(itemName.value)}`,
  )
}
</script>
