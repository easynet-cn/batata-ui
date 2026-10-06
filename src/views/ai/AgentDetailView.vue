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
            {{ detail?.displayName || itemName || t('agentDetail') }}
          </h1>
          <p class="text-xs text-text-secondary mt-0.5">{{ t('agentDetail') }}</p>
        </div>
      </div>
      <div v-if="detail" class="flex items-center gap-2">
        <button @click="handleEdit" class="btn btn-primary btn-sm">
          <Pencil class="w-3.5 h-3.5" />
          {{ t('edit') }}
        </button>
        <button @click="openDeleteModal()" class="btn btn-ghost btn-sm text-danger">
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
      <!-- Basic Info -->
      <div class="card">
        <div class="p-4">
          <h3 class="text-sm font-medium text-text-primary mb-4">{{ t('basicInfo') }}</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <span class="text-sm text-text-secondary">{{ t('agentName') }}</span>
              <p class="font-medium text-text-primary">{{ detail.name }}</p>
            </div>
            <div v-if="detail.displayName">
              <span class="text-sm text-text-secondary">{{ t('agentDisplayName') }}</span>
              <p class="font-medium text-text-primary">{{ detail.displayName }}</p>
            </div>
            <div>
              <span class="text-sm text-text-secondary">{{ t('namespace') }}</span>
              <p class="font-medium text-text-primary">{{ detail.namespace || 'public' }}</p>
            </div>
            <div>
              <span class="text-sm text-text-secondary">{{ t('agentVersion') }}</span>
              <p class="font-medium text-text-primary">{{ detail.version || '-' }}</p>
            </div>
            <div>
              <span class="text-sm text-text-secondary">{{ t('agentUrl') }}</span>
              <p class="font-mono text-sm text-text-primary break-all">{{ detail.url || '-' }}</p>
            </div>
            <div>
              <span class="text-sm text-text-secondary">{{ t('agentProtocolVersion') }}</span>
              <p class="font-medium text-text-primary">{{ detail.protocolVersion || '-' }}</p>
            </div>
            <div v-if="detail.preferredTransport">
              <span class="text-sm text-text-secondary">{{ t('agentPreferredTransport') }}</span>
              <p class="font-medium text-text-primary">{{ detail.preferredTransport }}</p>
            </div>
            <div v-if="detail.healthStatus">
              <span class="text-sm text-text-secondary">{{ t('status') }}</span>
              <p>
                <span class="badge badge-secondary">{{ detail.healthStatus }}</span>
              </p>
            </div>
            <div v-if="detail.registeredAt">
              <span class="text-sm text-text-secondary">{{ t('createTime') }}</span>
              <p class="font-medium text-text-primary">
                {{ new Date(detail.registeredAt).toLocaleString() }}
              </p>
            </div>
            <div v-if="detail.updatedAt">
              <span class="text-sm text-text-secondary">{{ t('modifyTime') }}</span>
              <p class="font-medium text-text-primary">
                {{ new Date(detail.updatedAt).toLocaleString() }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Description -->
      <div class="card">
        <div class="p-4">
          <h3 class="text-sm font-medium text-text-primary mb-3">{{ t('description') }}</h3>
          <p class="text-sm text-text-secondary whitespace-pre-wrap">
            {{ detail.description || t('noDescription') }}
          </p>
        </div>
      </div>

      <!-- Capabilities & Modes -->
      <div class="card">
        <div class="p-4 space-y-3">
          <div>
            <h3 class="text-sm font-medium text-text-primary mb-2">
              {{ t('agentCapabilities') }}
            </h3>
            <div v-if="enabledCapabilities.length > 0" class="flex flex-wrap gap-1">
              <span v-for="cap in enabledCapabilities" :key="cap" class="badge badge-info">
                {{ t(cap) }}
              </span>
            </div>
            <span v-else class="text-xs text-text-tertiary">{{ t('noData') }}</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <span class="text-sm text-text-secondary">{{ t('agentInputModes') }}</span>
              <p class="text-text-primary">
                {{ detail.defaultInputModes?.join(', ') || '-' }}
              </p>
            </div>
            <div>
              <span class="text-sm text-text-secondary">{{ t('agentOutputModes') }}</span>
              <p class="text-text-primary">
                {{ detail.defaultOutputModes?.join(', ') || '-' }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Skills -->
      <div class="card">
        <div class="p-4">
          <h3 class="text-sm font-medium text-text-primary mb-3">{{ t('agentSkills') }}</h3>
          <div v-if="detail.skills && detail.skills.length > 0" class="space-y-2">
            <div
              v-for="skill in detail.skills"
              :key="skill.name"
              class="flex items-start justify-between gap-3 border-b border-border last:border-0 pb-2 last:pb-0"
            >
              <div>
                <p class="font-medium text-text-primary">{{ skill.name }}</p>
                <p class="text-xs text-text-secondary">{{ skill.description || '-' }}</p>
              </div>
              <span v-if="skill.proficiency" class="badge badge-secondary">
                {{ skill.proficiency }}
              </span>
            </div>
          </div>
          <span v-else class="text-xs text-text-tertiary">{{ t('agentNoSkills') }}</span>
        </div>
      </div>

      <!-- Provider & Links -->
      <div class="card">
        <div class="p-4">
          <h3 class="text-sm font-medium text-text-primary mb-3">{{ t('agentProvider') }}</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <span class="text-sm text-text-secondary">{{ t('agentProviderOrg') }}</span>
              <p class="text-text-primary">{{ detail.provider?.organization || '-' }}</p>
            </div>
            <div>
              <span class="text-sm text-text-secondary">{{ t('agentProviderUrl') }}</span>
              <p class="text-text-primary break-all">{{ detail.provider?.url || '-' }}</p>
            </div>
            <div>
              <span class="text-sm text-text-secondary">{{ t('agentDocumentationUrl') }}</span>
              <p class="text-text-primary break-all">{{ detail.documentationUrl || '-' }}</p>
            </div>
            <div>
              <span class="text-sm text-text-secondary">{{ t('agentIconUrl') }}</span>
              <p class="text-text-primary break-all">{{ detail.iconUrl || '-' }}</p>
            </div>
            <div class="md:col-span-2">
              <span class="text-sm text-text-secondary">{{ t('agentTags') }}</span>
              <div v-if="detail.tags && detail.tags.length > 0" class="flex flex-wrap gap-1 mt-1">
                <span v-for="tag in detail.tags" :key="tag" class="badge">{{ tag }}</span>
              </div>
              <span v-else class="text-xs text-text-tertiary">-</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Metadata -->
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
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Pencil, Trash2, Loader2 } from '@lucide/vue'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import { useDetailView } from '@/composables/useDetailView'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import type { AgentInfo } from '@/types'

type CapabilityLabel =
  | 'agentCapStreaming'
  | 'agentCapMultiTurn'
  | 'agentCapToolUse'
  | 'agentCapFileAttachments'
  | 'agentCapImages'
  | 'agentCapAudio'
  | 'agentCapVideo'

const router = useRouter()
const { t } = useI18n()

const { namespace, itemName, loading, detail, showDeleteModal, goBack, confirmDelete } =
  useDetailView<AgentInfo>({
    fetchFn: (ns, name) => batataApi.getAgentDetail(ns, name),
    deleteFn: (ns, name) => batataApi.deleteAgent(ns, name),
    queryKey: 'agentName',
    listRoute: '/agents',
  })

function openDeleteModal() {
  showDeleteModal.value = true
}

const enabledCapabilities = computed<CapabilityLabel[]>(() => {
  const caps = detail.value?.capabilities
  if (!caps) return []
  const result: CapabilityLabel[] = []
  if (caps.streaming) result.push('agentCapStreaming')
  if (caps.multiTurn) result.push('agentCapMultiTurn')
  if (caps.toolUse) result.push('agentCapToolUse')
  if (caps.fileAttachments) result.push('agentCapFileAttachments')
  if (caps.images) result.push('agentCapImages')
  if (caps.audio) result.push('agentCapAudio')
  if (caps.video) result.push('agentCapVideo')
  return result
})

const handleEdit = () => {
  router.push(
    `/agent/edit?namespace=${encodeURIComponent(namespace.value)}&name=${encodeURIComponent(itemName.value)}`,
  )
}
</script>
